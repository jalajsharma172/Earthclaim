import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
// Import directly from the server file; in Vercel build, this relative import 
// works if the file is included in the build.
import { FREE_POLYGONS } from '../server/freePolygons.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log("Serving static free polygons (Serverless).");
        return res.status(200).json(FREE_POLYGONS);
    } catch (error) {
        console.error("Error in free-polygons handler:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

export default allowCors(handler);
