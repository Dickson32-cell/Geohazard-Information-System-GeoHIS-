import React from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaCalendar, FaExternalLinkAlt } from 'react-icons/fa';

const ProjectCard = ({ project, onClick, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer"
      onClick={() => onClick(project)}
    >
      <div className="card overflow-hidden">
        {/* Project Image */}
        <div className="relative overflow-hidden">
          <img
            src={project.featured_image_url}
            alt={project.title}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* View Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-4"
            >
              <FaEye className="text-2xl text-primary" />
            </motion.div>
          </div>

          {/* Featured Badge */}
          {project.is_featured && (
            <motion.div
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg"
            >
              Featured
            </motion.div>
          )}

          {/* Category Badge */}
          {project.category && (
            <div className="absolute top-4 left-4 bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-medium">
              {project.category.name}
            </div>
          )}
        </div>

        {/* Project Info */}
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-3">
            {project.description}
          </p>

          {/* Project Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <FaCalendar className="text-primary" />
              <span>{new Date(project.completion_date).getFullYear()}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaEye className="text-primary" />
              <span>{project.view_count}</span>
            </div>
          </div>

          {/* Tools */}
          {project.tools && project.tools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tools.slice(0, 3).map((tool, toolIndex) => (
                <span
                  key={toolIndex}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  {tool.tool_name}
                </span>
              ))}
              {project.tools.length > 3 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{project.tools.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Client Info */}
          {project.client_name && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Client:</span> {project.client_name}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;