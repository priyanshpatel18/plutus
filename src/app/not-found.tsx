"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CloudOff, Home, RotateCcw } from 'lucide-react';

export default function NotFound() {
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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="text-center space-y-8"
        variants={itemVariants}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="inline-block"
        >
          <CloudOff className="w-24 h-24 text-gray-400 mx-auto" />
        </motion.div>

        <motion.h1
          className="text-6xl font-bold text-gray-800"
          variants={itemVariants}
        >
          404
        </motion.h1>

        <motion.p
          className="text-xl text-gray-600"
          variants={itemVariants}
        >
          Oops! The page you're looking for seems to have wandered off.
        </motion.p>

        <motion.div
          className="flex justify-center space-x-4"
          variants={itemVariants}
        >
          <Button
            onClick={() => router.push("/")}
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Button>

          <Button
            onClick={() => router.back()}
          >
            <RotateCcw className="w-5 h-5" />
            <span>Go Back</span>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-0 overflow-hidden -z-10"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 0.3 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-24 h-24 border-2 border-gray-200 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};