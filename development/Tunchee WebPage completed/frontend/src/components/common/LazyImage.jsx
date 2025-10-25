import React, { useState, useRef, useEffect } from 'react';
import { useLazyLoad, useOptimizedImage } from '../../hooks/usePerformance';

const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = '',
  width,
  height,
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef();

  // Use optimized image hook for responsive images
  const optimizedImage = useOptimizedImage(src);

  // Lazy load hook
  useLazyLoad(imgRef, src, placeholder);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* Main image */}
      <picture>
        {/* WebP source for modern browsers */}
        <source
          srcSet={optimizedImage.webpSrcSet}
          sizes={optimizedImage.sizes}
          type="image/webp"
        />

        {/* Fallback source */}
        <img
          ref={imgRef}
          src={isInView ? optimizedImage.src : placeholder}
          srcSet={isInView ? optimizedImage.srcSet : ''}
          sizes={optimizedImage.sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${hasError ? 'hidden' : ''}`}
          {...props}
        />
      </picture>

      {/* Error state */}
      {hasError && (
        <div
          className="flex items-center justify-center bg-gray-100 text-gray-400"
          style={{ width, height }}
        >
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LazyImage;