import React, { useState, useEffect } from 'react';
import { FaUpload, FaUser, FaSave, FaEdit } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useUpdate } from '../../context/UpdateContext';
import axios from 'axios';

const ProfileForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    profile_picture_url: '',
    about_me: '',
    what_i_can_do: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const { notify } = useUpdate();
  const autoSaveTimeoutRef = React.useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        profile_picture_url: user.profile_picture_url || '',
        about_me: user.about_me || '',
        what_i_can_do: user.what_i_can_do || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      autoSaveProfile({
        ...formData,
        [name]: value
      });
    }, 2000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save profile data
  const autoSaveProfile = async (data) => {
    try {
      // Only validate required fields
      if (!data.full_name?.trim() || !data.email?.trim()) {
        return; // Don't auto-save if required fields are missing
      }

      const response = await axios.put('/api/v1/auth/profile', data);
      setSuccess('Profile auto-saved!');
      // Notify listeners that profile has been updated
      notify('profile', response.data.data.user);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
      // Don't show error for auto-save failures
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const response = await axios.put('/api/v1/auth/profile', formData);
      setSuccess('Profile updated successfully!');
      // Notify listeners that profile has been updated
      notify('profile', response.data.data.user);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Failed to update profile' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrors({ profile_picture: 'Please select a valid image file' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ profile_picture: 'Image size should be less than 5MB' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Create FormData for multipart upload
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      // Upload image to backend
      const uploadResponse = await axios.post('/api/v1/images/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const base64Image = uploadResponse.data.data.image_url;
      setFormData(prev => ({ ...prev, profile_picture_url: base64Image }));

      // Auto-save the profile picture
      try {
        const response = await axios.put('/api/v1/auth/profile', {
          ...formData,
          profile_picture_url: base64Image
        });
        setSuccess('Profile picture updated!');
        // Notify listeners that profile has been updated
        notify('profile', response.data.data.user);
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error saving profile picture:', error);
        setErrors({ profile_picture: error.response?.data?.message || 'Failed to save profile picture' });
      } finally {
        setSaving(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors({ profile_picture: error.response?.data?.message || 'Failed to upload image' });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600">Manage your profile information and portfolio details</p>
      </div>

      {/* Success Message */}
      {success && (
        <div
          className="p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>

          <div className="flex items-center space-x-6">
            <div className="relative">
              {formData.profile_picture_url ? (
                <img
                  src={formData.profile_picture_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <FaUser className="text-3xl text-gray-400" />
                </div>
              )}

              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <FaUpload className="text-sm" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={saving}
                />
              </label>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Upload Profile Picture</h4>
              <p className="text-sm text-gray-600 mt-1">
                JPG, PNG or GIF. Max size 5MB.
              </p>
              {saving && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
              {errors.profile_picture && (
                <p className="text-sm text-red-600 mt-1">{errors.profile_picture}</p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your full name"
              />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* About Me Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Me</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                My Story
              </label>
              <textarea
                name="about_me"
                value={formData.about_me}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tell your story, your journey, and what inspires you..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What I Can Do
              </label>
              <textarea
                name="what_i_can_do"
                value={formData.what_i_can_do}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Describe your skills, expertise, and what you can offer to clients..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;