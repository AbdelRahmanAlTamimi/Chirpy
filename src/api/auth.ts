import { getUserByEmail } from "../db/queries/users.js";
import { checkPasswordHash, makeJWT } from "../auth.js";
import { respondWithJSON } from "./json.js";
import { UserNotAuthenticatedError } from "./errors.js";
import { config } from "../config.js";

import type { Request, Response } from "express";
import type { UserResponse } from "./users.js";

type LoginResponse = UserResponse & { token: string };

export async function handlerLogin(req: Request, res: Response) {
    type parameters = {
        password: string;
        email: string;
        expiresInSeconds?: number
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

    // Determine expiration time
    const oneHourInSeconds = 3600;
    let expiresInSeconds = oneHourInSeconds; // default

    if (params.expiresInSeconds !== undefined) {
        // Use provided time or cap at 1 hour, whichever is smaller
        expiresInSeconds = Math.min(params.expiresInSeconds, oneHourInSeconds);
    }

    const token = makeJWT(user.id, expiresInSeconds, config.api.jwtSecret);

    respondWithJSON(res, 200, {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token: token,
    } satisfies LoginResponse);
}
