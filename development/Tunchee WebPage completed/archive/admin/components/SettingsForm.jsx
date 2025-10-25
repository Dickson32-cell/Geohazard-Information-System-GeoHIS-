import React, { useState, useEffect } from 'react';
import {
  FaSave,
  FaGlobe,
  FaChartLine,
  FaPalette,
  FaShareAlt,
  FaSearch
} from 'react-icons/fa';
import axios from 'axios';

const SettingsForm = () => {
  const [settings, setSettings] = useState({
    hero: {},
    stats: {},
    services: {},
    social: {},
    seo: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching settings...');
      const response = await axios.get('/api/v1/settings');
      console.log('Settings response:', response.data);
      setSettings(response.data.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
      // Set default settings on error
      setSettings({
        hero: {
          hero_title_line1: 'Crafting Compelling',
          hero_title_line2: 'Brand Identities',
          hero_subtitle: 'Professional graphic designer specializing in logo design, branding, and creative visual solutions that tell your story.',
          hero_cta_primary_text: 'View My Work',
          hero_cta_primary_link: '/portfolio',
          hero_cta_secondary_text: 'Get a Quote',
          hero_cta_secondary_link: '/contact'
        },
        stats: {
          stats_projects_completed: '50+',
          stats_years_experience: '5+',
          stats_happy_clients: '25+',
          stats_client_satisfaction: '100%'
        },
        services: {
          services_title: 'What I Do',
          services_subtitle: 'From concept to creation, I bring your vision to life with professional design services.',
          services_cta_text: 'View All Services',
          services_cta_link: '/services'
        },
        social: {
          social_title: 'Follow My Creative Journey',
          social_subtitle: 'Stay updated with my latest projects, design tips, and creative insights'
        },
        seo: {
          seo_title: 'Anyetei Sowah Joseph - Graphic Designer | Professional Portfolio',
          seo_description: 'Professional graphic designer specializing in brand identity, logo design, and creative visual solutions. View my portfolio and get a quote for your project.',
          seo_keywords: 'graphic designer, logo design, branding, UI/UX design, portfolio, Anyetei Sowah Joseph'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      await axios.put('/api/v1/settings', { settings });

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'hero', label: 'Hero Section', icon: FaGlobe },
    { id: 'stats', label: 'Statistics', icon: FaChartLine },
    { id: 'services', label: 'Services', icon: FaPalette },
    { id: 'social', label: 'Social Media', icon: FaShareAlt },
    { id: 'seo', label: 'SEO & Meta', icon: FaSearch }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  // If settings failed to load and we don't have defaults, show error
  if (!settings || Object.keys(settings).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Settings</h3>
        <p className="text-gray-600 mb-4">There was an error loading the site settings.</p>
        <button
          onClick={fetchSettings}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSave />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {message}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Hero Section Settings */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section Content</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Line 1
                </label>
                <input
                  type="text"
                  value={settings.hero?.hero_title_line1 || ''}
                  onChange={(e) => handleInputChange('hero', 'hero_title_line1', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Crafting Compelling"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Line 2
                </label>
                <input
                  type="text"
                  value={settings.hero?.hero_title_line2 || ''}
                  onChange={(e) => handleInputChange('hero', 'hero_title_line2', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Brand Identities"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <textarea
                value={settings.hero?.hero_subtitle || ''}
                onChange={(e) => handleInputChange('hero', 'hero_subtitle', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Professional graphic designer specializing..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary CTA Text
                </label>
                <input
                  type="text"
                  value={settings.hero?.hero_cta_primary_text || ''}
                  onChange={(e) => handleInputChange('hero', 'hero_cta_primary_text', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="View My Work"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary CTA Link
                </label>
                <input
                  type="text"
                  value={settings.hero?.hero_cta_primary_link || ''}
                  onChange={(e) => handleInputChange('hero', 'hero_cta_primary_link', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="/portfolio"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary CTA Text
                </label>
                <input
                  type="text"
                  value={settings.hero?.hero_cta_secondary_text || ''}
                  onChange={(e) => handleInputChange('hero', 'hero_cta_secondary_text', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Get a Quote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary CTA Link
                </label>
                <input
                  type="text"
                  value={settings.hero?.hero_cta_secondary_link || ''}
                  onChange={(e) => handleInputChange('hero', 'hero_cta_secondary_link', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="/contact"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Section Settings */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics Section</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projects Completed
                </label>
                <input
                  type="text"
                  value={settings.stats?.stats_projects_completed || ''}
                  onChange={(e) => handleInputChange('stats', 'stats_projects_completed', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="50+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years Experience
                </label>
                <input
                  type="text"
                  value={settings.stats?.stats_years_experience || ''}
                  onChange={(e) => handleInputChange('stats', 'stats_years_experience', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="5+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Happy Clients
                </label>
                <input
                  type="text"
                  value={settings.stats?.stats_happy_clients || ''}
                  onChange={(e) => handleInputChange('stats', 'stats_happy_clients', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="25+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Satisfaction
                </label>
                <input
                  type="text"
                  value={settings.stats?.stats_client_satisfaction || ''}
                  onChange={(e) => handleInputChange('stats', 'stats_client_satisfaction', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="100%"
                />
              </div>
            </div>
          </div>
        )}

        {/* Services Section Settings */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Preview Section</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={settings.services?.services_title || ''}
                onChange={(e) => handleInputChange('services', 'services_title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="What I Do"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Subtitle
              </label>
              <textarea
                value={settings.services?.services_subtitle || ''}
                onChange={(e) => handleInputChange('services', 'services_subtitle', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="From concept to creation..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={settings.services?.services_cta_text || ''}
                  onChange={(e) => handleInputChange('services', 'services_cta_text', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="View All Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Button Link
                </label>
                <input
                  type="text"
                  value={settings.services?.services_cta_link || ''}
                  onChange={(e) => handleInputChange('services', 'services_cta_link', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="/services"
                />
              </div>
            </div>
          </div>
        )}

        {/* Social Media Section Settings */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Section</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={settings.social?.social_title || ''}
                onChange={(e) => handleInputChange('social', 'social_title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Follow My Creative Journey"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Subtitle
              </label>
              <textarea
                value={settings.social?.social_subtitle || ''}
                onChange={(e) => handleInputChange('social', 'social_subtitle', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Stay updated with my latest projects..."
              />
            </div>
          </div>
        )}

        {/* SEO & Meta Settings */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO & Metadata</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={settings.seo?.seo_title || ''}
                onChange={(e) => handleInputChange('seo', 'seo_title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Anyetei Sowah Joseph - Graphic Designer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={settings.seo?.seo_description || ''}
                onChange={(e) => handleInputChange('seo', 'seo_description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Professional graphic designer specializing..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Keywords
              </label>
              <input
                type="text"
                value={settings.seo?.seo_keywords || ''}
                onChange={(e) => handleInputChange('seo', 'seo_keywords', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="graphic designer, logo design, branding..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsForm;