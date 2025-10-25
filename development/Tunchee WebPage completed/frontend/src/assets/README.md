# Image Upload Guide

## Profile Picture

**Location**: `frontend/src/assets/profile/`
**File naming**: `profile-picture.jpg` (or `.png`, `.jpeg`)

1. Place your profile picture in the `frontend/src/assets/profile/` folder
2. Name it `profile-picture.jpg` (or update the path in `profileData.js` if using a different name)
3. The image will automatically appear on the main page

## Project Images

**Location**: `frontend/src/assets/projects/`
**File naming**: Use descriptive names that match the paths in `projectsData.js`

### Example project image structure:
```
frontend/src/assets/projects/
├── brand-identity.jpg          (featured image for Brand Identity project)
├── brand-identity-1.jpg        (additional image 1)
├── brand-identity-2.jpg        (additional image 2)
├── brand-identity-3.jpg        (additional image 3)
├── ecommerce-design.jpg        (featured image for E-commerce project)
├── ecommerce-1.jpg
├── ecommerce-2.jpg
├── ecommerce-3.jpg
└── ... (other project images)
```

## Important Notes

- **File formats**: JPG, PNG, GIF, SVG, WebP
- **File size**: Keep images under 2MB for better performance
- **Image optimization**: Consider compressing images for web use
- **Path format**: Always use `/src/assets/...` in the data files (Vite will handle the path resolution)

## Alternative: Using Backend Uploads

If you prefer to use the existing uploaded images from the backend:
- Images are stored in `backend/uploads/`
- Access them via: `http://localhost:5002/uploads/filename.jpg`
- Update the paths in your data files accordingly

## Quick Setup

1. Copy your profile picture to `frontend/src/assets/profile/profile-picture.jpg`
2. Copy project images to `frontend/src/assets/projects/` with matching names
3. Restart the frontend server if images don't appear immediately