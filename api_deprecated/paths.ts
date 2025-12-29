import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { upsertUserPath } from '../shared/Save_Path.js';
import { clearUserPath } from '../shared/Delete_Path.js';
import { getUserPathByUsername } from '../shared/Get_Path.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    // POST: Save Paths
    if (req.method === 'POST') {
        try {
            const { username, paths } = req.body;

            if (!username || !paths || !Array.isArray(paths)) {
                return res.status(400).json({
                    success: false,
                    message: "Username and paths are required.",
                });
            }

            console.log("Received username:", username, "and paths:", paths);
            const result = await upsertUserPath(username, paths);

            if (result.success) {
                return res.status(201).json({
                    success: true,
                    message: "Paths saved successfully",
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to save paths to database",
                });
            }
        } catch (error) {
            console.error("Error in /api/paths:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // DELETE: Delete Paths
    if (req.method === 'DELETE') {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ success: false, message: "Username is required." });
            }

            const path = await clearUserPath(username);
            if (path.success == true) {
                return res.status(200).json({ message: 'Paths deleted successfully' });
            } else {
                return res.status(500).json({ message: 'Path is Not Deleted Successfully' });
            }
        } catch (error) {
            console.error('Error deleting paths:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // GET: Get Paths
    if (req.method === 'GET') {
        try {
            // Support query param or body (though GET body is rare/non-standard, supporting query is better)
            const username = req.query.username as string || req.body?.username;

            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            console.log("Server side Name :: ", username);
            const getUserPath = await getUserPathByUsername(username);
            return res.json(getUserPath);
        } catch (error) {
            console.error('Error fetching paths:', error);
            return res.status(500).json({
                success: false,
                path: [],
                message: 'Internal server error'
            });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}

export default allowCors(handler);
