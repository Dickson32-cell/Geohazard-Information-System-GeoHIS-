import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaStar,
  FaRegStar,
  FaUpload,
  FaImage,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';

const GalleryList = ({ onEditImage }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/gallery');
      setImages(response.data.data.images);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await axios.delete(`/api/v1/gallery/${imageId}`);
      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleToggleFeatured = async (imageId, currentFeatured) => {
    try {
      await axios.put(`/api/v1/gallery/${imageId}`, {
        is_featured: !currentFeatured
      });
      setImages(images.map(img =>
        img.id === imageId ? { ...img, is_featured: !currentFeatured } : img
      ));
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Failed to update image');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', file.name);
    formData.append('alt_text', file.name);

    try {
      setUploading(true);
      const response = await axios.post('/api/v1/gallery/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImages([response.data.data.image, ...images]);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchImages}
          className="mt-4 btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaUpload className="mr-2 text-blue-600" />
          Upload New Image
        </h3>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FaImage className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Drag and drop an image here, or click to select
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="btn-primary cursor-pointer"
              >
                Choose File
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Supports JPEG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Images List */}
      <div className="space-y-4">
        {images.length === 0 ? (
          <div className="text-center py-12">
            <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No images yet</h3>
            <p className="text-gray-500">Upload your first image to get started</p>
          </div>
        ) : (
          images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center p-4">
                {/* Image Preview */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 mr-4">
                  <img
                    src={image.image_url}
                    alt={image.image_alt_text || image.image_title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {image.image_title || 'Untitled'}
                    </h4>
                    {image.is_featured && (
                      <FaStar className="ml-2 text-yellow-500 text-sm" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {image.image_description || 'No description'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{(image.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleFeatured(image.id, image.is_featured)}
                    className={`p-2 rounded-md transition-colors ${
                      image.is_featured
                        ? 'text-yellow-500 hover:bg-yellow-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={image.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    {image.is_featured ? <FaStar /> : <FaRegStar />}
                  </button>

                  <button
                    onClick={() => onEditImage(image)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit image"
                  >
                    <FaEdit />
                  </button>

                  <button
                    onClick={() => handleDeleteImage(image.id, image.image_url)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete image"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default GalleryList;