import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { TokenInfo } from "../shared/TokenInfo.js";
import fetchTokenURI from "../shared/fetchTokenURI.js";
import { ethers } from "ethers";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { tokenURI, tokenId } = req.body;
        console.log("Received token info:", { tokenId, tokenURI });


        const recipient = tokenURI;
        // Always fetch tokenURI from contract
        let actualTokenURI;
        try {
            // Create server-side provider
            const provider = new ethers.JsonRpcProvider(process.env.VITE_PROVIDER || "https://eth-sepolia.g.alchemy.com/v2/6JXy53iLZpJ3fxoFvQNAvMJi4Y4tmC_5");
            actualTokenURI = await fetchTokenURI(tokenId, provider);
            console.log("Fetched tokenURI from contract:", actualTokenURI);


        } catch (contractError) {
            console.error("Failed to fetch tokenURI from contract:", contractError);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch tokenURI from contract",
                error: contractError instanceof Error ? contractError.message : String(contractError)
            });
        }


        const tokeninfo = await TokenInfo(recipient, actualTokenURI, tokenId);
        if (tokeninfo.success == true) {
            return res.status(200).json({
                success: true,
                message: "TokenInfo Saved .",
                recipient: recipient,
                tokenURI: actualTokenURI,
                tokenId: tokenId,
                data: tokeninfo
            });
        } else {

            return res.status(500).json({
                success: false,
                message: "TokenInfo Not Saved .",
                recipient: recipient,
                tokenURI: actualTokenURI,
                tokenId: tokenId,
                data: tokeninfo
            });
        }

    } catch (error) {
        console.error("Error in /api/tokeninfo:", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

export default allowCors(handler);
