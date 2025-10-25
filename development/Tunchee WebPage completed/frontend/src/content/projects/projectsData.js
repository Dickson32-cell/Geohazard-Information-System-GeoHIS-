// Projects data for portfolio display
// This data is used to display projects on the main page
// Update this file directly to add, remove, or modify projects

const projectsData = [
  {
    id: 1,
    title: "Brand Identity Design",
    slug: "brand-identity-design",
    description: "Complete brand identity package including logo, color palette, typography, and brand guidelines for a tech startup.",
    category: "Branding",
    client: "Tech Startup Inc.",
    completionDate: "2024-10-01",
    featuredImage: "/src/assets/projects/brand-identity.jpg",
    images: [
      "/src/assets/projects/brand-identity-1.jpg",
      "/src/assets/projects/brand-identity-2.jpg",
      "/src/assets/projects/brand-identity-3.jpg"
    ],
    tools: [
      { name: "Adobe Illustrator", category: "Design" },
      { name: "Adobe Photoshop", category: "Design" },
      { name: "Figma", category: "Design" }
    ],
    isFeatured: true,
    isPublished: true,
    seoTitle: "Brand Identity Design - Complete Branding Package",
    seoDescription: "Professional brand identity design including logo, colors, and guidelines for tech startup."
  },
  {
    id: 2,
    title: "E-commerce Website Design",
    slug: "ecommerce-website-design",
    description: "Modern, responsive e-commerce website design with focus on user experience and conversion optimization.",
    category: "Web Design",
    client: "Fashion Retailer",
    completionDate: "2024-09-15",
    featuredImage: "/src/assets/projects/ecommerce-design.jpg",
    images: [
      "/src/assets/projects/ecommerce-1.jpg",
      "/src/assets/projects/ecommerce-2.jpg",
      "/src/assets/projects/ecommerce-3.jpg"
    ],
    tools: [
      { name: "Figma", category: "Design" },
      { name: "Adobe XD", category: "Design" },
      { name: "Sketch", category: "Design" }
    ],
    isFeatured: true,
    isPublished: true,
    seoTitle: "E-commerce Website Design - Modern Online Store",
    seoDescription: "Responsive e-commerce website design focused on user experience and sales conversion."
  },
  {
    id: 3,
    title: "Magazine Layout Design",
    slug: "magazine-layout-design",
    description: "Editorial design for a lifestyle magazine featuring clean layouts, typography hierarchy, and visual storytelling.",
    category: "Print Design",
    client: "Lifestyle Magazine",
    completionDate: "2024-08-20",
    featuredImage: "/src/assets/projects/magazine-layout.jpg",
    images: [
      "/src/assets/projects/magazine-1.jpg",
      "/src/assets/projects/magazine-2.jpg",
      "/src/assets/projects/magazine-3.jpg"
    ],
    tools: [
      { name: "Adobe InDesign", category: "Design" },
      { name: "Adobe Photoshop", category: "Design" },
      { name: "Adobe Illustrator", category: "Design" }
    ],
    isFeatured: false,
    isPublished: true,
    seoTitle: "Magazine Layout Design - Editorial Design",
    seoDescription: "Professional magazine layout design with clean typography and visual storytelling."
  },
  {
    id: 4,
    title: "Social Media Graphics",
    slug: "social-media-graphics",
    description: "Complete social media graphic package including posts, stories, covers, and promotional materials.",
    category: "Digital Design",
    client: "Local Business",
    completionDate: "2024-07-10",
    featuredImage: "/src/assets/projects/social-media.jpg",
    images: [
      "/src/assets/projects/social-1.jpg",
      "/src/assets/projects/social-2.jpg",
      "/src/assets/projects/social-3.jpg"
    ],
    tools: [
      { name: "Adobe Photoshop", category: "Design" },
      { name: "Canva", category: "Design" },
      { name: "Adobe Spark", category: "Design" }
    ],
    isFeatured: false,
    isPublished: true,
    seoTitle: "Social Media Graphics - Complete Brand Package",
    seoDescription: "Professional social media graphics including posts, stories, and promotional materials."
  },
  {
    id: 5,
    title: "Packaging Design",
    slug: "packaging-design",
    description: "Product packaging design for a premium cosmetics line with sustainable materials and elegant aesthetics.",
    category: "Packaging",
    client: "Cosmetics Brand",
    completionDate: "2024-06-05",
    featuredImage: "/src/assets/projects/packaging.jpg",
    images: [
      "/src/assets/projects/packaging-1.jpg",
      "/src/assets/projects/packaging-2.jpg",
      "/src/assets/projects/packaging-3.jpg"
    ],
    tools: [
      { name: "Adobe Illustrator", category: "Design" },
      { name: "Adobe Photoshop", category: "Design" },
      { name: "3D Studio Max", category: "3D" }
    ],
    isFeatured: true,
    isPublished: true,
    seoTitle: "Packaging Design - Premium Cosmetics",
    seoDescription: "Elegant packaging design for premium cosmetics with sustainable materials focus."
  },
  {
    id: 6,
    title: "Book Cover Design",
    slug: "book-cover-design",
    description: "Intriguing book cover design for a mystery novel with atmospheric illustration and compelling typography.",
    category: "Book Design",
    client: "Independent Author",
    completionDate: "2024-05-12",
    featuredImage: "/src/assets/projects/book-cover.jpg",
    images: [
      "/src/assets/projects/book-cover-1.jpg",
      "/src/assets/projects/book-cover-2.jpg"
    ],
    tools: [
      { name: "Adobe Illustrator", category: "Design" },
      { name: "Adobe Photoshop", category: "Design" },
      { name: "Procreate", category: "Digital Art" }
    ],
    isFeatured: false,
    isPublished: true,
    seoTitle: "Book Cover Design - Mystery Novel",
    seoDescription: "Atmospheric book cover design for mystery novel with custom illustration."
  }
];

// Helper functions for working with projects data
export const getFeaturedProjects = () => {
  return projectsData.filter(project => project.isFeatured && project.isPublished);
};

export const getProjectsByCategory = (category) => {
  return projectsData.filter(project => project.category === category && project.isPublished);
};

export const getProjectBySlug = (slug) => {
  return projectsData.find(project => project.slug === slug && project.isPublished);
};

export const getAllProjects = () => {
  return projectsData.filter(project => project.isPublished);
};

export default projectsData;