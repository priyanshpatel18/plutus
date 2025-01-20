import { Metadata } from "next";

const { title, description, ogImage, baseURL } = {
  title: "PLUTUS",
  description:
    "PLUTUS is an automated crypto investment platform that helps users manage and grow their portfolios using blockchain technology and dollar-cost averaging (DCA). With real-time market updates, secure Solana blockchain transactions, and personalized investment strategies, PLUTUS offers a smarter, more efficient way to invest in cryptocurrencies.",
  baseURL: "https://plutus.priyanshpatel.site",
  ogImage: `https://plutus.priyanshpatel.site/open-graph.png`,
};

export const siteConfig: Metadata = {
  title,
  description,
  metadataBase: new URL(baseURL),
  openGraph: {
    title,
    description,
    images: [ogImage],
    url: baseURL,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: "PLUTUS",
  alternates: {
    canonical: baseURL,
  },
  keywords: ["crypto investment", "blockchain", "DCA", "automated trading", "PLUTUS", "Solana", "investment platform"],
};
