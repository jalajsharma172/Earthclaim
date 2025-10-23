import axios from 'axios';

const DEFAULT_CHAT_ID = 7074622623;

/**
 * Send a message to a Telegram chat (group).
 * - Reads bot token from process.env.TELEGRAM_BOT_TOKEN unless botToken is provided.
 * - chatId can be number or string (group id or @channelname).
 */
export async function sendTelegramMessage(
  text_msg: string,
  chatId: number | string = DEFAULT_CHAT_ID,
  botToken?: string
): Promise<any> {
  const token = botToken ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set. Provide botToken or set env var.');

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const { data } = await axios.post(
      url,
      { chat_id: chatId, text: text_msg },
      { headers: { 'content-type': 'application/json' } }
    );
    
    return {success:true,data};
  } catch (error) {
    // bubble up for caller to handle/log
     return {success:false,error};
  }
}

export default sendTelegramMessage;