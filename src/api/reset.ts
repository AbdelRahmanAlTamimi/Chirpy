import type { Request, Response } from "express";
import { config } from "../config.js";
import { deleteUsers } from "../db/queries/users.js";

export async function handlerReset(_: Request, res: Response) {
    if (config.api.platform != "dev")  {
        res.status(403).send("forbidden endpoint")
        res.end();
    }
    config.api.fileServerHits = 0;
    await deleteUsers()
    res.write("Hits reset to 0 and all users have been deleted");
    res.end();
}