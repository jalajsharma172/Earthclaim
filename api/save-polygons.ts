import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { uploadJsonToIPFS } from '../server/uploafToIPFS.js'; // Note: Typo in filename from original
import { savePolygon } from "../shared/Save_Polygon.js";
import { polygon } from "@turf/helpers";
import area from "@turf/area";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, polygonName, polygons } = req.body;

        if (!username || !polygonName || !polygons) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: username, polygonName, or polygons"
            });
        }

        console.log("Server side Name :: ", username);

        // Handle IPFS error handling
        const IPFS = await uploadJsonToIPFS(polygons);
        console.log("IPFS : ", IPFS);

        if (IPFS === "Error") {
            return res.status(500).json({
                success: false,
                message: "IPFS upload failed"
            });
        }

        // 1. Map to [lng, lat]
        const coords = polygons.map((p: any) => [p.lng, p.lat]);

        // 2. Close loop
        if (coords.length > 0 &&
            (coords[0][0] !== coords[coords.length - 1][0] ||
                coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push(coords[0]);
        }

        // 3. Calculate Area
        const turfPolygon = polygon([coords]);
        const areaInSqMeters = area(turfPolygon);

        console.log("Polygon Area (m²):", areaInSqMeters);

        // 4. Save to DB
        const polygonstatus = await savePolygon(username, polygonName, areaInSqMeters, IPFS);

        if (polygonstatus.success === true) {
            return res.status(200).json({
                success: true,
                message: "Polygon saved to database successfully",
                totalArea_m2: areaInSqMeters,
                IPFS: IPFS,
            });
        } else {
            console.error("Can't save polygon to db:", polygonstatus.error);
            return res.status(500).json({
                success: false,
                message: polygonstatus.message || "Failed to save polygon to database",
                error: polygonstatus.error
            });
        }

    } catch (error) {
        console.error("Error in /api/save-polygons:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export default allowCors(handler);
