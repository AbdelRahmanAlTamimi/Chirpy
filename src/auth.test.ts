import { describe, it, expect, beforeAll, vi } from "vitest";
import { makeJWT, validateJWT, hashPassword, checkPasswordHash, getAPIKey } from "./auth.js";
import { Request } from "express";

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

describe("getAPIKey", () => {
    it("returns the API key when the Authorization header is present", () => {
        const headerValue = "ApiKey test-key";
        const req = {
            get: vi.fn().mockReturnValue(headerValue),
        } as unknown as Request;

        const apiKey = getAPIKey(req);

        expect(req.get).toHaveBeenCalledWith("Authorization");
        expect(apiKey).toBe("test-key");
    });

    it("throws when the Authorization header is missing", () => {
        const req = {
            get: vi.fn().mockReturnValue(undefined),
        } as unknown as Request;

        expect(() => getAPIKey(req)).toThrow("Authorization header is missing");
    });

    it("throws when the Authorization header is invalid", () => {
        const req = {
            get: vi.fn().mockReturnValue("Bearer something"),
        } as unknown as Request;

        expect(() => getAPIKey(req)).toThrow("Authorization header is missing");
    });

    it("throws when the Authorization header is empty after trimming", () => {
        const req = {
            get: vi.fn().mockReturnValue("ApiKey   "),
        } as unknown as Request;

        expect(() => getAPIKey(req)).toThrow("Authorization header is missing");
    });
});