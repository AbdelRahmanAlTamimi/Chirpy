import type { Request, Response } from "express";
import { BadRequestError } from "./errors.js";
import { NewChirp } from "../db/schema.js";
import { createChirp, getAllChirps } from "../db/queries/chirps.js";

export async function handlerCreateChirp(req: Request, res: Response) {
    const body = req.body.body;
    const userId = req.body.userId;
    const cleanedBody = validateChirp(body);
    const chirp: NewChirp = { body: cleanedBody, userId: userId };

    const newChirp = await createChirp(chirp)

    res.status(201).send(newChirp)

}

export async function handlerGetChirps(req: Request, res: Response) {
    const allChirps = await getAllChirps();
    res.status(200).send(allChirps);
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

