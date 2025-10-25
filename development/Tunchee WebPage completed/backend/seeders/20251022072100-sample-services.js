'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert sample services
    await queryInterface.bulkInsert('services', [
      {
        name: 'Logo Design',
        slug: 'logo-design',
        description: 'Professional logo design that captures your brand essence and creates lasting impressions.',
        icon_url: 'FaPalette',
        turnaround_time_days: 7,
        base_price: 500,
        display_order: 1,
        is_featured: true,

        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Branding & Identity',
        slug: 'branding-identity',
        description: 'Complete brand identity systems including logos, color palettes, typography, and brand guidelines.',
        icon_url: 'FaRocket',
        turnaround_time_days: 14,
        base_price: 1500,
        display_order: 2,
        is_featured: true,

        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'UI/UX Design',
        slug: 'ui-ux-design',
        description: 'User-centered design solutions that create intuitive and engaging digital experiences.',
        icon_url: 'FaMobileAlt',
        turnaround_time_days: 10,
        base_price: 800,
        display_order: 3,
        is_featured: true,

        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Print Design',
        slug: 'print-design',
        description: 'Eye-catching print materials that communicate your message effectively across all mediums.',
        icon_url: 'FaPrint',
        turnaround_time_days: 5,
        base_price: 300,
        display_order: 4,
        is_featured: false,

        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Packaging Design',
        slug: 'packaging-design',
        description: 'Creative packaging solutions that make your products stand out on the shelves.',
        icon_url: 'FaShoppingBag',
        turnaround_time_days: 8,
        base_price: 600,
        display_order: 5,
        is_featured: false,

        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Motion Graphics',
        slug: 'motion-graphics',
        description: 'Dynamic animations and video content that bring your brand to life.',
        icon_url: 'FaVideo',
        turnaround_time_days: 12,
        base_price: 1000,
        display_order: 6,
        is_featured: false,

        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Social Media Design',
        slug: 'social-media-design',
        description: 'Engaging social media content that builds your brand presence and drives engagement.',
        icon_url: 'FaShareAlt',
        turnaround_time_days: 3,
        base_price: 200,
        display_order: 7,
        is_featured: false,

        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Get the inserted services to get their IDs
    const services = await queryInterface.sequelize.query(
      'SELECT id, slug FROM services ORDER BY display_order',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Insert service packages
    const packages = [];

    services.forEach(service => {
      switch (service.slug) {
        case 'logo-design':
          packages.push(
            {
              service_id: service.id,
              package_name: 'Starter',
              price: 299,
              description: 'Perfect for startups and small businesses',
              deliverables: JSON.stringify(['3 concepts', '2 revisions']),
              revision_count: 2,
              turnaround_days: 5,
              display_order: 1,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Professional',
              price: 599,
              description: 'Ideal for growing businesses',
              deliverables: JSON.stringify(['5 concepts', '5 revisions', 'Brand guidelines']),
              revision_count: 5,
              turnaround_days: 7,
              display_order: 2,
              is_popular: true,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Premium',
              price: 999,
              description: 'Complete logo solution with all deliverables',
              deliverables: JSON.stringify(['Unlimited concepts', 'Unlimited revisions', 'Brand guidelines', 'Source files']),
              revision_count: 0,
              turnaround_days: 10,
              display_order: 3,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
          break;

        case 'branding-identity':
          packages.push(
            {
              service_id: service.id,
              package_name: 'Essential',
              price: 899,
              description: 'Core brand identity elements',
              deliverables: JSON.stringify(['Logo design', 'Color palette', 'Typography']),
              revision_count: 3,
              turnaround_days: 10,
              display_order: 1,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Complete',
              price: 1499,
              description: 'Full brand identity package',
              deliverables: JSON.stringify(['Logo design', 'Brand guidelines', 'Business cards', 'Letterhead']),
              revision_count: 5,
              turnaround_days: 14,
              display_order: 2,
              is_popular: true,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Enterprise',
              price: 2499,
              description: 'Comprehensive brand solution',
              deliverables: JSON.stringify(['Complete brand identity', 'Brand guidelines', 'All stationery', 'Digital assets']),
              revision_count: 0,
              turnaround_days: 21,
              display_order: 3,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
          break;

        case 'ui-ux-design':
          packages.push(
            {
              service_id: service.id,
              package_name: 'Wireframes',
              price: 499,
              description: 'User experience planning',
              deliverables: JSON.stringify(['User research', 'Wireframes', 'User flow']),
              revision_count: 2,
              turnaround_days: 7,
              display_order: 1,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'UI Design',
              price: 899,
              description: 'Complete user interface design',
              deliverables: JSON.stringify(['Wireframes', 'High-fidelity UI', 'Interactive prototype']),
              revision_count: 3,
              turnaround_days: 10,
              display_order: 2,
              is_popular: true,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Full UX/UI',
              price: 1499,
              description: 'Complete user experience design',
              deliverables: JSON.stringify(['User research', 'Wireframes', 'UI design', 'Prototype', 'Usability testing']),
              revision_count: 5,
              turnaround_days: 14,
              display_order: 3,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
          break;

        default:
          // Add basic packages for other services
          packages.push(
            {
              service_id: service.id,
              package_name: 'Basic',
              price: Math.floor((service.base_price || 300) * 0.6),
              description: 'Essential service package',
              deliverables: JSON.stringify(['Basic deliverables', '2 revisions']),
              revision_count: 2,
              turnaround_days: Math.floor((service.turnaround_time_days || 5) * 0.7),
              display_order: 1,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Standard',
              price: service.base_price || 300,
              description: 'Standard service package',
              deliverables: JSON.stringify(['Standard deliverables', '3 revisions']),
              revision_count: 3,
              turnaround_days: service.turnaround_time_days || 5,
              display_order: 2,
              is_popular: true,
      
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              service_id: service.id,
              package_name: 'Premium',
              price: Math.floor((service.base_price || 300) * 1.5),
              description: 'Premium service package',
              deliverables: JSON.stringify(['Premium deliverables', 'Unlimited revisions']),
              revision_count: 0,
              turnaround_days: Math.floor((service.turnaround_time_days || 5) * 1.3),
              display_order: 3,
              is_popular: false,
      
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
      }
    });

    await queryInterface.bulkInsert('ServicePackages', packages);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ServicePackages', null, {});
    await queryInterface.bulkDelete('Services', null, {});
  }
};
