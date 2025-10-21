-- Anyetei Sowah Joseph Portfolio Database Schema
-- Version: 1.0.0
-- Created: October 20, 2025

-- Create database
CREATE DATABASE IF NOT EXISTS asj_portfolio;
USE asj_portfolio;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Profile information
CREATE TABLE IF NOT EXISTS profile (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  bio TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  website VARCHAR(255),
  linkedin VARCHAR(255),
  instagram VARCHAR(255),
  behance VARCHAR(255),
  dribbble VARCHAR(255),
  profile_image VARCHAR(500),
  resume_file VARCHAR(500),
  mission_statement TEXT,
  vision_statement TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolio categories
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category_id INT,
  client_name VARCHAR(255),
  project_date DATE,
  project_url VARCHAR(500),
  tools_used TEXT, -- JSON array of tools
  images JSON, -- Array of image URLs
  featured_image VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  visibility ENUM('public', 'unlisted', 'private', 'client_only') DEFAULT 'public',
  password_protected BOOLEAN DEFAULT FALSE,
  access_password VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES portfolio_categories(id) ON DELETE SET NULL
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category ENUM('technical', 'creative', 'analytical', 'communication') DEFAULT 'technical',
  proficiency_level INT CHECK (proficiency_level >= 1 AND proficiency_level <= 100),
  icon_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experience/Timeline
CREATE TABLE IF NOT EXISTS experience (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  achievements TEXT, -- JSON array of achievements
  technologies TEXT, -- JSON array of technologies used
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_name VARCHAR(255) NOT NULL,
  client_position VARCHAR(255),
  client_company VARCHAR(255),
  client_image VARCHAR(500),
  testimonial_text TEXT NOT NULL,
  project_name VARCHAR(255),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url VARCHAR(500),
  certificate_file VARCHAR(500),
  description TEXT,
  skills_validated TEXT, -- JSON array of skills
  is_verified BOOLEAN DEFAULT FALSE,
  verification_url VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  visibility ENUM('public', 'unlisted', 'private') DEFAULT 'public',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blog posts (optional)
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content LONGTEXT,
  featured_image VARCHAR(500),
  author_id INT,
  tags TEXT, -- JSON array of tags
  category VARCHAR(100),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  visibility ENUM('public', 'unlisted', 'private') DEFAULT 'public',
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Contact inquiries
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  phone VARCHAR(50),
  project_type VARCHAR(100),
  budget_range VARCHAR(100),
  timeline VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  is_responded BOOLEAN DEFAULT FALSE,
  response_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL
);

-- Analytics/Statistics
CREATE TABLE IF NOT EXISTS site_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_url VARCHAR(500) NOT NULL,
  visitor_ip VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  session_id VARCHAR(255),
  event_type VARCHAR(100), -- 'page_view', 'contact_form', etc.
  event_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- File uploads tracking
CREATE TABLE IF NOT EXISTS file_uploads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  s3_key VARCHAR(500),
  s3_url VARCHAR(500),
  uploaded_by INT,
  related_type VARCHAR(50), -- 'portfolio', 'certificate', 'profile', etc.
  related_id INT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123 - should be changed)
INSERT IGNORE INTO users (email, password_hash, role) VALUES
('admin@asjportfolio.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert default profile
INSERT IGNORE INTO profile (full_name, tagline, bio) VALUES
('Anyetei Sowah Joseph', 'Designing impactful visuals that inspire.',
'A passionate graphic designer with expertise in branding, UI/UX design, and creative storytelling. With years of experience in the design industry, I create visually compelling solutions that help businesses and individuals stand out.');

-- Insert default portfolio categories
INSERT IGNORE INTO portfolio_categories (name, slug, description, sort_order) VALUES
('Logo Design', 'logo-design', 'Custom logo design and branding identity', 1),
('Branding', 'branding', 'Complete brand identity packages', 2),
('Posters', 'posters', 'Event and promotional posters', 3),
('UI/UX Design', 'ui-ux-design', 'User interface and experience design', 4),
('3D Work', '3d-work', 'Three-dimensional design and modeling', 5);

-- Insert default skills
INSERT IGNORE INTO skills (name, category, proficiency_level, sort_order) VALUES
('Adobe Photoshop', 'technical', 95, 1),
('Adobe Illustrator', 'technical', 90, 2),
('Figma', 'technical', 85, 3),
('Adobe After Effects', 'technical', 80, 4),
('Blender', 'technical', 75, 5),
('Creative Direction', 'creative', 90, 6),
('Brand Strategy', 'analytical', 85, 7),
('Client Communication', 'communication', 95, 8);

-- Insert default site settings
INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_title', 'Anyetei Sowah Joseph - Portfolio', 'string', 'Main site title', TRUE),
('site_description', 'Professional portfolio showcasing graphic design work', 'string', 'Site meta description', TRUE),
('contact_email', 'hello@asjportfolio.com', 'string', 'Primary contact email', TRUE),
('theme_primary_color', '#1e40af', 'string', 'Primary theme color (blue)', TRUE),
('theme_secondary_color', '#f59e0b', 'string', 'Secondary theme color (gold)', TRUE),
('enable_blog', 'false', 'boolean', 'Enable blog functionality', FALSE),
('enable_testimonials', 'true', 'boolean', 'Show testimonials section', TRUE),
('items_per_page', '12', 'number', 'Portfolio items per page', FALSE);

-- Create indexes for better performance
CREATE INDEX idx_portfolio_status ON portfolio_items(status);
CREATE INDEX idx_portfolio_visibility ON portfolio_items(visibility);
CREATE INDEX idx_portfolio_category ON portfolio_items(category_id);
CREATE INDEX idx_blog_status ON blog_posts(status);
CREATE INDEX idx_blog_published ON blog_posts(published_at);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_contact_created ON contact_inquiries(created_at);
CREATE INDEX idx_analytics_created ON site_analytics(created_at);
CREATE INDEX idx_files_related ON file_uploads(related_type, related_id);