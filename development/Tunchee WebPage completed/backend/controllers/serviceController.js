const { Service, ServicePackage } = require('../models');

// Get all services with packages
const getServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      include: [{
        model: ServicePackage,
        as: 'packages',
        where: { is_active: true },
        required: false,
        order: [['display_order', 'ASC']]
      }],
      order: [['display_order', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        services
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch services'
    });
  }
};

// Get single service with packages
const getService = async (req, res) => {
  try {
    const { slug } = req.params;

    const service = await Service.findOne({
      where: {
        slug,
        is_active: true
      },
      include: [{
        model: ServicePackage,
        as: 'packages',
        where: { is_active: true },
        required: false,
        order: [['display_order', 'ASC']]
      }]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch service'
    });
  }
};

// Create service (Admin only)
const createService = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      icon_url,
      turnaround_time_days,
      base_price,
      display_order,
      is_featured,
      packages
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name and description are required'
      });
    }

    // Create service
    const service = await Service.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      icon_url,
      turnaround_time_days,
      base_price,
      display_order: display_order || 0,
      is_featured: is_featured || false,
      is_active: true
    });

    // Create packages if provided
    if (packages && packages.length > 0) {
      const packagesData = packages.map(pkg => ({
        ...pkg,
        service_id: service.id,
        is_active: true
      }));

      await ServicePackage.bulkCreate(packagesData);
    }

    // Fetch complete service with packages
    const completeService = await Service.findByPk(service.id, {
      include: [{
        model: ServicePackage,
        as: 'packages',
        order: [['display_order', 'ASC']]
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        service: completeService
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create service'
    });
  }
};

// Update service (Admin only)
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Service not found'
      });
    }

    await service.update(updateData);

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update service'
    });
  }
};

// Delete service (Admin only)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Service not found'
      });
    }

    // Soft delete by setting is_active to false
    await service.update({ is_active: false });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete service'
    });
  }
};

// Get service packages (Admin only)
const getServicePackages = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const packages = await ServicePackage.findAll({
      where: {
        service_id: serviceId,
        is_active: true
      },
      order: [['display_order', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        packages
      }
    });

  } catch (error) {
    console.error('Get service packages error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch service packages'
    });
  }
};

// Create service package (Admin only)
const createServicePackage = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const packageData = req.body;

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Service not found'
      });
    }

    const newPackage = await ServicePackage.create({
      ...packageData,
      service_id: serviceId,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Service package created successfully',
      data: {
        package: newPackage
      }
    });

  } catch (error) {
    console.error('Create service package error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create service package'
    });
  }
};

// Update service package (Admin only)
const updateServicePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const updateData = req.body;

    const package = await ServicePackage.findByPk(packageId);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Service package not found'
      });
    }

    await package.update(updateData);

    res.json({
      success: true,
      message: 'Service package updated successfully',
      data: {
        package
      }
    });

  } catch (error) {
    console.error('Update service package error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update service package'
    });
  }
};

// Delete service package (Admin only)
const deleteServicePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const package = await ServicePackage.findByPk(packageId);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Service package not found'
      });
    }

    await package.update({ is_active: false });

    res.json({
      success: true,
      message: 'Service package deleted successfully'
    });

  } catch (error) {
    console.error('Delete service package error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete service package'
    });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage
};