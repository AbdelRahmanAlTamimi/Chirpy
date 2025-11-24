import { getUserByEmail } from "../db/queries/users.js";
import { checkPasswordHash, makeJWT, makeRefreshToken, getBearerToken } from "../auth.js";
import { respondWithJSON } from "./json.js";
import { UserNotAuthenticatedError } from "./errors.js";
import { config } from "../config.js";
import { createRefreshToken, getUserFromRefreshToken, revokeRefreshToken } from "../db/queries/refreshTokens.js";

import type { Request, Response } from "express";
import type { UserResponse } from "./users.js";

type LoginResponse = UserResponse & { token: string; refreshToken: string };

export async function handlerLogin(req: Request, res: Response) {
    type parameters = {
        password: string;
        email: string;
    };

    const params: parameters = req.body;

    const user = await getUserByEmail(params.email);
    if (!user) {
        throw new UserNotAuthenticatedError("invalid username or password");
    }

    const matching = await checkPasswordHash(
        params.password,
        user.hashedPassword,
    );
    if (!matching) {
        throw new UserNotAuthenticatedError("invalid username or password");
    }

    // Create access token with 1 hour expiration
    const oneHourInSeconds = 3600;
    const accessToken = makeJWT(user.id, oneHourInSeconds, config.api.jwtSecret);

    // Create refresh token with 60 days expiration
    const refreshTokenString = makeRefreshToken();
    const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + sixtyDaysInMs);

    await createRefreshToken({
        token: refreshTokenString,
        userId: user.id,
        expiresAt: expiresAt,
        revokedAt: null,
    });

    respondWithJSON(res, 200, {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token: accessToken,
        refreshToken: refreshTokenString,
        isChirpyRed: user.isChirpyRed,
    } satisfies LoginResponse);
}

type RefreshResponse = { token: string };

export async function handlerRefresh(req: Request, res: Response) {
    let refreshTokenString: string;
    try {
        refreshTokenString = getBearerToken(req);
    } catch (err) {
        throw new UserNotAuthenticatedError("Missing or invalid refresh token");
    }

    const user = await getUserFromRefreshToken(refreshTokenString);
    if (!user) {
        throw new UserNotAuthenticatedError("Invalid, expired, or revoked refresh token");
    }

    // Create a new access token with 1 hour expiration
    const oneHourInSeconds = 3600;
    const newAccessToken = makeJWT(user.id, oneHourInSeconds, config.api.jwtSecret);

    respondWithJSON(res, 200, {
        token: newAccessToken,
    } satisfies RefreshResponse);
}

export async function handlerRevoke(req: Request, res: Response) {
    let refreshTokenString: string;
    try {
        refreshTokenString = getBearerToken(req);
    } catch (err) {
        throw new UserNotAuthenticatedError("Missing or invalid refresh token");
    }

    await revokeRefreshToken(refreshTokenString);

    res.status(204).send();
}
