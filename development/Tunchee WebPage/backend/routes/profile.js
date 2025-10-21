const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Get profile (public)
router.get('/', async (req, res) => {
  try {
    const [profiles] = await pool.execute('SELECT * FROM profile LIMIT 1');

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: { profile: profiles[0] }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Update profile (editor+)
router.put('/', authenticateToken, requireEditor, [
  body('full_name').optional().trim().isLength({ min: 1, max: 255 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('website').optional().isURL(),
  body('linkedin').optional().isURL(),
  body('instagram').optional().isURL(),
  body('behance').optional().isURL(),
  body('dribbble').optional().isURL()
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

    const updates = req.body;

    // Check if profile exists
    const [existing] = await pool.execute('SELECT id FROM profile LIMIT 1');

    if (existing.length === 0) {
      // Create new profile
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const placeholders = fields.map(() => '?').join(', ');

      await pool.execute(
        `INSERT INTO profile (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );
    } else {
      // Update existing profile
      const updateFields = Object.keys(updates).map(key => `${key} = ?`);
      const updateValues = Object.values(updates);
      updateValues.push(existing[0].id);

      await pool.execute(
        `UPDATE profile SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Get skills (public)
router.get('/skills', async (req, res) => {
  try {
    const [skills] = await pool.execute(
      'SELECT * FROM skills WHERE is_active = TRUE ORDER BY sort_order ASC'
    );

    res.json({
      success: true,
      data: { skills }
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skills',
      error: error.message
    });
  }
});

// Update skills (editor+)
router.put('/skills', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be an array'
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete existing skills
      await connection.execute('DELETE FROM skills');

      // Insert new skills
      if (skills.length > 0) {
        const values = skills.map(skill => [
          skill.name,
          skill.category || 'technical',
          skill.proficiency_level || 50,
          skill.icon_url || null,
          skill.sort_order || 0,
          skill.is_active !== undefined ? skill.is_active : true
        ]);

        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const flattenedValues = values.flat();

        await connection.execute(`
          INSERT INTO skills (name, category, proficiency_level, icon_url, sort_order, is_active)
          VALUES ${placeholders}
        `, flattenedValues);
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Skills updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skills',
      error: error.message
    });
  }
});

// Get experience (public)
router.get('/experience', async (req, res) => {
  try {
    const [experience] = await pool.execute(
      'SELECT * FROM experience WHERE is_active = TRUE ORDER BY sort_order ASC, start_date DESC'
    );

    res.json({
      success: true,
      data: { experience }
    });

  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get experience',
      error: error.message
    });
  }
});

// Update experience (editor+)
router.put('/experience', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { experience } = req.body;

    if (!Array.isArray(experience)) {
      return res.status(400).json({
        success: false,
        message: 'Experience must be an array'
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete existing experience
      await connection.execute('DELETE FROM experience');

      // Insert new experience
      if (experience.length > 0) {
        const values = experience.map(exp => [
          exp.title,
          exp.company || null,
          exp.location || null,
          exp.start_date,
          exp.end_date || null,
          exp.is_current || false,
          exp.description || null,
          JSON.stringify(exp.achievements || []),
          JSON.stringify(exp.technologies || []),
          exp.sort_order || 0,
          exp.is_active !== undefined ? exp.is_active : true
        ]);

        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flattenedValues = values.flat();

        await connection.execute(`
          INSERT INTO experience (title, company, location, start_date, end_date, is_current,
                                description, achievements, technologies, sort_order, is_active)
          VALUES ${placeholders}
        `, flattenedValues);
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Experience updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update experience',
      error: error.message
    });
  }
});

module.exports = router;