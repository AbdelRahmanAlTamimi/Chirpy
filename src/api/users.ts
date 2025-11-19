import type { Request, Response } from "express";
import { createUser } from "../db/queries/users.js";
import { NewUser } from "../db/schema.js";

export async function handlerCreateUser(req: Request, res: Response) {
    const email = req.body.email
    const user: NewUser = { email: email }
    const newUser = await createUser(user)
    res.status(201).send(newUser)
}

