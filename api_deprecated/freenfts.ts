import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { getFreePolygonsFromWalletAddress } from "../shared/Get_Polygons.js";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            console.log("Wallet address is missing");
            return res.status(400).json({
                success: false,
                message: 'No walletAddress found at API Body'
            });
        }

        const data = await getFreePolygonsFromWalletAddress(walletAddress);

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
