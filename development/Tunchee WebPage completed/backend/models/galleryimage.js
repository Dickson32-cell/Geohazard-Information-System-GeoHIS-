'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GalleryImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GalleryImage.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    }
  }
  GalleryImage.init({
    image_url: DataTypes.STRING,
    image_alt_text: DataTypes.STRING,
    image_title: DataTypes.STRING,
    image_description: DataTypes.TEXT,
    display_order: DataTypes.INTEGER,
    is_featured: DataTypes.BOOLEAN,
    file_size: DataTypes.INTEGER,
    file_name: DataTypes.STRING,
    mime_type: DataTypes.STRING,
    uploaded_by: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'GalleryImage',
  });
  return GalleryImage;
};