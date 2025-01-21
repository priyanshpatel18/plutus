"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Wallet, Shield, Laptop } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="text-center space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={itemVariants}
      >
        <motion.div
          className="flex flex-col items-center justify-center space-y-3"
          whileHover={{ scale: 1.02 }}
        >
          <Wallet className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white">
            Welcome to Your Wallet
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Choose your preferred wallet interface for a seamless blockchain experience
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          <Card className="group hover:shadow-lg transition-all duration-300 bg-white/90 dark:bg-gray-800/90 border-0">
            <CardContent className="p-6">
              <motion.div
                className="flex flex-col items-center space-y-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Laptop className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Web-Based Wallet</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Simple and accessible wallet interface
                </p>
                <Button
                  variant="default"
                  onClick={() => router.push('/web-based-wallet')}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 group-hover:translate-y-[-2px] transition-all"
                >
                  <span>Launch Web Wallet</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 bg-white/90 dark:bg-gray-800/90 border-0">
            <CardContent className="p-6">
              <motion.div
                className="flex flex-col items-center space-y-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Wallet Adapter</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Advanced features with external wallet support
                </p>
                <Button
                  variant="default"
                  onClick={() => router.push('/wallet-adapter')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 group-hover:translate-y-[-2px] transition-all"
                >
                  <span>Use Wallet Adapter</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="hidden sm:block absolute bottom-10 left-10"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Sparkles className="w-8 h-8 text-indigo-400 opacity-60" />
        </motion.div>

        <motion.div
          className="hidden sm:block absolute top-10 right-10"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1
          }}
        >
          <Sparkles className="w-8 h-8 text-indigo-400 opacity-60" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}