const { Project, ProjectImage, ProjectTool, ProjectCategory } = require('../models');
const { logger } = require('../middleware/errorHandler');
const { Sequelize } = require('sequelize');

// @desc    Get all projects (Public)
// @route   GET /api/v1/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      sort = 'newest',
      featured_only = false
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_published: true };

    // Add category filter
    if (category) {
      const categoryData = await ProjectCategory.findOne({
        where: { slug: category }
      });
      if (categoryData) {
        whereClause.category_id = categoryData.id;
      }
    }

    // Add featured filter
    if (featured_only === 'true') {
      whereClause.is_featured = true;
    }

    // Sort options
    let order = [['createdAt', 'DESC']];
    switch (sort) {
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'most-viewed':
        order = [['view_count', 'DESC']];
        break;
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: ProjectCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProjectTool,
          as: 'tools',
          attributes: ['tool_name', 'tool_category']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'GET_PROJECTS_ERROR',
      message: 'Failed to get projects'
    });
  }
};

// @desc    Get single project (Public)
// @route   GET /api/v1/projects/:slug
// @access  Public
const getProject = async (req, res) => {
  try {
    const { slug } = req.params;

    const project = await Project.findOne({
      where: { slug, is_published: true },
      include: [
        {
          model: ProjectCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProjectImage,
          as: 'images',
          attributes: ['id', 'image_url', 'image_alt_text', 'image_title', 'display_order']
        },
        {
          model: ProjectTool,
          as: 'tools',
          attributes: ['tool_name', 'tool_category']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Project not found'
      });
    }

    // Increment view count
    await project.increment('view_count');

    // Get related projects
    const relatedProjects = await Project.findAll({
      where: {
        category_id: project.category_id,
        id: { [Sequelize.Op.ne]: project.id },
        is_published: true
      },
      limit: 3,
      attributes: ['id', 'title', 'slug', 'featured_image_url'],
      include: [{
        model: ProjectCategory,
        as: 'category',
        attributes: ['name']
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project.toJSON(),
          related_projects: relatedProjects
        }
      }
    });
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'GET_PROJECT_ERROR',
      message: 'Failed to get project'
    });
  }
};

// @desc    Get project categories (Public)
// @route   GET /api/v1/projects/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await ProjectCategory.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'GET_CATEGORIES_ERROR',
      message: 'Failed to get categories'
    });
  }
};

// @desc    Create project (Admin only)
// @route   POST /api/v1/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      client_name,
      client_industry,
      completion_date,
      featured_image_url,
      tools = [],
      is_featured = false,
      status = 'draft',
      seo_title,
      seo_description,
      seo_keywords
    } = req.body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingProject = await Project.findOne({ where: { slug } });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: 'SLUG_EXISTS',
        message: 'A project with this title already exists'
      });
    }

    const project = await Project.create({
      title,
      slug,
      description,
      category_id,
      client_name,
      client_industry,
      completion_date,
      featured_image_url,
      view_count: 0,
      is_featured,
      is_published: status === 'published',
      status,
      seo_title,
      seo_description,
      seo_keywords
    });

    // Add tools if provided
    if (tools && tools.length > 0) {
      const toolRecords = tools.map(tool => ({
        project_id: project.id,
        tool_name: tool.name || tool,
        tool_category: tool.category || 'design'
      }));
      await ProjectTool.bulkCreate(toolRecords);
    }

    // Fetch complete project data
    const completeProject = await Project.findByPk(project.id, {
      include: [
        { model: ProjectCategory, as: 'category' },
        { model: ProjectTool, as: 'tools' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: completeProject }
    });
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'CREATE_PROJECT_ERROR',
      message: 'Failed to create project'
    });
  }
};

// @desc    Update project (Admin only)
// @route   PUT /api/v1/projects/:id
// @access  Private/Admin
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Project not found'
      });
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== project.title) {
      const newSlug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existingProject = await Project.findOne({
        where: { slug: newSlug, id: { [Sequelize.Op.ne]: id } }
      });

      if (existingProject) {
        return res.status(400).json({
          success: false,
          error: 'SLUG_EXISTS',
          message: 'A project with this title already exists'
        });
      }

      updateData.slug = newSlug;
    }

    // Handle status changes
    if (updateData.status) {
      updateData.is_published = updateData.status === 'published';
    }

    await project.update(updateData);

    // Update tools if provided
    if (updateData.tools) {
      await ProjectTool.destroy({ where: { project_id: id } });
      if (updateData.tools.length > 0) {
        const toolRecords = updateData.tools.map(tool => ({
          project_id: id,
          tool_name: tool.name || tool,
          tool_category: tool.category || 'design'
        }));
        await ProjectTool.bulkCreate(toolRecords);
      }
    }

    // Fetch updated project
    const updatedProject = await Project.findByPk(id, {
      include: [
        { model: ProjectCategory, as: 'category' },
        { model: ProjectTool, as: 'tools' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_PROJECT_ERROR',
      message: 'Failed to update project'
    });
  }
};

// @desc    Delete project (Admin only)
// @route   DELETE /api/v1/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Project not found'
      });
    }

    // Soft delete by setting deletedAt
    await project.destroy();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_PROJECT_ERROR',
      message: 'Failed to delete project'
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  getCategories,
  createProject,
  updateProject,
  deleteProject
};