'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServicePackage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ServicePackage.init({
    service_id: DataTypes.INTEGER,
    package_name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    description: DataTypes.TEXT,
    deliverables: DataTypes.TEXT,
    revision_count: DataTypes.INTEGER,
    turnaround_days: DataTypes.INTEGER,
    display_order: DataTypes.INTEGER,
    is_popular: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ServicePackage',
  });
  return ServicePackage;
};