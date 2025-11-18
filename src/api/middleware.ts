import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { respondWithError } from "./json.js";


export function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
    res.on("finish", () => {
        if (res.statusCode >= 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`)
        }
    });
    next()
}

export function middlewareMetricsInc(_: Request, __: Response, next: NextFunction) {
    config.fileServerHits++;
    next()
}

export function errorMiddleware(
    err: Error,
    _: Request,
    res: Response,
    __: NextFunction,
) {
    let statusCode = 500;
    let message = "Something went wrong on our end";

    console.log(err.message);

    respondWithError(res, statusCode, message);
}