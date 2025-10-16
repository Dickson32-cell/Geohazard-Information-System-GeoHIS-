import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 1000); // Wait for fade out animation
    }, 3000); // Show splash for 3 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-royal-blue via-royal-blue-light to-deep-gold"
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <div className="text-center">
        <motion.h1
          className="text-6xl md:text-8xl font-bold text-gradient mb-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Abdul Rashid Dickson
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-white/90 mb-8 font-light"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          Assistant Director & Data Management Professional
        </motion.p>

        <motion.div
          className="text-lg md:text-xl text-deep-gold font-medium"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          Empowering Change Through Data and Governance
        </motion.div>

        <motion.div
          className="mt-12 flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          <div className="w-16 h-16 border-4 border-deep-gold border-t-transparent rounded-full animate-spin"></div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;