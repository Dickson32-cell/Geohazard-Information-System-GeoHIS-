import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  FaPalette,
  FaProjectDiagram,
  FaUsers,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaHome,
  FaBell,
  FaSearch
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ProjectList from '../../components/admin/ProjectList';
import ProjectForm from '../../components/admin/ProjectForm';
import ContactList from '../../components/admin/ContactList';
import ProfileForm from '../../components/admin/ProfileForm';
import SettingsForm from '../../components/admin/SettingsForm';
import GalleryList from '../../components/admin/GalleryList';
import GalleryForm from '../../components/admin/GalleryForm';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalViews: 0,
    recentProjects: [],
    recentContacts: []
  });
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [editingGalleryImage, setEditingGalleryImage] = useState(null);

  const { isAuthenticated, logout, user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/v1/dashboard/stats');
        setStats({
          totalProjects: response.data.data.totalProjects,
          totalViews: response.data.data.totalViews,
          recentProjects: response.data.data.recentProjects,
          recentContacts: response.data.data.recentContacts
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values if API fails
        setStats({
          totalProjects: 0,
          totalViews: 0,
          recentProjects: [],
          recentContacts: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: FaHome },
    { id: 'projects', label: 'Projects', icon: FaProjectDiagram },
    { id: 'gallery', label: 'Gallery', icon: FaPalette },
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'contacts', label: 'Contacts', icon: FaUsers },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}/10`}>
          {Icon && <Icon className={`text-xl text-${color}`} />}
        </div>
      </div>
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary-600 rounded-xl p-8 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
        <p className="text-primary-100">Here's what's happening with your portfolio today.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={loading ? '...' : stats.totalProjects}
          icon={FaProjectDiagram}
          color="blue"
        />
        <StatCard
          title="Total Views"
          value={loading ? '...' : stats.totalViews.toLocaleString()}
          icon={FaEye}
          color="green"
        />
        <StatCard
          title="Published Projects"
          value={loading ? '...' : stats.recentProjects.filter(p => p.status === 'published').length}
          icon={FaChartLine}
          color="purple"
        />
        <StatCard
          title="New Contacts"
          value={loading ? '...' : stats.recentContacts.length}
          icon={FaUsers}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <button
              onClick={handleAddProject}
              className="btn-primary text-sm px-4 py-2"
            >
              <FaPlus className="mr-2" />
              Add New
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              stats.recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-600">Created {new Date(project.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                    >
                      <FaEdit />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Contacts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Contacts</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              stats.recentContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{contact.project_type}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(contact.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const handleAddProject = () => {
    setEditingProject(null);
    setShowProjectForm(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleSaveProject = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    // Refresh data if needed
  };

  const handleCloseProjectForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };

  const handleEditGalleryImage = (image) => {
    setEditingGalleryImage(image);
    setShowGalleryForm(true);
  };

  const handleSaveGalleryImage = () => {
    setShowGalleryForm(false);
    setEditingGalleryImage(null);
    // Refresh data if needed
  };

  const handleCloseGalleryForm = () => {
    setShowGalleryForm(false);
    setEditingGalleryImage(null);
  };

  const renderProjects = () => (
    <ProjectList
      onEditProject={handleEditProject}
      onAddProject={handleAddProject}
    />
  );

  const renderContacts = () => (
    <ContactList />
  );

  const renderProfile = () => (
    <ProfileForm />
  );

  const renderSettings = () => (
    <SettingsForm />
  );

  const renderGallery = () => (
    <GalleryList
      onEditImage={handleEditGalleryImage}
    />
  );

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Anyetei Portfolio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Professional Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Brand */}
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {sidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                    <FaPalette className="text-white text-sm" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Anyetei</h1>
                    <p className="text-xs text-gray-500">Admin Dashboard</p>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <FaSearch />
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                  <FaBell />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex max-w-7xl mx-auto">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex flex-col h-full pt-16 lg:pt-0">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200 lg:hidden">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                    <FaPalette className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Anyetei</h2>
                    <p className="text-xs text-gray-500">Portfolio Admin</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6">
                <ul className="space-y-2">
                  {menuItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                          activeTab === item.id
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="mr-3 text-lg" />
                        <span className="font-medium">{item.label}</span>
                        {activeTab === item.id && (
                          <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  © 2024 Anyetei Portfolio
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-4rem)]">
            <div className="p-6 lg:p-8">
              {/* Page Header */}
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 capitalize">
                    {activeTab === 'overview' ? 'Dashboard' : activeTab}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {activeTab === 'overview' && 'Welcome to your portfolio management dashboard'}
                    {activeTab === 'projects' && 'Manage and organize your portfolio projects'}
                    {activeTab === 'gallery' && 'Upload and manage gallery images for your portfolio'}
                    {activeTab === 'profile' && 'Update your personal information and profile settings'}
                    {activeTab === 'contacts' && 'View and respond to client inquiries'}
                    {activeTab === 'settings' && 'Configure your portfolio settings and preferences'}
                  </p>
                </motion.div>
              </div>

              {/* Page Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'projects' && renderProjects()}
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'contacts' && renderContacts()}
                {activeTab === 'settings' && renderSettings()}
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onClose={handleCloseProjectForm}
          onSave={handleSaveProject}
        />
      )}

      {/* Gallery Form Modal */}
      {showGalleryForm && (
        <GalleryForm
          image={editingGalleryImage}
          onClose={handleCloseGalleryForm}
          onSave={handleSaveGalleryImage}
        />
      )}
    </>
  );
};

export default AdminDashboard;