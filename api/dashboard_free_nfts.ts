import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { getFreePolygonsFromWalletAddress } from '../shared/Get_Polygons.js';

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
        const { walletAddress } = req.body;

        if (!walletAddress) {
            console.log("Username is missing or empty - returning 400");
            return res.status(400).json({
                success: false,
                message: 'No UserName found at API Body'
            });
        }
        const data = await getFreePolygonsFromWalletAddress(walletAddress);
        // console.log("data", data);
        if (data.success) {
            return res.status(200).json({
                success: true,
                status: true,
                data: data.data
            });
        } else {
            return res.status(404).json({
                success: false,
                data: data,
                status: false
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error
        });
    }
}

export default allowCors(handler);
