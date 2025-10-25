import React from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaSearch, FaSort } from 'react-icons/fa';

const ProjectFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories
}) => {
  return (
    <motion.div
      className="bg-white border-b border-gray-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="container-max">
        <div className="py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <motion.div
              className="relative flex-1 max-w-md w-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </motion.div>

            {/* Filters */}
            <motion.div
              className="flex flex-wrap gap-4 items-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 min-w-[160px]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <FaSort className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 min-w-[140px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most-viewed">Most Viewed</option>
                </select>
              </div>
            </motion.div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedCategory !== 'all') && (
            <motion.div
              className="flex flex-wrap gap-2 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {searchTerm && (
                <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  Category: {categories.find(cat => cat.slug === selectedCategory)?.name}
                  <button
                    onClick={() => onCategoryChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectFilters;