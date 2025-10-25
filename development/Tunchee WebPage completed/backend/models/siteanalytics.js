'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SiteAnalytics extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SiteAnalytics.init({
    date: DataTypes.DATE,
    total_visitors: DataTypes.INTEGER,
    unique_visitors: DataTypes.INTEGER,
    page_views: DataTypes.INTEGER,
    bounce_rate: DataTypes.DECIMAL,
    avg_session_duration: DataTypes.INTEGER,
    traffic_source: DataTypes.STRING,
    device_type: DataTypes.STRING,
    top_page: DataTypes.STRING,
    referrer: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SiteAnalytics',
  });
  return SiteAnalytics;
};