"use client";

import CustomWalletButton from "@/components/CustomWalletButton";
import BackgroundFog from "@/components/ui/background-fog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { ed25519 } from "@noble/curves/ed25519";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const getBalance = async () => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      const data = await connection.getBalance(wallet.publicKey);
      toast.success(`Wallet has ${data / 10 ** 9} SOL`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to get balance.");
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
            >
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
                >
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
                >
                  Send SOL
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}