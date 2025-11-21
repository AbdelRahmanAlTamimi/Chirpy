import argon2 from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request } from "express"
import crypto from "crypto";

export async function hashPassword(password: string) {
    return argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string) {
    return argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    const iat = Math.floor(Date.now() / 1000);
    type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
    const payload: payload = {
        iss: "chirpy",
        sub: userID,
        iat: iat,
        exp: (iat + expiresIn)
    }
    return jwt.sign(payload, secret)
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        const decodedToken = jwt.verify(tokenString, secret) as JwtPayload;
        // Return the user's id from the token (which should be stored in the sub field).
        return decodedToken.sub as string;
    } catch (err: any) {
        // the token is invalid, throw a suitable error.
        if (err.name === "JsonWebTokenError") {
            throw new Error("the token is invalid");
        } else if (err.name === "TokenExpiredError") {
            throw new Error("the token has expired.");
        }
        throw err;
    }
}

export function getBearerToken(req: Request): string {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        throw new Error("Authorization header is missing");
    }
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
        throw new Error("Authorization header is missing");
    }
    return token;
}

export function makeRefreshToken(): string {
    return crypto.randomBytes(32).toString("hex");
}