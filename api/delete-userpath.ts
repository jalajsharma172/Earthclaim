import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { clearUserPath } from '../shared/Delete_Path.js';

// Alias for DELETE /api/paths, kept for compatibility if frontend uses this specific route
async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE' && req.method !== 'POST') { // Some clients might use POST for delete
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ mmessage: "Unable to get info from api " });
        }

        console.log("Servser side Name   ::  ", username);
        const polygonstatus = await clearUserPath(username);

        if (polygonstatus.success == true) {
            return res.status(200).json({
                success: true,
                message: "Polygon delete from  Db successfully"
            });
        } else {
            return res.status(200).json({ success: false });
        }
    } catch (error) {
        console.error('Error fetching paths:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error at server side api',
        });
    }
}

export default allowCors(handler);
