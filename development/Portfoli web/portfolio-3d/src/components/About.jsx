import React from 'react';
import { motion } from 'framer-motion';
import { profileData } from '../data/profileData';
import ProfilePhoto from './ProfilePhoto';

const About = () => {
  return (
    <section id="about" className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 md:mb-12 text-center px-4">
          About <span className="text-gradient">Me</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
          {/* Profile Photo */}
          <motion.div
            className="flex justify-center md:justify-end"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <ProfilePhoto size="w-48 h-48 md:w-64 md:h-64" />
          </motion.div>

          {/* About Content */}
          <div className="space-y-4 md:space-y-6 text-center md:text-left px-4 md:px-0">
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              {profileData.about.bio}
            </p>

            <div className="space-y-2 md:space-y-3">
              {profileData.about.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 justify-center md:justify-start">
                  <span className="text-deep-gold mt-1 flex-shrink-0">▸</span>
                  <p className="text-gray-300 text-sm md:text-base">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;