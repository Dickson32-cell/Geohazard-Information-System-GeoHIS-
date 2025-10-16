import React from 'react';
import { motion } from 'framer-motion';

const Skills = () => {
  // Define proficiency levels for skills (you can adjust these based on actual proficiency)
  const skillLevels = {
    technical: {
      "Python": 60,
      "SQL": 75,
      "JavaScript": 70,
      "React": 65,
      "Machine Learning": 55,
      "Data Analysis": 80,
      "AI Model Deployment": 50,
      "Database Management": 75,
      "Google OAuth": 70,
      "GPS Integration": 65,
    },
    professional: {
      "Local Governance": 90,
      "Project Management": 85,
      "Report Writing": 88,
      "Budget Coordination": 82,
      "Policy Development": 85,
      "Strategic Planning": 80,
      "Stakeholder Engagement": 87,
      "Public Administration": 92,
    },
    tools: {
      "Ollama": 70,
      "Open WebUI": 65,
      "T24 Banking Software": 60,
      "Git/GitHub": 75,
      "Zorin OS": 80,
      "Microsoft Office Suite": 95,
    }
  };

  const SkillBar = ({ skill, level, index, category }) => (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">{skill}</span>
        <span className="text-deep-gold font-semibold">{level}%</span>
      </div>
      <div className="h-3 bg-dark-gray rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-royal-blue to-deep-gold rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          transition={{ duration: 1.5, delay: index * 0.1 + 0.3, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
    </motion.div>
  );

  const FloatingSkillOrb = ({ skill, level, index }) => (
    <motion.div
      className="absolute"
      style={{
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 60 + 20}%`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 0.7 }}
      viewport={{ once: true }}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 360],
      }}
      transition={{
        scale: { duration: 0.8, delay: index * 0.2 },
        opacity: { duration: 0.8, delay: index * 0.2 },
        y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 20 + Math.random() * 10, repeat: Infinity, ease: "linear" }
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-deep-gold bg-gradient-to-br from-royal-blue/50 to-deep-gold/30 backdrop-blur-sm"
        style={{
          boxShadow: `0 0 ${level/10}px rgba(212, 175, 55, 0.5)`,
        }}
      >
        {skill.split(' ')[0]}
      </div>
    </motion.div>
  );

  return (
    <section id="skills" className="min-h-screen py-20 px-4 bg-gradient-to-b from-royal-blue/20 to-dark-gray/50 relative overflow-hidden">
      {/* Floating 3D Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {Object.entries(skillLevels.technical).slice(0, 8).map(([skill, level], index) => (
          <FloatingSkillOrb key={skill} skill={skill} level={level} index={index} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-12 md:mb-16 text-center px-4"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Skills & <span className="text-gradient">Expertise</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Technical Skills */}
          <motion.div
            className="card-glass p-6 md:p-8 rounded-xl"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-deep-gold mb-8 flex items-center gap-3">
              <div className="w-3 h-3 bg-deep-gold rounded-full animate-pulse"></div>
              Technical Skills
            </h3>
            <div className="space-y-4">
              {Object.entries(skillLevels.technical).map(([skill, level], index) => (
                <SkillBar key={skill} skill={skill} level={level} index={index} category="technical" />
              ))}
            </div>
          </motion.div>

          {/* Professional Skills */}
          <motion.div
            className="card-glass p-6 md:p-8 rounded-xl"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-deep-gold mb-8 flex items-center gap-3">
              <div className="w-3 h-3 bg-royal-blue rounded-full animate-pulse"></div>
              Professional Skills
            </h3>
            <div className="space-y-4">
              {Object.entries(skillLevels.professional).map(([skill, level], index) => (
                <SkillBar key={skill} skill={skill} level={level} index={index} category="professional" />
              ))}
            </div>
          </motion.div>

          {/* Tools & Platforms */}
          <motion.div
            className="card-glass p-6 md:p-8 rounded-xl"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-deep-gold mb-8 flex items-center gap-3">
              <div className="w-3 h-3 bg-dark-gray rounded-full animate-pulse"></div>
              Tools & Platforms
            </h3>
            <div className="space-y-4">
              {Object.entries(skillLevels.tools).map(([tool, level], index) => (
                <SkillBar key={tool} skill={tool} level={level} index={index} category="tools" />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Skills Overview */}
        <motion.div
          className="mt-16 card-glass p-8 rounded-xl text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-white mb-6">Skills Overview</h3>
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto">
            My expertise combines technical proficiency in data systems and AI with deep knowledge of public administration
            and governance. I leverage modern technologies to enhance traditional governmental processes, creating
            innovative solutions that bridge the gap between technology and public service.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <motion.div
              className="p-6 rounded-lg bg-gradient-to-br from-royal-blue/20 to-deep-gold/20 border border-deep-gold/30"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h4 className="text-xl font-bold text-deep-gold mb-2">Data & Analytics</h4>
              <p className="text-gray-300">Advanced skills in data management, analysis, and visualization for informed decision-making</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg bg-gradient-to-br from-royal-blue/20 to-deep-gold/20 border border-deep-gold/30"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h4 className="text-xl font-bold text-deep-gold mb-2">Governance & Leadership</h4>
              <p className="text-gray-300">Expertise in public administration, policy development, and stakeholder management</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg bg-gradient-to-br from-royal-blue/20 to-deep-gold/20 border border-deep-gold/30"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h4 className="text-xl font-bold text-deep-gold mb-2">Technology Integration</h4>
              <p className="text-gray-300">Implementation of modern technologies in traditional governmental frameworks</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;