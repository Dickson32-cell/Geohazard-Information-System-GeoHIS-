import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FaTimes, FaSave, FaImage } from 'react-icons/fa';
import axios from 'axios';

const GalleryForm = ({ image, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    image_title: '',
    image_description: '',
    image_alt_text: '',
    is_featured: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (image) {
      setFormData({
        image_title: image.image_title || '',
        image_description: image.image_description || '',
        image_alt_text: image.image_alt_text || '',
        is_featured: image.is_featured || false
      });
    }
  }, [image]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await axios.put(`/api/v1/gallery/${image.id}`, formData);

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Failed to update image');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Gallery Image</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-500" />
            </button>
          </div>

          {/* Image Preview */}
          <div className="mb-6">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image?.image_url}
                alt={image?.image_alt_text || image?.image_title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="image_title"
                value={formData.image_title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter image title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="image_description"
                value={formData.image_description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter image description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                name="image_alt_text"
                value={formData.image_alt_text}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter alt text for accessibility"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                id="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                Mark as featured image
              </label>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default GalleryForm;