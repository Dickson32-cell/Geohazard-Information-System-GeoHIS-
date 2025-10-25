import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendar, FaUser, FaTools, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ProjectModal = ({ project, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!project) return null;

  // Mock additional images for the carousel
  const images = [
    project.featured_image_url,
    // Add more images from project.images if available
    ...(project.images || []).map(img => img.image_url)
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes className="text-xl text-gray-700" />
              </motion.button>

              {/* Image Carousel */}
              <div className="relative h-96 md:h-[500px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={`${project.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <motion.button
                      onClick={prevImage}
                      className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg"
                      whileHover={{ scale: 1.1, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaChevronLeft className="text-xl text-gray-700" />
                    </motion.button>
                    <motion.button
                      onClick={nextImage}
                      className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg"
                      whileHover={{ scale: 1.1, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaChevronRight className="text-xl text-gray-700" />
                    </motion.button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Featured Badge */}
                {project.is_featured && (
                  <div className="absolute top-6 left-6 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Featured Project
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column - Project Details */}
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                            {project.title}
                          </h2>
                          {project.category && (
                            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                              {project.category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        {project.description}
                      </p>

                      {/* Project Meta */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 text-gray-600">
                          <FaCalendar className="text-primary text-lg" />
                          <span>Completed: {new Date(project.completion_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                          <FaEye className="text-primary text-lg" />
                          <span>{project.view_count} views</span>
                        </div>

                        {project.client_name && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <FaUser className="text-primary text-lg" />
                            <div>
                              <span className="font-medium">Client: {project.client_name}</span>
                              {project.client_industry && (
                                <span className="text-sm block text-gray-500">{project.client_industry}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tools Used */}
                      {project.tools && project.tools.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FaTools className="text-primary" />
                            Tools & Technologies
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {project.tools.map((tool, index) => (
                              <motion.span
                                key={index}
                                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                              >
                                {tool.tool_name}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Right Column - Additional Images Grid */}
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-xl font-semibold mb-4">Project Gallery</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {images.slice(0, 4).map((image, index) => (
                          <motion.div
                            key={index}
                            className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                              index === currentImageIndex
                                ? 'border-primary shadow-lg'
                                : 'border-gray-200 hover:border-primary/50'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <img
                              src={image}
                              alt={`${project.title} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        ))}
                      </div>

                      {/* Related Projects */}
                      {project.related_projects && project.related_projects.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-xl font-semibold mb-4">Related Projects</h3>
                          <div className="space-y-3">
                            {project.related_projects.map((related, index) => (
                              <motion.div
                                key={related.id}
                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                whileHover={{ x: 5 }}
                              >
                                <img
                                  src={related.featured_image_url}
                                  alt={related.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div>
                                  <h4 className="font-medium text-gray-900">{related.title}</h4>
                                  <p className="text-sm text-gray-600">{related.category?.name}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;