import React from 'react';
import { motion } from 'framer-motion';
import { useAnimationPerformance } from '../../hooks/usePerformance';

// Optimized animation wrapper that respects user preferences
const OptimizedAnimation = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration,
  ...props
}) => {
  const { prefersReducedMotion, animationDuration, animationDelay } = useAnimationPerformance();

  // Define animation variants
  const variants = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 }
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 }
    },
    bounceIn: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 }
    },
    rotateIn: {
      initial: { opacity: 0, rotate: -180 },
      animate: { opacity: 1, rotate: 0 }
    }
  };

  // Use hardware acceleration for better performance
  const transition = {
    duration: duration || animationDuration,
    delay: animationDelay(delay),
    ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth animation
    // Force hardware acceleration
    willChange: 'transform, opacity'
  };

  // If user prefers reduced motion, skip animations
  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants[animation]}
      transition={transition}
      // Performance optimizations
      style={{
        backfaceVisibility: 'hidden',
        perspective: 1000,
        transform: 'translateZ(0)'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Specialized animation components for common use cases
export const FadeIn = ({ children, ...props }) => (
  <OptimizedAnimation animation="fadeIn" {...props}>
    {children}
  </OptimizedAnimation>
);

export const SlideUp = ({ children, ...props }) => (
  <OptimizedAnimation animation="slideUp" {...props}>
    {children}
  </OptimizedAnimation>
);

export const SlideDown = ({ children, ...props }) => (
  <OptimizedAnimation animation="slideDown" {...props}>
    {children}
  </OptimizedAnimation>
);

export const SlideLeft = ({ children, ...props }) => (
  <OptimizedAnimation animation="slideLeft" {...props}>
    {children}
  </OptimizedAnimation>
);

export const SlideRight = ({ children, ...props }) => (
  <OptimizedAnimation animation="slideRight" {...props}>
    {children}
  </OptimizedAnimation>
);

export const ScaleIn = ({ children, ...props }) => (
  <OptimizedAnimation animation="scaleIn" {...props}>
    {children}
  </OptimizedAnimation>
);

export const BounceIn = ({ children, ...props }) => (
  <OptimizedAnimation animation="bounceIn" {...props}>
    {children}
  </OptimizedAnimation>
);

// Staggered animation container
export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  ...props
}) => {
  const { prefersReducedMotion } = useAnimationPerformance();

  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered animation item
export const StaggerItem = ({ children, ...props }) => {
  const { prefersReducedMotion, animationDuration } = useAnimationPerformance();

  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            duration: animationDuration,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
      style={{
        backfaceVisibility: 'hidden',
        perspective: 1000,
        transform: 'translateZ(0)'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Hover animation wrapper
export const HoverAnimation = ({
  children,
  scale = 1.05,
  y = -5,
  ...props
}) => {
  const { prefersReducedMotion } = useAnimationPerformance();

  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{
        scale,
        y,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      style={{
        backfaceVisibility: 'hidden',
        perspective: 1000,
        transform: 'translateZ(0)'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Scroll-triggered animation
export const ScrollAnimation = ({
  children,
  animation = 'fadeIn',
  threshold = 0.1,
  ...props
}) => {
  const { prefersReducedMotion } = useAnimationPerformance();

  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
      style={{
        backfaceVisibility: 'hidden',
        perspective: 1000,
        transform: 'translateZ(0)'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedAnimation;