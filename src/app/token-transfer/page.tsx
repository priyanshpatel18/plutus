"use client";

import CustomWalletButton from "@/components/CustomWalletButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo, TokenListProvider } from "@solana/spl-token-registry";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, GetProgramAccountsFilter, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { AnimatePresence, isGenerator, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Coins, ExternalLink, SearchIcon, Wallet } from "lucide-react";
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

const rpcEndpoint =
  `https://maximum-omniscient-mound.solana-devnet.quiknode.pro/${process.env.NEXT_PUBLIC_QUICKNODE_KEY}`;

const MainContent = dynamic(() => Promise.resolve(Main), { ssr: false });

export default function Page() {
  return <MainContent />;
}

function Main() {
  const router = useRouter();
  const { connected, publicKey, disconnecting, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);

  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<UserToken | null>(null);
  const [filteredTokens, setFilteredTokens] = useState<UserToken[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSearchFilter("");
    setSelectedToken(null);
    setAmount("");
  }, []);

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

  async function getAllTokens(metadata: boolean) {
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
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

      if (!metadata || accounts.length === userTokens.length) {
        const updatedTokens = [...userTokens];

        updatedTokens.forEach((token, index) => {
          const account = accounts.find(acc => {
            const tokenInfo: any = acc.account.data;
            return tokenInfo.parsed.info.mint === token.mint;
          });
          if (account) {
            const tokenInfo: any = account.account.data;
            token.amount = tokenInfo.parsed.info.tokenAmount.uiAmount;
          }
        });
        setUserTokens(updatedTokens);
        return;
      }

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
      setFilteredTokens(tokens);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch tokens");
    }
  }

  async function sendTokens() {
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (selectedToken?.name === "Solana") {
      sendMoney();
      return;
    }

    try {
      const mintAddress = new PublicKey(selectedToken!.mint);
      const destinationWallet = new PublicKey(receiverAddress);
      const AMOUNT = BigInt(Number(amount) * 10 ** selectedToken!.decimals);

      // Source and destination associated token accounts
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        publicKey
      );
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        destinationWallet
      );

      // Check if the destination ATA exists
      const accountInfo = await connection.getAccountInfo(destinationTokenAccount);
      const transaction = new Transaction();

      // If the destination ATA doesn't exist, add an instruction to create it
      if (!accountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            destinationTokenAccount,
            destinationWallet,
            mintAddress
          )
        );
      }

      // Add the transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceTokenAccount,
          destinationTokenAccount,
          publicKey,
          AMOUNT
        )
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send the transaction
      if (transaction && signTransaction) {
        const signedTransaction = await signTransaction(transaction);
        if (!signedTransaction) {
          return toast.error("User rejected the transaction");
        }

        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        if (signature) {
          const confirmed = await connection.confirmTransaction(signature, "confirmed");
          if (confirmed) {
            setFilteredTokens(prevTokens => {
              return prevTokens.map(token => {
                if (token.mint === selectedToken!.mint) {
                  const updatedAmount = token.amount - Number(amount);
                  return {
                    ...token,
                    amount: updatedAmount,
                  };
                }
                return token;
              });
            })
            toast.success("Transaction successful!");
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send tokens");
    } finally {
      setSelectedToken(null);
      setIsLoading(false);
      setAmount("");
      setReceiverAddress("");
    }
  }

  async function sendMoney() {
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!receiverAddress) {
      toast.error("Please enter an address to send money to.");
      return;
    }
    if (!amount) {
      toast.error("Please enter an amount to send.");
      return;
    }

    setIsLoading(true);

    try {
      const txn = new Transaction();

      txn.add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(receiverAddress),
        lamports: Number(amount) * 10 ** 9
      }))

      if (signTransaction) {
        const signature = await sendTransaction(txn, connection);
        if (signature) {
          toast.success("Transaction successful.");
        } else {
          toast.error("Transaction failed.");
        }
      }
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message);
      else
        toast.error("Transaction failed.");
    } finally {
      setSelectedToken(null);
      setIsLoading(false);
      setAmount("");
      setReceiverAddress("");
    }
  }

  useEffect(() => {
    if (connected && tokenMap.size > 0 && !userTokens.length) {
      getAllTokens(true);
    }

    let interval: NodeJS.Timeout;

    if (userTokens) {
      interval = setInterval(() => {
        getAllTokens(false);
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [connected, tokenMap, disconnecting, userTokens]);

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
          <Button
            variant="secondary"
            size="icon"
            onClick={() => {
              if (selectedToken) {
                setSelectedToken(null);
                return;
              }
              router.push("/")
            }}
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">
            Transfer Tokens
          </h1>
          <div className="w-9" />
        </motion.div>

        {selectedToken ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full flex justify-center flex-col items-center gap-3"
          >
            <div className="w-full flex items-center flex-col">
              <input
                value={receiverAddress}
                onChange={e => {
                  setReceiverAddress(e.target.value)
                  if (!e.target.value) {
                    setErrorMessage("");
                    return;
                  }

                  try {
                    new PublicKey(e.target.value);
                    setErrorMessage("");
                  } catch (e) {
                    setErrorMessage("Invalid Address for network");
                  }
                }}
                autoFocus
                placeholder="Enter Address"
                className="w-[80%] rounded-xl placeholder:text-white/70 border-none text-lg outline-none border-0 bg-background/20 p-3 px-4"
              />
              {errorMessage && <p className="text-red-500 mt-2 flex items-center gap-2"><AlertCircle className="w-5 h-5 inline-block" /> {errorMessage}</p>}
            </div>

            {receiverAddress && !errorMessage && (
              <div className="w-full flex justify-center flex-col items-center gap-3">
                <div className="text-white bg-background/50 flex items-center gap-2 p-0.5 px-1 rounded-md text-ellipsis max-w-[30%]">
                  <Wallet className="w-5 h-5 inline-block" />
                  <p className="truncate">
                    {`${receiverAddress.slice(0, 6)}...${receiverAddress.slice(-6)}`}
                  </p>
                </div>

                <input
                  value={amount}
                  type="number"
                  placeholder="0"
                  className="w-[80%] text-center bg-transparent border-none rounded-lg px-0 py-2 focus:outline-none text-5xl"
                  style={{
                    appearance: "none",
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                  }}
                  onChange={e => {
                    if (e.target.value.startsWith("0") && e.target.value.length > 1) {
                      setAmount(e.target.value.slice(1));
                    } else {
                      setAmount(e.target.value);
                    }
                  }}
                  min={0}
                  max={selectedToken.amount}
                />

                <div className="flex items-center gap-2 text-2xl text-gray-300">
                  {selectedToken.image ? (
                    <motion.img
                      src={selectedToken.image}
                      alt={selectedToken.name}
                      className="w-10 h-10 object-cover rounded-full"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Coins className="w-6 h-6 text-muted-foreground fallback-icon rounded-full" />
                  )}
                  {selectedToken.symbol}
                </div>

                <Button
                  variant={"secondary"}
                  onClick={sendTokens}
                  disabled={isLoading}
                >
                  Transfer
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
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
                  <div className="space-y-3">
                    <label className="bg-background/20 flex items-center gap-4 rounded-xl p-3 px-4">
                      <SearchIcon className="w-6 h-6 text-white/70" />
                      <input
                        value={searchFilter}
                        onChange={e => {
                          setFilteredTokens(
                            userTokens.filter(token => (token.name.includes(e.target.value) || token.symbol.includes(e.target.value) || token.mint.includes(e.target.value)))
                          )
                          setSearchFilter(e.target.value)
                        }}
                        placeholder="Search Tokens"
                        className="w-full rounded-xl placeholder:text-white/70 bg-transparent border-none text-lg p-0 outline-none border-0"
                      />
                    </label>

                    {filteredTokens.length === 0 && (
                      <p className="text-center text-zinc-400">No results for {searchFilter}</p>
                    )}
                    {filteredTokens.map((token, index) => <TokenCard key={token.mint} token={token} index={index} onClick={() => setSelectedToken(token)} />)}
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
        )
        }
      </motion.div >
    </div >
  );
}

const TokenCard = ({ token, index, onClick }: { token: UserToken; index: number, onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className="w-full rounded-xl select-none"
    onClick={onClick}
  >
    <Card className="bg-transparent border-none">
      <CardContent className="p-4 flex items-center gap-4 cursor-pointer bg-background hover:bg-background/85 rounded-xl transition-colors">
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
