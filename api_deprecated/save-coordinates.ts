import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { saveLocationToSupabase } from "../shared/SaveCooridnates.js"; // Note: Typo in filename from original

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, latitude, longitude } = req.body;
        console.log(username, latitude, longitude);

        const success = await saveLocationToSupabase(username, latitude, longitude);
        if (success) {
            return res.json({ success: true, message: "Coordinates saved" });
        }
        return res.status(500).json({ success: false, message: "Failed to save coordinates" });

    } catch (err) {
        console.log("Error in saving ", err);
        return res.status(500).json({ success: false, error: String(err) });
    }
}

export default allowCors(handler);
