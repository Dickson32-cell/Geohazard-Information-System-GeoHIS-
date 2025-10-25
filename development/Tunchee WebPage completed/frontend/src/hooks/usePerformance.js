import { useEffect, useCallback, useRef } from 'react';
import {
  debounce,
  throttle,
  createIntersectionObserver,
  prefersReducedMotion,
  optimizeScroll
} from '../utils/performance';

// Custom hook for lazy loading images
export const useLazyLoad = (ref, src, placeholder = '') => {
  useEffect(() => {
    if (!ref.current) return;

    const img = ref.current;

    const observer = createIntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.remove('lazy-loading');
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);

    return () => observer.disconnect();
  }, [ref, src, placeholder]);
};

// Custom hook for debounced window resize
export const useDebouncedResize = (callback, delay = 250) => {
  const debouncedCallback = useCallback(debounce(callback, delay), [callback, delay]);

  useEffect(() => {
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
  }, [debouncedCallback]);
};

// Custom hook for throttled scroll events
export const useThrottledScroll = (callback, limit = 16) => {
  const throttledCallback = useCallback(throttle(callback, limit), [callback, limit]);

  useEffect(() => {
    window.addEventListener('scroll', throttledCallback, { passive: true });
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [throttledCallback]);
};

// Custom hook for optimized scroll handler
export const useOptimizedScroll = (callback) => {
  const optimizedCallback = useCallback(optimizeScroll(callback), [callback]);

  useEffect(() => {
    window.addEventListener('scroll', optimizedCallback, { passive: true });
    return () => window.removeEventListener('scroll', optimizedCallback);
  }, [optimizedCallback]);
};

// Custom hook for intersection observer
export const useIntersectionObserver = (ref, callback, options = {}) => {
  useEffect(() => {
    if (!ref.current) return;

    const observer = createIntersectionObserver(callback, options);
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, callback, options]);
};

// Custom hook for animation performance
export const useAnimationPerformance = () => {
  const prefersReduced = prefersReducedMotion();

  return {
    prefersReducedMotion: prefersReduced,
    animationDuration: prefersReduced ? 0.01 : 0.3,
    animationDelay: (index) => prefersReduced ? 0 : index * 0.1
  };
};

// Custom hook for measuring component performance
export const usePerformanceMeasure = (componentName) => {
  const startTimeRef = useRef();

  useEffect(() => {
    startTimeRef.current = performance.now();
  });

  useEffect(() => {
    if (startTimeRef.current) {
      const endTime = performance.now();
      const renderTime = endTime - startTimeRef.current;

      // Log slow renders (> 16ms for 60fps)
      if (renderTime > 16) {
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    }
  });
};

// Custom hook for API calls with caching
export const useApiCache = () => {
  const cache = useRef(new Map());

  const cachedFetch = useCallback(async (url, options = {}) => {
    const cacheKey = `${options.method || 'GET'}-${url}`;

    if (cache.current.has(cacheKey) && !options.skipCache) {
      return cache.current.get(cacheKey);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok) {
        cache.current.set(cacheKey, data);
        // Cache for 5 minutes
        setTimeout(() => cache.current.delete(cacheKey), 300000);
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, []);

  return cachedFetch;
};

// Custom hook for image optimization
export const useOptimizedImage = (src, widths = [480, 768, 1024, 1280, 1920]) => {
  const generateSrcSet = useCallback((baseUrl, imgWidths) => {
    return imgWidths.map(width => `${baseUrl}?w=${width} ${width}w`).join(', ');
  }, []);

  const generateWebPSrcSet = useCallback((baseUrl, imgWidths) => {
    return imgWidths.map(width => `${baseUrl}?w=${width}&format=webp ${width}w`).join(', ');
  }, []);

  return {
    src,
    srcSet: generateSrcSet(src, widths),
    webpSrcSet: generateWebPSrcSet(src, widths),
    sizes: '(max-width: 480px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 60vw, 50vw'
  };
};

// Custom hook for preloading resources
export const usePreloadResources = (resources) => {
  useEffect(() => {
    resources.forEach(resource => {
      if (resource.type === 'image') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = 'image';
        document.head.appendChild(link);
      } else if (resource.type === 'font') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, [resources]);
};

// Custom hook for monitoring component re-renders
export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};

// Custom hook for memory usage monitoring
export const useMemoryMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performance.memory) {
      const interval = setInterval(() => {
        const memory = performance.memory;
        console.log('Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
        });
      }, 10000);

      return () => clearInterval(interval);
    }
  }, []);
};