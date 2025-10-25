# Quick Start Guide - Image Upload Testing

## Setup

Both servers are now running:
- **Backend**: http://localhost:5002
- **Frontend**: http://localhost:5173

## Step 1: Login to Admin Dashboard

1. Go to http://localhost:5173/admin/login
2. Enter credentials:
   - Email: `sowahjoseph81@gmail.com`
   - Password: `Admin123!`

## Step 2: Upload Profile Picture

1. Navigate to **Profile Settings** tab
2. Click the camera icon on the profile picture
3. Select an image file (JPG, PNG, GIF, or WebP)
4. Image will upload and show immediately
5. Success message will appear
6. Go to **Home** page - profile picture will display automatically

## Step 3: Upload Project Images

### For New Project:

1. Click **"Add New Project"** button in admin panel
2. Fill in basic information:
   - Title (required)
   - Description (required)
   - Category (required)
   - Completion Date (required)

3. Upload Featured Image:
   - Click the **"Upload"** button next to Featured Image URL field
   - Select one image
   - It will display as base64 in the URL field

4. Upload Project Images:
   - Click **"Add Images"** button in Project Images section
   - Select multiple images at once
   - Each image will appear with metadata fields

5. Edit Image Metadata:
   - Add **Title** for each image
   - Add **Alt Text** (accessibility)
   - Add **Description** (optional)
   - Reorder using display_order

6. Click **"Create Project"** button

### For Existing Project:

1. Click **Edit** on a project
2. Follow steps 3-6 above
3. Click **"Update Project"** button

## Step 4: View Uploaded Images

### On Home Page:
- Profile picture displays in hero section
- Updates automatically when changed

### On Portfolio Page:
1. Find your project in the grid
2. Click to open **Project Modal**
3. Featured image displays in carousel
4. Navigation arrows or gallery thumbnails switch between images
5. Image counter shows current position

## Features to Test

### Profile Picture Upload
- ✅ Click upload button
- ✅ Select image
- ✅ See preview
- ✅ Verify on Home page
- ✅ Try different formats (JPG, PNG, GIF)

### Project Featured Image
- ✅ Click upload button
- ✅ Select image
- ✅ See preview in form
- ✅ Verify in ProjectModal

### Project Multiple Images
- ✅ Upload 3-5 images
- ✅ Edit metadata for each
- ✅ See previews
- ✅ Remove images if needed
- ✅ Reorder images
- ✅ Submit project
- ✅ Verify all images display in modal

### Carousel Navigation
- ✅ Click next/previous arrows
- ✅ Click thumbnail to jump to image
- ✅ See image counter
- ✅ Keyboard arrows work (if implemented)

### Error Handling
- ✅ Try uploading file > 5MB (should reject)
- ✅ Try uploading non-image file (should reject)
- ✅ Check error messages display correctly

## Real-Time Sync Testing

1. Open **two browser windows**
2. Window 1: Admin dashboard
3. Window 2: Portfolio page

### Test Profile Picture Sync:
1. Upload profile picture in Window 1
2. Watch Window 2 - image appears immediately without refresh

### Test Project Update Sync:
1. Create new project in Window 1
2. Watch Window 2 - project appears in grid
3. Update project in Window 1
4. Watch Window 2 - changes reflect immediately

## Common Issues & Solutions

### Issue: Image not uploading
**Solution**: 
- Check file size (max 5MB)
- Check file format (JPG, PNG, GIF, WebP only)
- Check browser console for errors
- Restart backend server

### Issue: Images appear in form but not when saved
**Solution**:
- Check that project was created successfully
- Verify no error messages in browser console
- Check backend logs for database errors
- Ensure project status is "Published"

### Issue: Profile picture not updating on Home page
**Solution**:
- Hard refresh Home page (Ctrl+Shift+R)
- Check UpdateContext is working
- Check browser console for JavaScript errors

### Issue: Upload button not responding
**Solution**:
- Check backend server is running
- Check browser console for fetch errors
- Try refreshing the page
- Clear browser cache

## Backend Troubleshooting

### Check Backend Logs:
```bash
# Terminal where backend is running
# Look for error messages in the output
```

### Test Endpoints Manually:

```bash
# Test upload endpoint
curl -X POST http://localhost:5002/api/v1/images/upload \
  -F "image=@/path/to/image.jpg"

# Test health check
curl http://localhost:5002/health
```

## File Locations

- **Uploaded Files**: `backend/uploads/image-*.{jpg|png|gif|webp}`
- **Frontend Components**: `frontend/src/components/admin/ProjectForm.jsx`
- **Backend Routes**: `backend/routes/images.js`
- **Backend Controller**: `backend/controllers/imageController.js`

## Next Steps

After successful testing:

1. **Deploy to Production**:
   - Set up file storage (S3/Cloud)
   - Configure environment variables
   - Set up backup strategy

2. **Optimize**:
   - Add image compression
   - Implement thumbnails
   - Add image cropping tool

3. **Monitor**:
   - Track file uploads
   - Monitor storage usage
   - Check error rates

## Support

For issues or questions, check:
- Browser Console (F12) for client errors
- Backend terminal for server errors
- `IMAGE_UPLOAD_DOCUMENTATION.md` for detailed technical info
