'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BlogPost extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BlogPost.init({
    title: DataTypes.STRING,
    slug: DataTypes.STRING,
    content: DataTypes.TEXT,
    featured_image_url: DataTypes.STRING,
    excerpt: DataTypes.TEXT,
    author_id: DataTypes.INTEGER,
    category: DataTypes.STRING,
    reading_time_minutes: DataTypes.INTEGER,
    view_count: DataTypes.INTEGER,
    is_published: DataTypes.BOOLEAN,
    is_featured: DataTypes.BOOLEAN,
    published_at: DataTypes.DATE,
    scheduled_for: DataTypes.DATE,
    seo_title: DataTypes.STRING,
    seo_description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BlogPost',
  });
  return BlogPost;
};