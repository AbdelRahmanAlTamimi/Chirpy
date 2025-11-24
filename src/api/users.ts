import type { Request, Response } from "express";

import { createUser, getUserById, updateUser } from "../db/queries/users.js";
import { BadRequestError, UserNotAuthenticatedError, UserForbiddenError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { NewUser } from "src/db/schema.js";
import { hashPassword, getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";

export type UserResponse = Omit<NewUser, "hashedPassword">;

export async function handlerUsersCreate(req: Request, res: Response) {
    type parameters = {
        email: string;
        password: string;
    };
    const params: parameters = req.body;

    if (!params.password || !params.email) {
        throw new BadRequestError("Missing required fields");
    }

    const hashedPassword = await hashPassword(params.password);

    const user = await createUser({
        email: params.email,
        hashedPassword,
    } satisfies NewUser);

    if (!user) {
        throw new Error("Could not create user");
    }

    respondWithJSON(res, 201, {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isChirpyRed: user.isChirpyRed,
    } satisfies UserResponse);
}

export async function handlerUsersUpdate(req: Request, res: Response) {
    // Validate and extract the access token
    let token: string;
    try {
        token = getBearerToken(req);
    } catch (err) {
        throw new UserNotAuthenticatedError("Missing or invalid access token");
    }

    // Validate the JWT and get the user ID
    let userId: string;
    try {
        userId = validateJWT(token, config.api.jwtSecret);
    } catch (err) {
        throw new UserNotAuthenticatedError("Invalid or expired access token");
    }

    type parameters = {
        email: string;
        password: string;
    };
    const params: parameters = req.body;

    if (!params.password || !params.email) {
        throw new BadRequestError("Missing required fields");
    }

    // Get the user to verify they exist
    const user = await getUserById(userId);
    if (!user) {
        throw new UserForbiddenError("User not found");
    }

    const hashedPassword = await hashPassword(params.password);

    const updatedUser = await updateUser(userId, params.email, hashedPassword);

    if (!updatedUser) {
        throw new Error("Could not update user");
    }

    respondWithJSON(res, 200, {
        id: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        isChirpyRed: user.isChirpyRed
    } satisfies UserResponse);
}
