import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { getTokenId } from "../shared/Get_ID.js";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { tokenURI } = req.body;
        console.log("Received token info:", { tokenURI });
        const tokenID = await getTokenId(tokenURI);

        if (tokenID.success == true) {
            return res.status(200).json({
                success: true,
                message: "Token ID fetched successfully .",
                tokenID: tokenID.tokenID
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Token ID Not fetched .",
                tokenID: tokenID.tokenID
            });
        }

    } catch (err) {
        console.log("Error is at server ", err);
        return res.status(500).json({
            success: false,
            message: "Server Error in fetching Token ID .",
        });
    }
}

export default allowCors(handler);
