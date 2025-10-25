require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'anyetei_portfolio_dev'}\``);
    console.log('Database created successfully');
  } catch (error) {
    console.error('Error creating database:', error);
  } finally {
    await connection.end();
  }
}

createDatabase();