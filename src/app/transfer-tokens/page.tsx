"use client";

import CustomWalletButton from "@/components/CustomWalletButton";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const MainContent = dynamic(() => Promise.resolve(Main), {
  ssr: false,
})

export default function Page() {
  return <MainContent />
}

function Main() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative w-full py-6 sm:py-8 md:py-12 overflow-hidden">
      <Spotlight />

      <motion.div
        className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
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
            Transfer Tokens
          </h1>
          <div className="w-9" />
        </div>

        <div className="flex justify-center items-center flex-col gap-3">
          <CustomWalletButton />
          
        </div>
      </motion.div>
    </div>
  )
}
