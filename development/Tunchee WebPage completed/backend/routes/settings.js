const express = require('express');
const router = express.Router();
const { SiteSetting } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get all site settings
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSetting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        settings: groupedSettings,
        raw: settings
      }
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings'
    });
  }
});

// Get settings by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await SiteSetting.findAll({
      where: { category },
      order: [['key', 'ASC']]
    });

    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Update multiple settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const updatePromises = [];

    // Flatten the settings object and update each setting
    Object.entries(settings).forEach(([category, categorySettings]) => {
      Object.entries(categorySettings).forEach(([key, value]) => {
        updatePromises.push(
          SiteSetting.upsert({
            key,
            value: String(value),
            category
          })
        );
      });
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Update single setting
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, category } = req.body;

    const setting = await SiteSetting.findByPk(id);
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    await setting.update({
      key: key || setting.key,
      value: value || setting.value,
      category: category || setting.category
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

// Create new setting
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { key, value, category } = req.body;

    if (!key || !category) {
      return res.status(400).json({
        success: false,
        message: 'Key and category are required'
      });
    }

    const setting = await SiteSetting.create({
      key,
      value: value || '',
      category
    });

    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setting'
    });
  }
});

// Delete setting
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const setting = await SiteSetting.findByPk(id);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    await setting.destroy();

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting'
    });
  }
});

module.exports = router;