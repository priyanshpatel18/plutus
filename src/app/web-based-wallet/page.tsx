"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { ethers } from "ethers";
import { motion } from 'framer-motion';
import { Badge, CopyIcon, Trash } from "lucide-react";
import { useCallback, useEffect, useState } from 'react';
import { toast } from "sonner";
import nacl from "tweetnacl";

interface Account {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
  balance: number;
  blockchain: "solana" | "ethereum";
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const urls = {
  solana: "https://solana-devnet.g.alchemy.com/v2/",
  ethereum: "https://eth-sepolia.g.alchemy.com/v2/"
}

export default function Page() {
  const [mnemonic, setMnemonic] = useState<string[]>(Array(12).fill(" "));
  const [mnemonicInput, setMnemonicInput] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedPathType, setSelectedPathType] = useState<"60" | "501" | undefined>(undefined);

  useEffect(() => {
    const recoveryPhrase = localStorage.getItem("mnemonics");
    if (recoveryPhrase) {
      setMnemonic(recoveryPhrase.split(" "));
    }

    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    setAccounts(accounts);

    if (accounts.length > 0) {
      setSelectedPathType(accounts[0].blockchain === "solana" ? "501" : "60");
    }
  }, []);

  function generateAccount(pathType: string, mnemonic: string, accountIndex: number): Account | null {
    try {
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      if (pathType === "501") {
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keypair = Keypair.fromSecretKey(secretKey);

        privateKeyEncoded = bs58.encode(secretKey);
        publicKeyEncoded = keypair.publicKey.toBase58();
      } else if (pathType === "60") {
        const privateKey = Buffer.from(derivedSeed).toString("hex");
        privateKeyEncoded = privateKey;

        const wallet = new ethers.Wallet(privateKey);
        publicKeyEncoded = wallet.address;
      } else {
        toast.error("Unsupported path type.");
        return null;
      }

      const blockchain = pathType === "501" ? "solana" : "ethereum";

      return { publicKey: publicKeyEncoded, privateKey: privateKeyEncoded, mnemonic, path, blockchain, balance: 0 };
    } catch (error) {
      toast.error("Failed to generate wallet. Please try again.");
      return null;
    }
  }

  function handleCreate() {
    let mn = mnemonicInput.trim();
    console.log(mn);


    if (!selectedPathType) {
      toast.error("Please select a blockchain.");
      return;
    }

    if (mn) {
      // Validate user-provided mnemonic
      if (!validateMnemonic(mn)) {
        toast.error("Invalid recovery phrase. Please try again.");
        return;
      }
    } else {
      if (validateMnemonic(mnemonic.join(" "))) {
        mn = mnemonic.join(" ");
      } else {
        mn = generateMnemonic();
      }
    }

    // Split and save mnemonic words
    const words = mn.split(" ");
    setMnemonic(words);

    // Generate account
    const account = generateAccount(selectedPathType, mn, accounts.length);
    if (account) {
      const updatedAccounts = [...accounts, account];
      setAccounts(updatedAccounts);

      // Save to localStorage
      localStorage.setItem("mnemonics", JSON.stringify(words));
      localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
      localStorage.setItem("selectedPathType", selectedPathType);

      toast.success("Account created successfully.");
      setMnemonicInput("");
    }
  }


  const fetchBalance = useCallback(async (account: Account) => {
    try {
      const url = `${urls[account.blockchain]}${process.env.NEXT_PUBLIC_API_KEY}`;

      let body;
      if (account.blockchain === "solana") {
        body = {
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [account.publicKey]
        }
      } else if (account.blockchain === "ethereum") {
        body = {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [account.publicKey, "latest"]
        }
      }

      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data.jsonrpc) return;

      let balance: number;
      if (account.blockchain === "solana") {
        balance = data.result.value / 1e9;
      } else {
        balance = Number(ethers.formatEther(data.result));
      }

      if (!balance) {
        balance = 0;
      }

      const newAccounts = [...accounts];
      const index = newAccounts.findIndex(w => w.publicKey === account.publicKey);
      if (index === -1) return;

      if (newAccounts[index].balance === balance) return;

      setAccounts(currentAccounts =>
        currentAccounts.map(w =>
          w.publicKey === account.publicKey ? { ...w, balance } : w
        )
      );
    } catch (error) {
      console.error(error);
    }
  }, [accounts]);


  function handleDelete(account: Account) {
    const newAccounts = accounts.filter((a) => a.publicKey !== account.publicKey);
    setAccounts(newAccounts);
    if (newAccounts.length === 0) {
      setSelectedPathType(undefined);
    }

    localStorage.setItem("accounts", JSON.stringify(newAccounts));
    toast.success("Account deleted successfully.");
  }

  function handleReset() {
    localStorage.removeItem("mnemonics");
    localStorage.removeItem("accounts");
    localStorage.removeItem("selectedPathType");
    setMnemonic(Array(12).fill(" "));
    setAccounts([]);
    setSelectedPathType(undefined);
    toast.success("Wallet reset successfully.");
  }

  useEffect(() => {
    accounts.forEach((account) => {
      fetchBalance(account);
    });

    const intervalIds: NodeJS.Timeout[] = accounts.map((account) => {
      return setInterval(() => {
        fetchBalance(account);
      }, 2500);
    });

    return () => {
      intervalIds.forEach((id) => clearInterval(id));
    };
  }, [accounts, fetchBalance]);

  return (
    <div className="min-h-screen w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6">
      <BackgroundBeams className="-z-50" />


      <motion.div
        className="max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8 items-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute -top-8 right-0 sm:top-4 sm:right-2 bg-green-300 text-green-900 text-xs p-1 font-medium rounded-lg select-none">
          Test Network
        </div>
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center px-4 flex items-start gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Wallet Creation & Account Management
        </motion.h1>

        {accounts.length === 0 && !selectedPathType && (
          <motion.div
            className="w-full flex flex-col gap-4 sm:gap-6 items-center"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl sm:text-2xl text-neutral-400 font-light text-center px-4">
              Select blockchain to create a account
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {["Ethereum", "Solana"].map((chain) => (
                <motion.div
                  key={chain}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    onClick={() => {
                      toast.success(`${chain} selected`);
                      setSelectedPathType(chain === "Ethereum" ? "60" : "501");
                    }}
                    variant="secondary"
                    className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-light backdrop-blur-sm bg-opacity-20 hover:bg-opacity-30 transition-all"
                  >
                    {chain}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {accounts.length === 0 && selectedPathType && (
          <motion.div
            className="w-full flex flex-col gap-4 sm:gap-6 px-4"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <form className="flex flex-col sm:flex-row items-center gap-4" onSubmit={(e) => {
              e.preventDefault()
              handleCreate()
            }}>
              <Input
                className={`w-full flex-1 lg:px-4 lg:py-6 ${mnemonicInput && "tracking-[0.3rem]"}`}
                value={mnemonicInput}
                onChange={(e) => setMnemonicInput(e.target.value)}
                placeholder="Enter Secret Phrase (or leave blank to generate)"
                autoFocus
                autoComplete="off"
                type="password"
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full sm:w-auto lg:p-6 lg:px-8"
                >
                  {mnemonicInput ? "Add Wallet" : "Create Wallet"}
                </Button>
              </motion.div>
            </form>
            <p className="text-center text-sm text-neutral-400">
              A secret phrase is required to create a wallet. You can either input your own or let us generate one for you.
            </p>
          </motion.div>
        )}

        {accounts.length > 0 && (
          <motion.div
            className="w-full flex flex-col gap-4 sm:gap-6 px-4"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div
              className="flex flex-col gap-4 p-4 sm:p-6 rounded-lg border border-neutral-800 backdrop-blur-sm hover:border-neutral-700 transition-colors cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(mnemonic.join(" "));
                toast.success("Recovery phrase copied to clipboard");
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-200">Secret Recovery Phrase</h2>
                <div className='flex items-center gap-2'>
                  <p className='text-sm text-neutral-400'>Click to Copy</p>
                  <CopyIcon className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
              <p className="text-sm sm:text-lg text-neutral-300 font-mono break-all">{mnemonic.join(" ")}</p>
            </motion.div>

            <div className='flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-4'>
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-200">Accounts</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={handleCreate} className="w-full sm:w-auto">
                  Add Account
                </Button>
                <Button variant="destructive" onClick={handleReset} className="w-full sm:w-auto">
                  Reset Wallet
                </Button>
              </div>
            </div>

            {accounts.map((account, index) => (
              <motion.div
                key={index}
                className="flex flex-col gap-3 border border-neutral-800 rounded-lg p-4 sm:p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className='flex w-full items-center justify-between'>
                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-200">Account {index + 1}</h2>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(account)}
                  >
                    <Trash className="w-4 sm:w-5 h-4 sm:h-5" />
                  </Button>
                </div>
                <div className="space-y-2 font-mono text-xs sm:text-sm text-neutral-400">
                  <div className='flex items-start sm:items-center gap-2 break-all'>
                    <span>Public Key:</span>
                    <div className="flex gap-2 items-center">
                      <span className="flex-1">{account.publicKey}</span>
                      <CopyIcon
                        className="w-3 h-3 cursor-pointer flex-shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(account.publicKey)
                          toast.success("Public key copied to clipboard")
                        }}
                      />
                    </div>
                  </div>
                  <div className='flex items-start sm:items-center gap-2 break-all'>
                    <span>Private Key:</span>
                    <div className="flex gap-2 items-center">
                      <span className="flex-1">{account.privateKey}</span>
                      <CopyIcon
                        className="w-3 h-3 cursor-pointer flex-shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(account.privateKey)
                          toast.success("Private key copied to clipboard")
                        }}
                      />
                    </div>
                  </div>
                  <p>Path: {account.path}</p>
                  <p>Balance: {account.balance.toFixed(4)} {account.blockchain === "solana" ? "SOL" : "ETH"}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}