const { Project, ContactSubmission, SiteAnalytics } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    // Get total projects count
    const totalProjects = await Project.count();

    // Get total views from analytics (sum of all page_views)
    const analyticsResult = await SiteAnalytics.findAll({
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('page_views')), 'total_views']
      ],
      raw: true
    });
    const totalViews = analyticsResult[0]?.total_views || 0;

    // Get recent projects (last 5)
    const recentProjects = await Project.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'created_at', 'status']
    });

    // Get recent contacts (last 5)
    const recentContacts = await ContactSubmission.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'email', 'project_type', 'created_at', 'status']
    });

    res.json({
      success: true,
      data: {
        totalProjects,
        totalViews: parseInt(totalViews),
        recentProjects,
        recentContacts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

module.exports = {
  getDashboardStats
};