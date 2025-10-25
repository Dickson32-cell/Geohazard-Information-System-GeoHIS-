const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'TOO_MANY_LOGIN_ATTEMPTS',
    message: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiter for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 contact form submissions per hour
  message: {
    success: false,
    error: 'TOO_MANY_CONTACT_SUBMISSIONS',
    message: 'Too many contact form submissions, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_CONTACT_SUBMISSIONS',
      message: 'Too many contact form submissions, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 file uploads per hour
  message: {
    success: false,
    error: 'TOO_MANY_UPLOADS',
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_UPLOADS',
      message: 'Too many file uploads, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Create a rate limiter middleware that can be configured per route
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
  apiLimiter,
  authLimiter,
  contactLimiter,
  uploadLimiter,
  createRateLimiter,
  rateLimit
};