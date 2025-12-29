import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFreePolygon } from '../shared/Get_Polygons.js';
import { FREE_POLYGONS } from '../server/freePolygons.js';

/**
 * Standalone Vercel Function for /api/free-polygons.
 * Segregating this ensures it doesn't wait for the entire Express app to bootstrap.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Set CORS headers manually since this bypasses Express
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        );

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        console.log("[Vercel] Fetching Free Polygons (Standalone)...");

        // Try fetching from DB
        const dbPolygons = await getFreePolygon();

        // If DB returns data, use it.
        if (dbPolygons && dbPolygons.length > 0) {
            return res.status(200).json(dbPolygons);
        }

        console.warn("[Vercel] DB returned no data, using fallback.");
        return res.status(200).json(FREE_POLYGONS);

    } catch (error) {
        console.error("[Vercel] Error in free-polygons:", error);
        // Fallback on error
        return res.status(200).json(FREE_POLYGONS);
    }
}
