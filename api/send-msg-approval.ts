import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { sendTelegramMessage } from "../server/Social_Media_Updates/TelegramMsgUpdate.js";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { owner, approved_to, tokenid } = req.body;
        console.log("Received token info:", { tokenid, owner, approved_to });


        const text = `NFT Approval Alert!\nToken ID: ${tokenid}\nOwner: ${owner}\nApproved To: ${approved_to}`;
        console.log(text);

        let telegramResult: any = null;
        try {
            telegramResult = await sendTelegramMessage(text);

            return res.json({
                success: telegramResult?.success === true,
                message: telegramResult?.success === true ? "Message sent to telegram." : "Message not sent to telegram.",
                data: telegramResult
            });

        } catch (tgErr) {
            console.error("Failed to send Telegram message:", tgErr);

            return res.status(500).json({
                success: false,
                message: "Failed to send Telegram message",
                error: tgErr instanceof Error ? tgErr.message : String(tgErr)
            });
        }

    } catch (error) {
        console.error("Error in /api/send-msg:", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

export default allowCors(handler);
