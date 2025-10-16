import React from 'react';
import { ChevronDown, Download, Mail, Github, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileData } from '../data/profileData';
import ProfilePhoto from './ProfilePhoto';

const Hero = () => {
  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadCV = () => {
    // TODO: Implement CV download functionality
    console.log('Download CV clicked');
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Floating 3D Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-4 md:left-10 w-16 h-16 md:w-20 md:h-20 bg-deep-gold/20 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-32 md:top-40 right-4 md:right-20 w-12 h-12 md:w-16 md:h-16 bg-royal-blue/30 rounded-full blur-lg"
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-20 md:bottom-32 left-1/4 w-10 h-10 md:w-12 md:h-12 bg-deep-gold/25 rounded-full blur-md"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center z-10">
        {/* Profile Photo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProfilePhoto className="mx-auto" />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.h1
            className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {profileData.personal.name.split(' ').map((word, index) => (
              <span key={index} className={index === 0 ? 'block' : ''}>
                {word}
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="text-xl sm:text-2xl md:text-3xl text-gradient mb-4 md:mb-6 font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            {profileData.personal.tagline}
          </motion.p>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4 md:px-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
          >
            {profileData.personal.title}
          </motion.p>
        </motion.div>

        {/* Location and Social Links */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{profileData.personal.location}</span>
          </div>

          <div className="flex items-center gap-4">
            <motion.a
              href={profileData.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-deep-gold transition-colors duration-300"
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Linkedin size={24} />
            </motion.a>
            <motion.a
              href={profileData.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-deep-gold transition-colors duration-300"
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github size={24} />
            </motion.a>
            <motion.a
              href={`mailto:${profileData.social.email}`}
              className="text-gray-400 hover:text-deep-gold transition-colors duration-300"
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mail size={24} />
            </motion.a>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-12 md:mb-16 px-4 md:px-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.8 }}
        >
          <motion.button
            onClick={downloadCV}
            className="btn-primary flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={18} className="md:w-5 md:h-5" />
            Download CV
          </motion.button>

          <motion.button
            onClick={scrollToContact}
            className="btn-secondary flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mail size={18} className="md:w-5 md:h-5" />
            Get In Touch
          </motion.button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button
          onClick={scrollToAbout}
          className="text-deep-gold hover:text-deep-gold-light transition-colors duration-300 animate-bounce"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronDown size={48} />
        </motion.button>
      </div>

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-gray/20 pointer-events-none" />
    </section>
  );
};

export default Hero;