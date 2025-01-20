import type { MetadataRoute } from "next";

const { appName, description } = {
  appName: "PLUTUS",
  description:
    "PLUTUS is an automated crypto investment platform that helps users manage and grow their portfolios using blockchain technology and dollar-cost averaging (DCA). With real-time market updates, secure Solana blockchain transactions, and personalized investment strategies, PLUTUS offers a smarter, more efficient way to invest in cryptocurrencies.",
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: description,
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}