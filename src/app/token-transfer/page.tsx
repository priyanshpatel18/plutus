"use client";

import CustomWalletButton from "@/components/CustomWalletButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spotlight } from "@/components/ui/spotlight";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo, TokenListProvider } from "@solana/spl-token-registry";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, GetProgramAccountsFilter } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Coins, ExternalLink, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserToken {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: number;
  image: string | undefined;
}

const MainContent = dynamic(() => Promise.resolve(Main), { ssr: false });

export default function Page() {
  return <MainContent />;
}

function Main() {
  const router = useRouter();
  const { connected, publicKey, disconnecting } = useWallet();
  const { connection } = useConnection();
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);

  // const [senderAddress, setSenderAddress] = useState<string>("");
  // const [selectedToken, setSelectedToken] = useState<UserToken | null>(null);

  useEffect(() => {
    new TokenListProvider()
      .resolve()
      .then(tokens => {
        const tokenList = tokens.filterByClusterSlug("devnet").getList();
        setTokenMap(
          tokenList.reduce((map, item) => {
            map.set(item.address, item);
            return map;
          }, new Map())
        );
      });
  }, []);

  async function getAllTokens() {
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      const rpcEndpoint =
        "https://maximum-omniscient-mound.solana-devnet.quiknode.pro/f780d9c95e2b52873a0e208c1e2dcdfb20ca4eef";
      const solanaConnection = new Connection(rpcEndpoint);
      const walletAddress = publicKey.toBase58();

      const filters: GetProgramAccountsFilter[] = [
        {
          dataSize: 165,
        },
        {
          memcmp: {
            offset: 32,
            bytes: walletAddress,
          },
        },
      ];

      const accounts = await solanaConnection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,
        { filters: filters }
      );

      let tokens = accounts.map(account => {
        const tokenInfo: any = account.account.data;
        const token = tokenMap.get(tokenInfo.parsed.info.mint);

        return {
          mint: tokenInfo.parsed.info.mint,
          name: token ? token.name : "Unknown",
          symbol: token ? token.symbol : "Unknown",
          decimals: tokenInfo.parsed.info.tokenAmount.decimals,
          amount: tokenInfo.parsed.info.tokenAmount.uiAmount,
          image: token ? token.logoURI : "",
        };
      });

      const response = await fetch(
        `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "searchAssets",
            params: {
              ownerAddress: publicKey.toBase58(),
              tokenType: "all",
              displayOptions: {
                showCollectionMetadata: true,
              },
            },
          }),
        }
      );

      const { result } = await response.json();

      const tokenMetadatas = new Map();
      result.items.forEach((token: any) => {
        const metadata = {
          image: token.content?.links?.image,
          name: token.content?.metadata?.name,
          symbol: token.content?.metadata?.symbol,
          decimals: token.token_info?.decimals,
          id: token.id,
        };
        if (metadata.id) {
          tokenMetadatas.set(metadata.id, metadata);
        }
      });

      tokens = tokens.map(token => {
        if (token.name === "Unknown" || token.symbol === "Unknown") {
          const metadata = tokenMetadatas.get(token.mint);
          if (metadata) {
            return {
              ...token,
              name: metadata.name || token.mint,
              symbol: metadata.symbol || "-",
              image: metadata.image || "",
            };
          }
        }
        return token;
      });

      tokens.unshift({
        mint: publicKey.toBase58(),
        name: "Solana",
        symbol: "SOL",
        decimals: 9,
        amount: await connection.getBalance(publicKey) / 10 ** 9,
        image:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      });

      setUserTokens(tokens);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch tokens");
    }
  }

  useEffect(() => {
    if (connected && tokenMap.size > 0) {
      getAllTokens();
      // demo();
    }
  }, [connected, tokenMap, disconnecting]);

  // async function demo() {
  //   if (!publicKey) return;

  //   setUserTokens([{
  //     mint: publicKey.toBase58(),
  //     name: "Solana",
  //     symbol: "SOL",
  //     decimals: 9,
  //     amount: await connection.getBalance(publicKey) / 10 ** 9,
  //     image:
  //       "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  //   }])
  // }

  return (
    <div className="min-h-screen relative w-full py-6 sm:py-8 md:py-12 overflow-hidden">
      <Spotlight />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="secondary" size="icon" onClick={() => router.push("/")} >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">
            Transfer Tokens
          </h1>
          <div className="w-9" />
        </motion.div>

        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full flex items-center justify-center"
          >
            <CustomWalletButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`w-full ${userTokens.length === 0 && "space-y-3"}`}
          >
            <AnimatePresence>
              {userTokens.length > 0 ? (
                <div>
                  {/* <Input value={senderAddress} onChange={e => setSenderAddress(e.target.value)} />
                  <Input value={selectedToken?.mint} onChange={e => setSelectedToken(userTokens.find(token => token.mint === e.target.value) || null)} /> */}
                  {userTokens.map((token, index) => <TokenCard key={token.mint} token={token} index={index} />)}
                </div>
              ) : connected ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-zinc-400 py-8"
                >
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tokens found in this wallet</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {userTokens.length > 0 && (
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-zinc-500 flex items-center gap-2"
              href="https://explorer.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </motion.a>
          )}
        </div>
      </motion.div >
    </div >
  );
}

const TokenCard = ({ token, index }: { token: UserToken; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className="w-full rounded-xl p-4"
  >
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.1 + 0.2 }}
          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        >
          {token.image ? (
            <img src={token.image} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            <Coins className="w-6 h-6 text-zinc-400" />
          )}
        </motion.div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate">
              <h3 className="font-medium text-xl truncate">{token.name}</h3>
              <p className="text-sm text-zinc-400">{token.symbol}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-mono font-medium">
                {token.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: token.decimals > 4 ? 4 : token.decimals,
                })}
              </p>
              <p className="text-sm text-zinc-400">{token.symbol}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
