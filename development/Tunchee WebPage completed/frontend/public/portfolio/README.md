# Portfolio Images

This folder contains images displayed in the portfolio section of the website.

## How to Add Images

1. Copy your portfolio images to this folder
2. Update the `portfolioImages` array in `src/pages/Portfolio.jsx` to include your new images
3. Each image should have:
   - A unique ID
   - The image filename
   - A title for the image
   - Alt text for accessibility

## Example

```javascript
{
  id: '1',
  image_url: '/portfolio/your-image.jpg',
  image_title: 'Your Project Title',
  image_alt_text: 'Description of your work',
  full_url: '/portfolio/your-image.jpg'
}
```

## Supported Formats

- JPG/JPEG
- PNG
- GIF
- WebP

## Image Optimization

- Keep file sizes under 500KB for better loading performance
- Use descriptive filenames
- Ensure images are high quality but optimized for web