'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Project.belongsTo(models.ProjectCategory, { foreignKey: 'category_id', as: 'category' });
      Project.hasMany(models.ProjectImage, { foreignKey: 'project_id', as: 'images' });
      Project.hasMany(models.ProjectTool, { foreignKey: 'project_id', as: 'tools' });
    }
  }
  Project.init({
    title: DataTypes.STRING,
    slug: DataTypes.STRING,
    description: DataTypes.TEXT,
    category_id: DataTypes.INTEGER,
    client_name: DataTypes.STRING,
    client_industry: DataTypes.STRING,
    completion_date: DataTypes.DATE,
    featured_image_url: DataTypes.STRING,
    view_count: DataTypes.INTEGER,
    is_featured: DataTypes.BOOLEAN,
    is_published: DataTypes.BOOLEAN,
    status: DataTypes.STRING,
    seo_title: DataTypes.STRING,
    seo_description: DataTypes.STRING,
    seo_keywords: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};