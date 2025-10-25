const express = require('express');
const { GalleryImage } = require('./models');

const app = express();
app.use(express.json());

// Simple test endpoint
app.get('/test-gallery', async (req, res) => {
  try {
    const images = await GalleryImage.findAll({ limit: 5 });
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5003, () => {
  console.log('Test server running on port 5003');
});