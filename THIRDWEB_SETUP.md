# Thirdweb Wallet Integration Setup

## Overview
The Earthclaim navbar now uses Thirdweb SDK for wallet connection, featuring:
- ✨ Modern "Connect Wallet" button with custom styling
- 👤 Random avatar generated from wallet address (using DiceBear API)
- 🔗 Shortened wallet address display
- 📱 Dropdown menu with disconnect option
- 🎨 Maintains the gamified sci-fi aesthetic

## Setup Instructions

### 1. Get Your Thirdweb Client ID

1. Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Sign in or create an account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Copy your Client ID

### 2. Add to Environment Variables

Add the following to your `.env` file:

```env
VITE_THIRDWEB_CLIENT_ID=your_actual_client_id_here
```

> **Note:** Make sure to replace `your_actual_client_id_here` with the actual Client ID from Thirdweb Dashboard.

### 3. Features

#### When Disconnected:
- Shows a "CONNECT WALLET" button with cyan glow effect
- Clicking opens Thirdweb's wallet connection modal
- Supports multiple wallet providers (MetaMask, WalletConnect, Coinbase, etc.)

#### When Connected:
- **Avatar**: Random unique avatar generated based on wallet address
- **Address**: Shows shortened wallet address (e.g., `0x1234...5678`)
- **Dropdown**: Click to reveal disconnect option
- **Auto-load**: Automatically loads NFT and Marketplace contracts

### 4. Customization

The wallet button and dropdown maintain the Earthclaim theme:
- Cyan/blue color scheme
- Glassmorphism effects
- Monospace font styling
- Glowing shadows on hover

### 5. Development

Run your development server:
```bash
npm run dev
```

The integration will work once you've added a valid Thirdweb Client ID to your `.env` file.

## File Structure

```
client/src/
├── lib/
│   └── thirdweb.ts          # Thirdweb client configuration
├── components/
│   └── Navbar.tsx           # Updated navbar with wallet integration
└── App.tsx                  # Wrapped with ThirdwebProvider
```

## Troubleshooting

### "Invalid Client ID" Error
- Make sure you've added `VITE_THIRDWEB_CLIENT_ID` to your `.env` file
- Verify the Client ID is correct from Thirdweb Dashboard
- Restart your development server after adding the env variable

### Avatar Not Showing
- The avatar uses DiceBear API which generates SVG avatars
- If blocked, check your browser's content security policy
- Avatar URL: `https://api.dicebear.com/7.x/avataaars/svg?seed={address}`

### Contracts Not Loading
- Ensure MetaMask or another Web3 provider is installed
- Check that contract addresses in `contractsData/` are correct
- Verify you're connected to the correct network

## Additional Resources

- [Thirdweb Documentation](https://portal.thirdweb.com/)
- [Thirdweb React SDK](https://portal.thirdweb.com/react)
- [DiceBear Avatars](https://www.dicebear.com/)
