import type { Request, Response } from "express";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.js";
import { NewChirp } from "../db/schema.js";
import { createChirp, getAllChirps, getChirpById } from "../db/queries/chirps.js";
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
    const allChirps = await getAllChirps();
    res.status(200).send(allChirps);
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

