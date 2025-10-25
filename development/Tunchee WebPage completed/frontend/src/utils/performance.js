// Performance optimization utilities

// Lazy loading for images
export const lazyLoadImage = (src, placeholder = '') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Debounce function for performance
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // Preload critical images (hero images, logos, etc.)
  const criticalImages = [
    // Add critical image URLs here
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

// Optimize animations for reduced motion preference
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Performance monitoring
export const performanceMonitor = {
  // Measure page load performance
  measurePageLoad: () => {
    if (performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

      console.log('Page Load Performance:', {
        totalLoadTime: loadTime + 'ms',
        domReadyTime: domReady + 'ms',
        networkLatency: timing.responseEnd - timing.requestStart + 'ms'
      });

      return {
        loadTime,
        domReady,
        networkLatency: timing.responseEnd - timing.requestStart
      };
    }
  },

  // Monitor Core Web Vitals
  measureCoreWebVitals: () => {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime + 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime + 'ms');
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  },

  // Monitor animation performance
  monitorAnimationFrames: () => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        console.log('FPS:', fps);

        // Alert if FPS drops below 30
        if (fps < 30) {
          console.warn('Low FPS detected:', fps);
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }
};

// Bundle size optimization - dynamic imports
export const loadComponentDynamically = (importFunc) => {
  return React.lazy(importFunc);
};

// Service worker for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (performance.memory) {
    setInterval(() => {
      const memory = performance.memory;
      console.log('Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
      });
    }, 5000);
  }
};

// Optimize scroll performance
export const optimizeScroll = (callback) => {
  let ticking = false;

  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
};

// Image optimization utilities
export const optimizeImage = {
  // Generate responsive image srcSet
  generateSrcSet: (baseUrl, widths = [480, 768, 1024, 1280, 1920]) => {
    return widths.map(width => `${baseUrl}?w=${width} ${width}w`).join(', ');
  },

  // Generate WebP fallback
  generateWebPSrcSet: (baseUrl, widths = [480, 768, 1024, 1280, 1920]) => {
    return widths.map(width => `${baseUrl}?w=${width}&format=webp ${width}w`).join(', ');
  },

  // Lazy load images with intersection observer
  lazyLoadImages: () => {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = createIntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
};

// Animation performance optimization
export const animationOptimization = {
  // Use transform and opacity for better performance
  useHardwareAcceleration: (element) => {
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
  },

  // Batch DOM updates
  batchUpdates: (updates) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Optimize Framer Motion animations
  optimizeFramerMotion: {
    // Reduce motion for users who prefer it
    reducedMotion: prefersReducedMotion(),

    // Use layout animations sparingly
    layoutConfig: {
      duration: prefersReducedMotion() ? 0.01 : 0.3
    }
  }
};

// API optimization
export const apiOptimization = {
  // Cache API responses
  cache: new Map(),

  // Debounced API calls
  debouncedFetch: debounce(async (url, options = {}) => {
    const cacheKey = `${options.method || 'GET'}-${url}`;

    if (apiOptimization.cache.has(cacheKey) && !options.skipCache) {
      return apiOptimization.cache.get(cacheKey);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok) {
        apiOptimization.cache.set(cacheKey, data);
        // Cache for 5 minutes
        setTimeout(() => apiOptimization.cache.delete(cacheKey), 300000);
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, 300),

  // Prefetch data
  prefetchData: (urls) => {
    urls.forEach(url => {
      fetch(url, { priority: 'low' }).catch(() => {
        // Ignore prefetch errors
      });
    });
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Only run in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || window.location.search.includes('perf=true')) {
    performanceMonitor.measureCoreWebVitals();
    performanceMonitor.monitorAnimationFrames();
    monitorMemoryUsage();

    // Log page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor.measurePageLoad();
      }, 0);
    });
  }
};