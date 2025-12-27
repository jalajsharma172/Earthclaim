import { createThirdwebClient } from "thirdweb";
// Create and export the Thirdweb client
// Get your client ID from: https://thirdweb.com/dashboard/settings/api-keys
export const thirdwebClient = createThirdwebClient({
    clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "your-client-id-here"
});
