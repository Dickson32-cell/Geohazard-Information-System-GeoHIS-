const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'anyetei_portfolio_dev'
    });

    const [rows] = await connection.execute('SELECT id, email, full_name, role FROM Users WHERE email = ?', 
      [process.env.ADMIN_EMAIL || 'sowahjoseph81@gmail.com']);

    if (rows.length === 0) {
      console.log('NO ADMIN USER FOUND!');
    } else {
      console.log('ADMIN USER FOUND:', rows[0]);
    }

    // Also check all users
    const [allUsers] = await connection.execute('SELECT id, email, full_name, role FROM Users');
    console.log('ALL USERS IN DATABASE:', allUsers);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUser();
