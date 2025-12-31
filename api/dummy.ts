import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        return res.status(200).json({
            success: true,
            message: "Dummy Data",
            method: req.method,
            query: req.query,
            body: req.body
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export default allowCors(handler);
