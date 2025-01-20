"use client";

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function page() {
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
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="text-center space-y-8 max-w-2xl mx-auto"
        variants={itemVariants}
      >
        <motion.div
          className="flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <Wallet className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-800">Welcome to Your Wallet</h1>
        </motion.div>

        <motion.p
          className="text-lg text-gray-600"
          variants={itemVariants}
        >
          Access your secure web-based wallet with just one click
        </motion.p>

        <motion.div
          className="flex justify-center items-center space-x-4"
          variants={itemVariants}
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => router.push('/web-based-wallet')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg flex items-center space-x-2 shadow-lg"
          >
            <span>Access Wallet</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-10"
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
          className="absolute top-10 right-10"
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
};