'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProjectImage.belongsTo(models.Project, { foreignKey: 'project_id', as: 'project' });
    }
  }
  ProjectImage.init({
    project_id: DataTypes.INTEGER,
    image_url: DataTypes.STRING,
    image_alt_text: DataTypes.STRING,
    image_title: DataTypes.STRING,
    image_description: DataTypes.TEXT,
    display_order: DataTypes.INTEGER,
    is_before_after: DataTypes.BOOLEAN,
    before_after_pair_id: DataTypes.INTEGER,
    file_size: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProjectImage',
  });
  return ProjectImage;
};