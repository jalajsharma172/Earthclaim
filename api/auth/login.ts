import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from '../utils/cors.js';
import { loginSchema } from "../../shared/schema.js";
import { SuprabaseStorageService } from "../../shared/login.js";
import { z } from "zod";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        console.log("Login request body:", req.body);
        const { useremail, username, walletAddress } = loginSchema.parse(req.body);

        let user;
        if (walletAddress || (useremail && useremail.trim() !== "")) {
            user = await SuprabaseStorageService(username, useremail, walletAddress);
        }

        return res.json({ user });
    } catch (error) {
        console.error("Login error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return res.status(500).json({ message: "Server error", error: errorMessage });
        }
    }
}

export default allowCors(handler);
