import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Wraps an API handler to add CORS headers automatically.
 * 
 * @param handler The API handler function
 * @returns A wrapped handler that handles OPTIONS requests and adds CORS headers
 */
export function allowCors(handler: (req: VercelRequest, res: VercelResponse) => Promise<any> | any) {
    return async (req: VercelRequest, res: VercelResponse) => {
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

        return await handler(req, res);
    };
}
