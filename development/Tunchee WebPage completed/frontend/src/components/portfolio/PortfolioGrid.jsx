import React from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';

const PortfolioGrid = ({ projects, loading, onProjectClick }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="animate-pulse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">No projects found</h3>
        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={onProjectClick}
          index={index}
        />
      ))}
    </motion.div>
  );
};

export default PortfolioGrid;