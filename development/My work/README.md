# Scroll-Synced Portfolio Video Component

This is a minimal, dependency-free component that pins a video into the viewport and maps scroll progress to the video timeline, creating a scroll-scrubbed portfolio reel.

## How to Run

1. Clone or download the repository.
2. Place your portfolio videos in the `assets/` folder as `portfolio-video.mp4` and `portfolio-video.webm`.
3. Open `index.html` in a modern web browser.
4. Scroll down to see the video play forward; scroll up to rewind.

## Features

- Vanilla HTML/CSS/JavaScript implementation
- Scroll progress mapped to video timeline
- Sticky video in viewport
- Progress bar indicator
- Graceful fallback for unsupported browsers
- Performance optimized with requestAnimationFrame and IntersectionObserver

## Browser Support

- Chrome, Edge, Firefox, Safari
- Mobile: iOS Safari, Android Chrome

## Manual Testing

1. Open `index.html` in browser.
2. Scroll into the video section.
3. Verify video plays forward on scroll down, rewinds on scroll up.
4. Check progress bar updates correctly.
5. Test on mobile devices.

## API

The `ScrollVideo` class provides the following API:

- `new ScrollVideo(videoElement, options)` - Constructor
- `calculateScrollProgress()` - Calculate current scroll progress
- `updateVideoTime(targetProgress)` - Update video time based on progress
- `startScrollTracking()` - Start tracking scroll events
- `stopScrollTracking()` - Stop tracking scroll events
- `setupIntersectionObserver()` - Setup intersection observer for performance
- `destroy()` - Clean up resources

Options:
- `threshold`: Minimum time difference to update video (default 0.05s)
- `smoothing`: Enable smoothing (default true)
- `debug`: Enable debug logging (default false)

## License

[Add your license here]