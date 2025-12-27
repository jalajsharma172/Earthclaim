import { supabase } from "./supabaseClient.js";
import sendTelegramMessage from "../server/Social_Media_Updates/TelegramMsgUpdate.js";
/**
 * Fetches the top 3 users from the LeaderBoard table
 * ordered by Number_of_NFTs in descending order
 * @returns Promise with success status and top 3 users data
 */
export async function getTop3Rewards() {
    try {
        const { data, error } = await supabase
            .from("LeaderBoard")
            .select("UserName, Number_of_NFTs, Address")
            .order("Number_of_NFTs", { ascending: false })
            .limit(3);
        if (error) {
            console.error("Error fetching top 3 users:", error);
            return {
                success: false,
                message: "Failed to fetch top 3 users from database",
                error: error.message,
            };
        }
        if (!data || data.length === 0) {
            return {
                success: false,
                message: "No users found in leaderboard",
                data: [],
            };
        }
        const text = `Top 3 Users:\n${data.map(user => `- ${user.UserName} (${user.Number_of_NFTs} NFTs)`).join("\n")}`;
        await sendTelegramMessage(text);
        return {
            success: true,
            message: `Found ${data.length} top users for rewards`,
            data: data,
        };
    }
    catch (err) {
        console.error("Error in getTop3Rewards:", err);
        return {
            success: false,
            message: err instanceof Error ? err.message : "Unknown error occurred",
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
