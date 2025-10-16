import React from 'react';
import { profileData } from '../data/profileData';

const Projects = () => {
  return (
    <section id="projects" className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 md:mb-12 text-center px-4">
          Featured <span className="text-gradient">Projects</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {profileData.projects.map((project) => (
            <div key={project.id} className="card-glass p-4 md:p-6 rounded-lg hover:border-gold hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gold">{project.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === 'In Production' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                  project.status === 'Active' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                  'bg-yellow-500 bg-opacity-20 text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </div>

              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                {project.description}
              </p>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Technologies:</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, index) => (
                    <span key={index} className="bg-royal-blue bg-opacity-40 text-gray-300 px-2 py-1 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {project.highlights && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Highlights:</h4>
                  <ul className="space-y-1">
                    {project.highlights.map((highlight, index) => (
                      <li key={index} className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-gold">▸</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;