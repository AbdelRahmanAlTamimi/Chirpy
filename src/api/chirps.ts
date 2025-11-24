import type { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError, UserForbiddenError, NotFoundError } from "./errors.js";
import { NewChirp } from "../db/schema.js";
import { createChirp, getAllChirps, getChirpById, deleteChirp, getChirpsByAuthorId } from "../db/queries/chirps.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";
import { respondWithJSON } from "./json.js";

export async function handlerCreateChirp(req: Request, res: Response) {
    // Extract and validate JWT from Authorization header
    let userId: string;
    try {
        const token = getBearerToken(req);
        userId = validateJWT(token, config.api.jwtSecret);
    } catch (err) {
        throw new UserNotAuthenticatedError("Invalid or missing authentication token");
    }

    const body = req.body.body;
    const cleanedBody = validateChirp(body);
    const chirp: NewChirp = { body: cleanedBody, userId: userId };

    const newChirp = await createChirp(chirp)

    respondWithJSON(res, 201, newChirp);
}

export async function handlerGetChirps(req: Request, res: Response) {
    let authorId = "";
    const authorIdQuery = req.query?.authorId;

    if (typeof authorIdQuery === "string") {
        authorId = authorIdQuery;
    }

    let chirps = authorId
        ? await getChirpsByAuthorId(authorId)
        : await getAllChirps();

    // Handle sort query parameter
    const sortQuery = req.query?.sort;
    const sortOrder = typeof sortQuery === "string" ? sortQuery : "asc";

    if (sortOrder === "desc") {
        chirps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
        // Default to asc
        chirps.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    res.status(200).send(chirps);
}

export async function handlerGetChirpById(req: Request, res: Response) {
    const chirpId = req.params.chirpID;
    const chirp = await getChirpById(chirpId);

    if (!chirp) {
        res.status(404).send({ error: "Chirp not found" });
        return;
    }

    res.status(200).send(chirp);
}

export async function handlerDeleteChirp(req: Request, res: Response) {
    // Extract and validate JWT from Authorization header
    let userId: string;
    try {
        const token = getBearerToken(req);
        userId = validateJWT(token, config.api.jwtSecret);
    } catch (err) {
        throw new UserNotAuthenticatedError("Invalid or missing authentication token");
    }

    const chirpId = req.params.chirpID;
    const chirp = await getChirpById(chirpId);

    if (!chirp) {
        throw new NotFoundError("Chirp not found");
    }

    if (chirp.userId !== userId) {
        throw new UserForbiddenError("You are not authorized to delete this chirp");
    }

    await deleteChirp(chirpId);

    res.status(204).send();
}



function validateChirp(body: string) {

    const maxChirpLength = 140;
    if (body.length > maxChirpLength) {
        throw new BadRequestError(
            `Chirp is too long. Max length is ${maxChirpLength}`,
        );
    }

    const words = body.split(" ");

    const badWords = ["kerfuffle", "sharbert", "fornax"];
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const loweredWord = word.toLowerCase();
        if (badWords.includes(loweredWord)) {
            words[i] = "****";
        }
    }

    const cleaned = words.join(" ");

    return cleaned
}

