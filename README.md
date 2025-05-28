# Plutus

Plutus is a practice web-based wallet application built on the Solana blockchain. It provides essential wallet functionalities, including wallet adapter integration and token transfer capability.

## Features

- Web-based Solana wallet interface
- Wallet adapter integration (Phantom, Solflare, etc.)
- Token transfer functionality using Solana's Web3.js SDK
- Practice-grade implementation for learning and experimentation

## Technologies Used

- React
- Solana Web3.js
- Wallet Adapter libraries
- TailwindCSS (optional, if you used it for styling)

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Yarn or npm

### Installation

```bash
git clone https://github.com/priyanshpatel18/plutus.git
cd plutus
pnpm install
```

### Running the App

```bash
pnpm run dev
```

or

```bash
yarn dev
```

### Build for Production

```bash
pnpm run build
```

## Usage

1. Connect your Solana wallet using the wallet adapter UI.
2. View your wallet address and balance.
3. Use the transfer UI to send SPL tokens to other wallet addresses.
4. Sign and confirm transactions using your connected wallet.

> Note: This is a practice app and not meant for production use. Use Devnet or Testnet to avoid real token loss.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is for educational purposes only. Use it at your own risk. The author assumes no responsibility for any misuse or damages caused.
