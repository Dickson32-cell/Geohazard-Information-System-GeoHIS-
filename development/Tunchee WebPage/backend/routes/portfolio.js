const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Get all portfolio items (public)
router.get('/', async (req, res) => {
  try {
    const { category, status = 'published', visibility = 'public', page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM portfolio_items p
      LEFT JOIN portfolio_categories c ON p.category_id = c.id
      WHERE p.status = ? AND p.visibility = ?
    `;
    let params = [status, visibility];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    query += ' ORDER BY p.sort_order ASC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [items] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM portfolio_items WHERE status = ? AND visibility = ?';
    let countParams = [status, visibility];

    if (category) {
      countQuery += ' AND category_id IN (SELECT id FROM portfolio_categories WHERE slug = ?)';
      countParams.push(category);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get portfolio items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio items',
      error: error.message
    });
  }
});

// Get single portfolio item (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [items] = await pool.execute(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM portfolio_items p
      LEFT JOIN portfolio_categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.status = 'published' AND p.visibility = 'public'
    `, [slug]);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found'
      });
    }

    res.json({
      success: true,
      data: { item: items[0] }
    });

  } catch (error) {
    console.error('Get portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio item',
      error: error.message
    });
  }
});

// Create portfolio item (editor+)
router.post('/', authenticateToken, requireEditor, [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('category_id').optional().isInt(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('visibility').optional().isIn(['public', 'unlisted', 'private', 'client_only'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category_id,
      client_name,
      project_date,
      project_url,
      tools_used,
      images,
      featured_image,
      status = 'draft',
      visibility = 'public',
      password_protected = false,
      access_password,
      sort_order = 0
    } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const [existing] = await pool.execute(
      'SELECT id FROM portfolio_items WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A portfolio item with this title already exists'
      });
    }

    const [result] = await pool.execute(`
      INSERT INTO portfolio_items (
        title, slug, description, category_id, client_name, project_date,
        project_url, tools_used, images, featured_image, status, visibility,
        password_protected, access_password, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, slug, description, category_id, client_name, project_date,
      project_url, JSON.stringify(tools_used || []), JSON.stringify(images || []),
      featured_image, status, visibility, password_protected, access_password, sort_order
    ]);

    res.status(201).json({
      success: true,
      message: 'Portfolio item created successfully',
      data: {
        itemId: result.insertId,
        slug
      }
    });

  } catch (error) {
    console.error('Create portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portfolio item',
      error: error.message
    });
  }
});

// Update portfolio item (editor+)
router.put('/:id', authenticateToken, requireEditor, [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('category_id').optional().isInt(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('visibility').optional().isIn(['public', 'unlisted', 'private', 'client_only'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if item exists
    const [existing] = await pool.execute(
      'SELECT id FROM portfolio_items WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (['tools_used', 'images'].includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(JSON.stringify(updates[key] || []));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    updateValues.push(id);

    const [result] = await pool.execute(
      `UPDATE portfolio_items SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Portfolio item updated successfully'
    });

  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update portfolio item',
      error: error.message
    });
  }
});

// Delete portfolio item (editor+)
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM portfolio_items WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });

  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete portfolio item',
      error: error.message
    });
  }
});

// Get portfolio categories
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM portfolio_categories WHERE is_active = TRUE ORDER BY sort_order ASC'
    );

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

module.exports = router;