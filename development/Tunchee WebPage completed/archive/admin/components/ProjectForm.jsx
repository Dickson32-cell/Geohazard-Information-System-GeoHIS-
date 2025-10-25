import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FaTimes, FaUpload, FaTrash, FaPlus, FaImage } from 'react-icons/fa';
import axios from 'axios';
import { useUpdate } from '../../context/UpdateContext';

const ProjectForm = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    client_name: '',
    client_industry: '',
    completion_date: '',
    featured_image_url: '',
    tools: [],
    is_featured: false,
    status: 'draft',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const autoSaveTimeoutRef = React.useRef(null);
  const { notify } = useUpdate();

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchCategories();
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        category_id: project.category_id || '',
        client_name: project.client_name || '',
        client_industry: project.client_industry || '',
        completion_date: project.completion_date ? project.completion_date.split('T')[0] : '',
        featured_image_url: project.featured_image_url || '',
        tools: project.tools ? project.tools.map(tool => tool.tool_name) : [],
        is_featured: project.is_featured || false,
        status: project.status || 'draft',
        seo_title: project.seo_title || '',
        seo_description: project.seo_description || '',
        seo_keywords: project.seo_keywords || ''
      });
    }
  }, [project]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/v1/projects/categories');
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSuccess('');

    // Auto-save after user stops typing (2 seconds)
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveProject({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }, 2000);
  };

  // Auto-save project data
  const autoSaveProject = async (data) => {
    // Only auto-save if project exists (editing mode)
    if (!project) return;

    // Skip auto-save if required fields are missing
    if (!data.title?.trim() || !data.description?.trim() || !data.category_id || !data.completion_date) {
      return;
    }

    try {
      const submitData = {
        ...data,
        tools: data.tools.filter(tool => tool.trim() !== '')
      };

      await axios.put(`/api/v1/projects/${project.id}`, submitData);
      setSuccess('Project auto-saved!');
      // Notify listeners that projects have been updated
      notify('projects', submitData);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
      // Silently fail for auto-save
    }
  };

  const handleToolChange = (index, value) => {
    const newTools = [...formData.tools];
    newTools[index] = value;
    setFormData(prev => ({ ...prev, tools: newTools }));
  };

  const addTool = () => {
    setFormData(prev => ({ ...prev, tools: [...prev.tools, ''] }));
  };

  const removeTool = (index) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index)
    }));
  };

  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, featured_image_upload: 'Please select a valid image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, featured_image_upload: 'Image size should be less than 5MB' }));
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const uploadResponse = await axios.post('/api/v1/images/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const base64Image = uploadResponse.data.data.image_url;
      setFormData(prev => ({ ...prev, featured_image_url: base64Image }));
      setSuccess('Featured image uploaded successfully!');
      setErrors(prev => ({ ...prev, featured_image_upload: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading featured image:', error);
      setErrors(prev => ({ 
        ...prev, 
        featured_image_upload: error.response?.data?.message || 'Failed to upload image'
      }));
    }
  };

  const handleProjectImagesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedImagesData = [];
    let uploadCount = 0;

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, project_images_upload: 'All files must be valid image files' }));
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, project_images_upload: 'Each image should be less than 5MB' }));
        continue;
      }

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        const uploadResponse = await axios.post('/api/v1/images/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        uploadedImagesData.push({
          image_url: uploadResponse.data.data.image_url,
          file_name: file.name,
          file_size: file.size,
          alt_text: '',
          title: '',
          description: ''
        });
        uploadCount++;
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    if (uploadedImagesData.length > 0) {
      const updatedImages = [...uploadedImages, ...uploadedImagesData];
      setUploadedImages(updatedImages);
      setSuccess(`Successfully uploaded ${uploadCount} image(s)!`);
      setErrors(prev => ({ ...prev, project_images_upload: '' }));
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageMetadata = (index, field, value) => {
    setUploadedImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.completion_date) newErrors.completion_date = 'Completion date is required';
    // Featured image is optional now

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const submitData = {
        ...formData,
        tools: formData.tools.filter(tool => tool.trim() !== '')
      };

      let projectId;
      if (project) {
        await axios.put(`/api/v1/projects/${project.id}`, submitData);
        projectId = project.id;
      } else {
        const response = await axios.post('/api/v1/projects', submitData);
        projectId = response.data.data.project.id;
      }

      // Save uploaded images if any
      if (uploadedImages.length > 0) {
        const imagesToSave = uploadedImages.map((img, idx) => ({
          image_url: img.image_url,
          alt_text: img.alt_text || '',
          title: img.title || '',
          description: img.description || '',
          display_order: idx + 1,
          file_size: img.file_size || 0
        }));

        await axios.post('/api/v1/images/project-images', {
          project_id: projectId,
          images: imagesToSave
        });
      }

      setSuccess('Project saved successfully!');
      // Notify listeners that projects have been updated
      notify('projects', submitData);
      setTimeout(() => setSuccess(''), 3000);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Failed to save project' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {project ? 'Edit Project' : 'Add New Project'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter project title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.category_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Date *
                </label>
                <input
                  type="date"
                  name="completion_date"
                  value={formData.completion_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.completion_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.completion_date && <p className="text-red-500 text-sm mt-1">{errors.completion_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    name="featured_image_url"
                    value={formData.featured_image_url}
                    onChange={handleChange}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.featured_image_url ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  <label className="px-4 py-3 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <FaUpload className="text-sm" />
                    <span className="text-sm">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {errors.featured_image_url && <p className="text-red-500 text-sm mt-1">{errors.featured_image_url}</p>}
                {errors.featured_image_upload && <p className="text-red-500 text-sm mt-1">{errors.featured_image_upload}</p>}
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  name="client_industry"
                  value={formData.client_industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the project, challenges, and solutions..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Tools & Technologies */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tools & Technologies</h3>
              <button
                type="button"
                onClick={addTool}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FaPlus className="text-sm" />
                Add Tool
              </button>
            </div>
            <div className="space-y-2">
              {formData.tools.map((tool, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tool}
                    onChange={(e) => handleToolChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Adobe Photoshop, Figma"
                  />
                  <button
                    type="button"
                    onClick={() => removeTool(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Project Images */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Images</h3>
              <label className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                <FaImage className="text-sm" />
                Add Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProjectImagesUpload}
                  className="hidden"
                />
              </label>
            </div>
            {errors.project_images_upload && (
              <p className="text-red-500 text-sm mb-4">{errors.project_images_upload}</p>
            )}
            {uploadedImages.length > 0 && (
              <div className="space-y-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex gap-4 mb-4">
                      <img
                        src={image.image_url}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{image.file_name}</p>
                        <p className="text-xs text-gray-500">{(image.file_size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Image title"
                        value={image.title}
                        onChange={(e) => updateImageMetadata(index, 'title', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Alt text"
                        value={image.alt_text}
                        onChange={(e) => updateImageMetadata(index, 'alt_text', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <textarea
                        placeholder="Image description"
                        value={image.description}
                        onChange={(e) => updateImageMetadata(index, 'description', e.target.value)}
                        rows={2}
                        className="col-span-1 md:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {uploadedImages.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No images uploaded yet. Upload images to showcase your project.</p>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                  Featured Project
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  name="seo_title"
                  value={formData.seo_title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Custom SEO title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  name="seo_description"
                  value={formData.seo_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Custom SEO description"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProjectForm;