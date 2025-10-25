'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Testimonial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Testimonial.init({
    client_name: DataTypes.STRING,
    client_company: DataTypes.STRING,
    client_title: DataTypes.STRING,
    client_photo_url: DataTypes.STRING,
    testimonial_text: DataTypes.TEXT,
    rating: DataTypes.INTEGER,
    project_type: DataTypes.STRING,
    client_website: DataTypes.STRING,
    is_featured: DataTypes.BOOLEAN,
    is_published: DataTypes.BOOLEAN,
    is_approved: DataTypes.BOOLEAN,
    display_order: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Testimonial',
  });
  return Testimonial;
};