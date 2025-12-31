import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { SaveFreePolygon } from '../shared/Get_Polygons.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });
    }

    try {
        const { ip, wallet, coordinates, name } = req.body;

        if (!ip || !wallet || !coordinates || !name) return res.status(400).json({
            success: false,
            message: "Missing required fields: ip, wallet, coordinates or name"
        });

        const data = await SaveFreePolygon(wallet, ip, coordinates, name);

        if (data) {
            return res.status(200).json({
                success: true,
                message: "Data received successfully",
                data: data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Data not received successfully"
            });
        }
    } catch (error) {
        console.error("Error in /api/free-polygons:", error);
        res.status(500).json({ success: false, message: "Server error", error: error });
    }
}

export default allowCors(handler);
