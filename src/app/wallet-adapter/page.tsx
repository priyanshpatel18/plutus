"use client";

import CustomWalletButton from "@/components/CustomWalletButton";
import BackgroundFog from "@/components/ui/background-fog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ed25519 } from "@noble/curves/ed25519";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo, TokenListProvider } from '@solana/spl-token-registry';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, GetProgramAccountsFilter, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Coins, Loader, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

interface UserToken {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: number;
  image: string;
}

const solana = {
  name: "Solana",
  symbol: "SOL",
  decimals: 9,
  image: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
}

const MainContent = dynamic(() => Promise.resolve(Main), {
  ssr: false,
})

export default function Page() {
  return <MainContent />
}
function Main() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState<number>(0);

  useEffect(() => {
    new TokenListProvider().resolve().then(tokens => {
      const tokenList = tokens.filterByClusterSlug("devnet").getList();

      setTokenMap(tokenList.reduce((map, item) => {
        map.set(item.address, item);
        return map;
      }, new Map()));
    });
  }, [setTokenMap]);

  const getBalance = async () => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);
    setActiveLoading(1);

    try {
      const data = await connection.getBalance(wallet.publicKey);
      toast.success(`Wallet has ${data / 10 ** 9} SOL`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to get balance.");
    } finally {
      setIsLoading(false);
      setActiveLoading(0);
    }
  }

  async function signMsg(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!wallet.signMessage) {
      toast.error("The wallet does not support signing messages.");
      return;
    }
    if (!message) {
      toast.error("Please enter a message to sign.");
      return;
    }

    setActiveLoading(2);
    setIsLoading(true);

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);

      if (!ed25519.verify(signature, encodedMessage, wallet.publicKey.toBytes())) {
        toast.error("Invalid signature.");
        return;
      }

      toast.success("Message signed successfully.");
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message);
      else
        toast.error("Failed to sign message.");
    } finally {
      setMessage("");
      setIsLoading(false);
      setActiveLoading(0);
    }
  }

  async function sendMoney(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!address) {
      toast.error("Please enter an address to send money to.");
      return;
    }
    if (!amount) {
      toast.error("Please enter an amount to send.");
      return;
    }

    setActiveLoading(3);
    setIsLoading(true);

    try {
      const txn = new Transaction();

      txn.add(SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(address),
        lamports: amount * 10 ** 9
      }))

      const signature = await wallet.sendTransaction(txn, connection);
      if (signature) {
        toast.success("Transaction successful.");
      } else {
        toast.error("Transaction failed.");
      }
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message);
      else
        toast.error("Transaction failed.");
    } finally {
      setAddress("");
      setAmount(0);
      setIsLoading(false);
      setActiveLoading(0);
    }
  }

  async function getAccountTokens() {
    setUserTokens([]);

    if (!wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setActiveLoading(4);
    setIsLoading(true);

    try {
      const rpcEndpoint =
        "https://maximum-omniscient-mound.solana-devnet.quiknode.pro/f780d9c95e2b52873a0e208c1e2dcdfb20ca4eef";
      const solanaConnection = new Connection(rpcEndpoint);
      const walletAddress = wallet.publicKey.toBase58();

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


      if (accounts.length === 0) {
        toast.info("No tokens found for this wallet.");
        return;
      }

      const tokens = await Promise.all(
        accounts.map(async (account) => {
          const tokenInfo: any = account.account.data;

          let tokenMetadata = null;
          const token = tokenMap.get(tokenInfo.parsed.info.mint);

          if (token) {
            tokenMetadata = {
              name: token.name,
              symbol: token.symbol,
              image: token.logoURI,
            };
          } else {
            const response = await fetch(`https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_KEY}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: "text",
                method: "getAsset",
                params: { id: tokenInfo.parsed.info.mint },
              }),
            });

            const data = await response.json();
            tokenMetadata = {
              name: data.result.content.metadata.name || "Unknown",
              symbol: data.result.content.metadata.symbol || "Unknown",
              image: data.result.content.links.image || null,
            };
          }

          if (!tokenMetadata) {
            toast.error("Failed to fetch token metadata.");
            return null;
          }

          return {
            mint: tokenInfo.parsed.info.mint,
            owner: tokenInfo.parsed.info.owner,
            amount: tokenInfo.parsed.info.tokenAmount.uiAmount,
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            image: tokenMetadata.image,
            decimals: tokenInfo.parsed.info.tokenAmount.decimals,
          };
        })
      );

      tokens.unshift({
        mint: null,
        owner: wallet.publicKey.toBase58(),
        name: solana.name,
        symbol: solana.symbol,
        decimals: solana.decimals,
        amount: await solanaConnection.getBalance(wallet.publicKey) / 10 ** 9,
        image: solana.image
      });

      const filteredTokens = tokens.filter((token) => token !== null);
      setUserTokens(filteredTokens);
      if (filteredTokens.length > 0) {
        toast.success("Tokens fetched successfully.");
      } else {
        toast.info("No valid tokens found for this wallet.");
      }
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message);
      else
        toast.error("Failed to fetch tokens")
    } finally {
      setIsLoading(false);
      setActiveLoading(0);
    }
  }

  return (
    <div className="min-h-screen relative w-full py-6 sm:py-8 md:py-12">
      <BackgroundFog />

      <motion.div
        className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="space-y-6 sm:space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant={"secondary"}
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center tracking-wide">
              Wallet Adapter
            </h1>
            <div className="w-9" />
          </div>

          <div className="flex justify-center items-center flex-col gap-3">
            <CustomWalletButton />
            <Button
              variant="secondary"
              onClick={getBalance}
              disabled={isLoading || activeLoading !== 0}
            >
              {activeLoading === (1) && <Loader2 className="h-4 w-4 animate-spin" />}
              Check Balance
            </Button>

          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <form
                onSubmit={signMsg}
                className="flex flex-col gap-3"
              >
                <Input
                  placeholder="Enter message to sign"
                  onChange={(e) => setMessage(e.target.value)}
                  value={message}
                />
                <Button
                  type="submit"
                  variant="default"
                  disabled={isLoading || activeLoading !== 0}
                >
                  {activeLoading === (2) && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <form
                onSubmit={sendMoney}
                className="flex flex-col gap-3"
              >
                <Input
                  placeholder="Recipient address"
                  onChange={(e) => setAddress(e.target.value)}
                  value={address}
                />
                <Input
                  placeholder="Amount in SOL"
                  type="number"
                  onChange={(e) => setAmount(Number(e.target.value))}
                  value={amount}
                  step="any"
                  min={0}
                />
                <Button
                  variant="default"
                  type="submit"
                  disabled={isLoading || activeLoading !== 0}
                >
                  {activeLoading === (3) && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send SOL
                </Button>
              </form>
            </CardContent>
          </Card>

          <TokenDisplay
            userTokens={userTokens}
            getAccountTokens={getAccountTokens}
            loading={isLoading}
            activeLoading={activeLoading}
          />

        </motion.div>
      </motion.div>
    </div>
  );
}

interface TokenDisplayProps {
  userTokens: UserToken[];
  getAccountTokens: () => void;
  loading: boolean;
  activeLoading: number;
}

function TokenDisplay({ userTokens, getAccountTokens, loading, activeLoading }: TokenDisplayProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <Button
          variant="default"
          onClick={getAccountTokens}
          className="w-full"
          disabled={loading || activeLoading !== 0}
        >
          {activeLoading === 4 && <Loader2 className="h-4 w-4 animate-spin" />}
          {userTokens.length > 0 ? "Refresh Tokens" : "Get Account Tokens"}
        </Button>

        <AnimatePresence>
          {userTokens.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-y-auto overflow-x-hidden max-h-44 md:max-h-44 sm:max-h-48"
            >
              {userTokens.map((token, index) => (
                <motion.div
                  key={token.mint}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-secondary/50 rounded-lg p-2 sm:p-3 md:p-4"
                >
                  <div className="flex items-center sm:gap-2 gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-10 sm:h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-background/50 flex items-center justify-center">
                      {token.image ? (
                        <motion.img
                          src={token.image}
                          alt={token.name}
                          className="w-full h-full object-cover"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Coins className="w-6 h-6 text-muted-foreground fallback-icon" />
                      )}
                    </div>
                    <div className="flex-grow flex justify-between items-center min-w-0">
                      <div className="space-y-1 truncate">
                        <h3 className="font-semibold text-lg truncate">
                          {token.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {token.symbol}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-lg">
                          {token.amount.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                          {" "}
                          {token.symbol}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
