import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Standard Vercel Serverless Function (Solution 1).
 * Use this to verify that Vercel itself is working, independent of Express or Database.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({
        success: true,
        message: "Vercel Function is working!",
        timestamp: new Date().toISOString()
    });
}
