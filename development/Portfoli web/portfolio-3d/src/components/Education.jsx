import React from 'react';
import { motion } from 'framer-motion';
import { profileData } from '../data/profileData';

const Education = () => {
  return (
    <section id="education" className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 md:mb-12 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="text-gradient">Education</span> & Development
        </motion.h2>

        <div className="space-y-8">
          {profileData.education.map((edu, index) => (
            <motion.div
              key={index}
              className="card-glass p-6 md:p-8 rounded-lg hover:border-deep-gold transition-all duration-300"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h3 className="text-2xl font-bold text-deep-gold mb-2 md:mb-0">{edu.degree}</h3>
                <span className="text-gray-400 font-medium">{edu.year}</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">{edu.institution}</h4>
              <p className="text-gray-300 leading-relaxed">{edu.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Additional Certifications or Ongoing Learning */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-white mb-6">Continuous Learning</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="card-glass p-4 md:p-6 rounded-lg">
              <h4 className="text-base md:text-lg font-semibold text-deep-gold mb-2">Python Programming</h4>
              <p className="text-gray-300 text-sm">Beginner level proficiency for data analysis and automation</p>
            </div>
            <div className="card-glass p-4 md:p-6 rounded-lg">
              <h4 className="text-base md:text-lg font-semibold text-deep-gold mb-2">GIS & Spatial Analysis</h4>
              <p className="text-gray-300 text-sm">ArcGIS and QGIS for geographic data visualization</p>
            </div>
            <div className="card-glass p-4 md:p-6 rounded-lg">
              <h4 className="text-base md:text-lg font-semibold text-deep-gold mb-2">Data Science</h4>
              <p className="text-gray-300 text-sm">Machine learning and statistical analysis techniques</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Education;