import React from 'react';
import { motion } from 'framer-motion';
import { profileData } from '../data/profileData';

const Experience = () => {
  return (
    <section id="experience" className="min-h-screen py-20 px-4 bg-gradient-to-b from-dark-gray/50 to-royal-blue/20 relative overflow-hidden">
      {/* Background 3D Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-32 h-32 bg-deep-gold/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-24 h-24 bg-royal-blue/15 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-12 md:mb-16 text-center px-4"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Professional <span className="text-gradient">Journey</span>
        </motion.h2>

        {/* Timeline Container */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-deep-gold via-royal-blue to-deep-gold h-full opacity-30"></div>

          <div className="space-y-16">
            {profileData.experience.map((job, index) => (
              <motion.div
                key={job.id}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-col md:gap-8`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                {/* Timeline Node */}
                <motion.div
                  className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-deep-gold rounded-full border-2 md:border-4 border-dark-gray z-20"
                  whileHover={{ scale: 1.5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-deep-gold rounded-full animate-ping opacity-25"></div>
                </motion.div>

                {/* Content Card */}
                <motion.div
                  className={`w-full md:w-5/12 card-glass p-6 md:p-8 rounded-xl hover:border-deep-gold transition-all duration-300 ml-8 md:ml-0 ${
                    index % 2 === 0 ? 'md:text-right' : 'md:text-left'
                  }`}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(212, 175, 55, 0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`flex ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'} mb-4`}>
                    <span className={`inline-block bg-gradient-to-r from-deep-gold to-deep-gold-light text-dark-gray px-4 py-2 rounded-full text-sm font-semibold ${
                      job.current ? 'animate-pulse' : ''
                    }`}>
                      {job.period}
                      {job.current && <span className="ml-2 text-green-600">●</span>}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-deep-gold mb-2">{job.title}</h3>
                  <h4 className="text-xl text-white mb-2">{job.organization}</h4>
                  <p className="text-gray-400 mb-6">{job.location}</p>

                  <ul className="space-y-3">
                    {job.responsibilities.map((resp, respIndex) => (
                      <motion.li
                        key={respIndex}
                        className={`flex items-start gap-3 text-gray-300 ${
                          index % 2 === 0 ? 'md:flex-row-reverse md:text-right' : ''
                        }`}
                        initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: (index * 0.2) + (respIndex * 0.1) }}
                        viewport={{ once: true }}
                      >
                        <span className="text-deep-gold mt-1 flex-shrink-0">▸</span>
                        <span>{resp}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Spacer for timeline */}
                <div className="hidden md:block w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <motion.div
          className="mt-20 card-glass p-8 rounded-xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Key Achievements</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {profileData.achievements.map((achievement, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-dark-gray/30 hover:bg-dark-gray/50 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.span
                  className="text-deep-gold text-2xl flex-shrink-0 mt-1"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  ✓
                </motion.span>
                <p className="text-gray-300 leading-relaxed">{achievement}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;