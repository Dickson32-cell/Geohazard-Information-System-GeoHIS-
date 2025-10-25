'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Service.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    description: DataTypes.TEXT,
    icon_url: DataTypes.STRING,
    turnaround_time_days: DataTypes.INTEGER,
    base_price: DataTypes.DECIMAL,
    display_order: DataTypes.INTEGER,
    is_featured: DataTypes.BOOLEAN,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};