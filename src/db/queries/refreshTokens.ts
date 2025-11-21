import { db } from "../index.js";
import { NewRefreshToken, refreshTokens, users } from "../schema.js";
import { and, eq, isNull } from "drizzle-orm";

export async function createRefreshToken(refreshToken: NewRefreshToken) {
    const [result] = await db
        .insert(refreshTokens)
        .values(refreshToken)
        .returning();
    return result;
}

export async function getUserFromRefreshToken(token: string) {
    const [result] = await db
        .select({
            id: users.id,
            email: users.email,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
        .from(refreshTokens)
        .innerJoin(users, eq(refreshTokens.userId, users.id))
        .where(
            and(
                eq(refreshTokens.token, token),
                isNull(refreshTokens.revokedAt),
            ),
        );

    if (!result) {
        return null;
    }

    // Check if token is expired
    const tokenRecord = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token));

    if (tokenRecord.length === 0 || new Date() > tokenRecord[0].expiresAt) {
        return null;
    }

    return result;
}

export async function revokeRefreshToken(token: string) {
    await db
        .update(refreshTokens)
        .set({
            revokedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(refreshTokens.token, token));
}
