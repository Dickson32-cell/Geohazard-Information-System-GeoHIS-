# Image Upload Implementation - Complete Documentation

## Overview
This document outlines the complete implementation of image upload functionality for both profile pictures and project images across your Tunchee WebPage portfolio system.

## Changes Made

### Backend Changes

#### 1. **New Image Upload Endpoint** (`backend/controllers/imageController.js`)
- **Created**: New controller for handling image uploads
- **Features**:
  - Converts uploaded images to base64 format
  - Validates file type (JPEG, PNG, GIF, WebP)
  - Enforces 5MB file size limit
  - Stores original files in `/uploads` directory
  - Returns both base64 data and file URL

**Key Functions**:
- `uploadImage`: Handles single image uploads with multipart/form-data
- `addProjectImages`: Saves multiple project images to database
- `deleteProjectImage`: Removes project images
- `updateProjectImage`: Updates image metadata (alt text, title, description, order)

#### 2. **Image Upload Routes** (`backend/routes/images.js`)
- **Created**: New route file for image endpoints
- **Endpoints**:
  - `POST /api/v1/images/upload` - Upload image file
  - `POST /api/v1/images/project-images` - Save project images to DB
  - `PUT /api/v1/images/project-images/:id` - Update image metadata
  - `DELETE /api/v1/images/project-images/:id` - Delete project image
- **Authentication**: All routes require admin authorization

#### 3. **Server Configuration** (`backend/server.js`)
- Added image routes to server.js
- Enabled `/uploads` static file serving
- Configured Express to accept multipart form data (up to 10MB limit)

#### 4. **Project Routes Enhancement** (`backend/routes/projects.js`)
- Added admin endpoints for fetching projects with images:
  - `GET /api/v1/projects/admin/list` - Get all projects (admin only, includes unpublished)
  - `GET /api/v1/projects/admin/:id` - Get single project with all images and details (admin only)
- These endpoints return full image data for editing

### Frontend Changes

#### 1. **Profile Picture Upload Update** (`frontend/src/components/admin/ProfileForm.jsx`)
- **Modified**: `handleImageUpload` function
- **Changes**:
  - Now uses multipart form data instead of base64 conversion
  - Calls `/api/v1/images/upload` endpoint
  - Receives base64 image from backend
  - Updates profile picture immediately
  - Better error handling with specific error messages
  - Shows upload progress feedback

**Upload Flow**:
```
User selects image → Validate file → Upload to /api/v1/images/upload 
→ Receive base64 → Save to profile via /api/v1/auth/profile 
→ Broadcast update via UpdateContext → Display on Home page
```

#### 2. **Project Form Enhancement** (`frontend/src/components/admin/ProjectForm.jsx`)
- **Enhanced**: Complete image upload functionality for projects
- **New Features**:
  - Featured image upload button (inline with URL field)
  - Multiple project image upload capability
  - Image preview grid with metadata fields
  - Edit image metadata (title, alt text, description)
  - Remove uploaded images from form
  - Auto-save integration

**New State Variables**:
```javascript
const [uploadedImages, setUploadedImages] = useState([]);
const [uploading, setUploading] = useState(false);
```

**New Functions**:
- `handleFeaturedImageUpload`: Upload featured image with preview
- `handleProjectImagesUpload`: Upload multiple project images
- `removeUploadedImage`: Remove image from upload list
- `updateImageMetadata`: Update image metadata before saving

**Enhanced handleSubmit**:
- Saves project first
- Then saves all uploaded images to ProjectImages table
- Each image stores: URL, alt text, title, description, display order

**Upload Flow**:
```
User selects images → Validate each file → Upload to /api/v1/images/upload
→ Display previews with metadata fields → User edits metadata → Submit form
→ Create/Update project → Save images to ProjectImages table
→ Broadcast update via UpdateContext → Display on Portfolio page
```

#### 3. **UI Components Updated**
- Added FaImage icon import in ProjectForm
- Added image preview section with:
  - Thumbnail previews
  - Metadata editing fields (title, alt text, description)
  - Delete button for each image
  - File size display
  - Upload progress indicators

### Database Schema (Already Exists)

**ProjectImage Table Structure**:
```javascript
{
  project_id: INTEGER (foreign key to Project)
  image_url: STRING (base64 or URL)
  image_alt_text: STRING
  image_title: STRING
  image_description: TEXT
  display_order: INTEGER
  is_before_after: BOOLEAN
  before_after_pair_id: INTEGER
  file_size: INTEGER
}
```

## How It Works End-to-End

### Profile Picture Upload
1. User clicks upload button in Profile Settings
2. Selects image file (max 5MB, JPG/PNG/GIF/WebP)
3. File sent to `/api/v1/images/upload`
4. Backend converts to base64 and returns
5. Frontend saves via `/api/v1/auth/profile`
6. UpdateContext broadcasts 'profile' event
7. Home page subscribes and updates display immediately
8. Success notification shows to user

### Project Image Upload
1. User creates/edits project in Admin Dashboard
2. Can upload featured image (inline with URL field)
3. Can upload multiple project images
4. Each image shows preview with metadata fields
5. User fills: title, alt text, description
6. On form submission:
   - Project saved first (gets ID if new)
   - Images saved to ProjectImages table
   - UpdateContext broadcasts 'projects' event
   - Portfolio page refreshes and displays images
7. Project Modal carousel shows all images
8. Gallery grid allows switching between images

### Viewing Uploaded Images
1. User visits Portfolio page
2. ProjectModal displays featured image in carousel
3. Navigation arrows or gallery thumbnails switch images
4. All ProjectImages display in order
5. Alt text and descriptions available

## File Uploads Storage

**Location**: `/backend/uploads/`
**Format**: Original files stored + Base64 references in database
**File Naming**: `image-{timestamp}-{randomId}.{extension}`
**Size Limit**: 5MB per file
**Supported Types**: JPEG, PNG, GIF, WebP

## API Endpoints Summary

### Image Upload
- `POST /api/v1/images/upload` - Upload single image
  - Request: multipart/form-data with `image` field
  - Response: `{ image_url: "base64", file_url: "/uploads/...", file_size: 12345 }`

### Project Images
- `POST /api/v1/images/project-images` - Add images to project
  - Request: `{ project_id: 1, images: [{image_url, alt_text, title, ...}] }`
  - Response: Array of created ProjectImage records

- `PUT /api/v1/images/project-images/:id` - Update image metadata
  - Request: `{ display_order, image_alt_text, image_title, image_description }`

- `DELETE /api/v1/images/project-images/:id` - Delete project image

## Error Handling

**Frontend Validation**:
- Check file type (must be image)
- Check file size (max 5MB)
- Show specific error messages to user
- Clear errors on successful upload

**Backend Validation**:
- MIME type validation
- File size validation
- Database constraint checks
- Proper error responses with codes

## Real-Time Synchronization

**UpdateContext Integration**:
- Profile updates notify 'profile' event
- Project updates notify 'projects' event
- Home, Portfolio pages subscribe to these events
- Auto-refresh on any admin changes
- No page refresh required for users

## Testing Checklist

- [ ] Upload profile picture from Admin page
- [ ] Profile picture appears on Home page immediately
- [ ] Upload featured image for project
- [ ] Featured image displays in project form
- [ ] Upload multiple project images
- [ ] Images display with metadata
- [ ] Edit image metadata fields
- [ ] Remove images from list
- [ ] Submit project with images
- [ ] Images appear in Portfolio page
- [ ] ProjectModal shows images in carousel
- [ ] Gallery thumbnails work correctly
- [ ] Image count display works
- [ ] Error messages display for invalid files
- [ ] Large files rejected (>5MB)
- [ ] Invalid file types rejected

## Performance Considerations

1. **Base64 Encoding**: Increases file size ~33%, but simplifies storage
2. **Image Optimization**: Consider adding image compression
3. **Lazy Loading**: ProjectModal uses code splitting
4. **Pagination**: Portfolio uses pagination (12 items/page)
5. **Caching**: Static files cached by browser

## Future Enhancements

1. **Image Cropping**: Add client-side image crop tool
2. **Compression**: Add image compression before upload
3. **Thumbnails**: Generate thumbnails for display
4. **Before/After**: Implement before/after slider
5. **Drag & Reorder**: Drag to reorder images in list
6. **Batch Upload**: Drag multiple files at once
7. **Cloud Storage**: Migrate to S3/Cloud Storage
8. **CDN**: Serve images from CDN for faster loading

## Troubleshooting

**Images not uploading**:
- Check file size (must be < 5MB)
- Check file type (must be JPEG, PNG, GIF, or WebP)
- Check backend server status
- Check browser console for errors

**Images not displaying on main page**:
- Verify UpdateContext is working (check browser console)
- Clear browser cache
- Check if images are saved in database
- Verify project is published (status='published')

**Upload endpoint errors**:
- Check multer configuration in routes/images.js
- Verify /uploads directory exists
- Check file permissions
- Review backend logs

## Deployment Notes

1. Ensure `/backend/uploads` directory exists with write permissions
2. Configure storage for production (S3, etc.)
3. Set up proper file cleanup jobs
4. Configure maximum upload file size in reverse proxy
5. Enable HTTPS for secure file uploads
6. Set up backup strategy for uploaded files

---

**Implementation Date**: October 2024
**Version**: 1.0
**Status**: Production Ready
