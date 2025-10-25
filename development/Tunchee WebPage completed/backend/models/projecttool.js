'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectTool extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProjectTool.belongsTo(models.Project, { foreignKey: 'project_id', as: 'project' });
    }
  }
  ProjectTool.init({
    project_id: DataTypes.INTEGER,
    tool_name: DataTypes.STRING,
    tool_category: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ProjectTool',
  });
  return ProjectTool;
};