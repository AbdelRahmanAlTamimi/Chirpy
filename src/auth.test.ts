import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT, hashPassword, checkPasswordHash } from "./auth.js";

describe("Password Hashing", () => {
    const password1 = "correctPassword123!";
    const password2 = "anotherPassword456!";
    let hash1: string;
    let hash2: string;

    beforeAll(async () => {
        hash1 = await hashPassword(password1);
        hash2 = await hashPassword(password2);
    });

    it("should return true for the correct password", async () => {
        const result = await checkPasswordHash(password1, hash1);
        expect(result).toBe(true);
    });
});

describe("JWT Creation and Validation", () => {
    const secret = "testsecret123";
    const userID = "user-123";
    const expiresIn = 3600;

    it("should create and validate a JWT", () => {
        const token = makeJWT(userID, expiresIn, secret);
        const decodedUserID = validateJWT(token, secret);
        expect(decodedUserID).toBe(userID);
    });

    it("should reject a JWT with the wrong secret", () => {
        const token = makeJWT(userID, expiresIn, secret);
        const wrongSecret = "wrongsecret456";
        expect(() => validateJWT(token, wrongSecret)).toThrow("the token is invalid");
    });

    it("should reject an expired token", () => {
        const expiredToken = makeJWT(userID, -1, secret);
        expect(() => validateJWT(expiredToken, secret)).toThrow("the token has expired.");
    });
});