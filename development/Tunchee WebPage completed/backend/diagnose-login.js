#!/usr/bin/env node

/**
 * Login Diagnostic Script
 * This script verifies that the admin login system is working correctly
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function diagnoseLogin() {
  log('\n====== ADMIN LOGIN DIAGNOSTIC SYSTEM ======\n', 'blue');

  try {
    // Step 1: Check environment variables
    log('Step 1: Checking environment variables...', 'yellow');
    const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        log(`  ✗ ${envVar} is not set`, 'red');
        return;
      }
      const masked = envVar.includes('PASSWORD') || envVar.includes('SECRET') 
        ? `***${value.substring(value.length - 4)}` 
        : value;
      log(`  ✓ ${envVar}: ${masked}`, 'green');
    }

    // Step 2: Connect to database
    log('\nStep 2: Connecting to database...', 'yellow');
    const { User, sequelize } = require('./models');
    
    try {
      await sequelize.authenticate();
      log('  ✓ Database connection successful', 'green');
    } catch (error) {
      log(`  ✗ Database connection failed: ${error.message}`, 'red');
      return;
    }

    // Step 3: Check if admin user exists
    log('\nStep 3: Checking for admin user in database...', 'yellow');
    const adminEmail = process.env.ADMIN_EMAIL;
    const user = await User.findOne({ where: { email: adminEmail } });

    if (!user) {
      log(`  ✗ Admin user (${adminEmail}) not found in database`, 'red');
      log('  Tip: Run "npx sequelize-cli db:seed --seed 20251022072051-admin-user.js" to create the user', 'yellow');
      return;
    }

    log(`  ✓ Admin user found:`, 'green');
    log(`    - ID: ${user.id}`);
    log(`    - Email: ${user.email}`);
    log(`    - Full Name: ${user.full_name}`);
    log(`    - Role: ${user.role}`);
    log(`    - Password Hash: ${user.password_hash.substring(0, 20)}...`);

    // Step 4: Test password hash
    log('\nStep 4: Testing password hash...', 'yellow');
    const testPassword = process.env.ADMIN_PASSWORD;
    const isPasswordValid = await bcrypt.compare(testPassword, user.password_hash);

    if (!isPasswordValid) {
      log(`  ✗ Password hash does not match!`, 'red');
      log(`  Input password: ${testPassword}`, 'yellow');
      log(`  Tip: The password may have been changed. Reset it with:`, 'yellow');
      log(`    const bcrypt = require('bcryptjs');`, 'yellow');
      log(`    const hash = bcrypt.hashSync('Admin123!', 10);`, 'yellow');
      log(`    // Then update the user's password_hash in the database`, 'yellow');
      return;
    }

    log('  ✓ Password hash verification successful', 'green');

    // Step 5: Test JWT token generation
    log('\nStep 5: Testing JWT token generation...', 'yellow');
    try {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h'
      });
      log('  ✓ JWT token generated successfully', 'green');
      log(`    Token (first 40 chars): ${token.substring(0, 40)}...`);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      log('  ✓ JWT token verified successfully', 'green');
      log(`    Decoded user ID: ${decoded.id}`);
    } catch (error) {
      log(`  ✗ JWT token error: ${error.message}`, 'red');
      return;
    }

    // Step 6: Check backend server
    log('\nStep 6: Checking backend server...', 'yellow');
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5002,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const checkServer = () => {
      return new Promise((resolve) => {
        const req = http.request(options, (res) => {
          resolve(res.statusCode === 200);
        });

        req.on('error', () => {
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        req.end();
      });
    };

    const serverHealthy = await checkServer();
    if (!serverHealthy) {
      log(`  ✗ Backend server not responding on port ${process.env.PORT || 5002}`, 'red');
      log(`  Tip: Start the backend with: npm start`, 'yellow');
      return;
    }

    log(`  ✓ Backend server is running on port ${process.env.PORT || 5002}`, 'green');

    // All tests passed
    log('\n====== DIAGNOSIS COMPLETE ======', 'blue');
    log('\n✓ All systems operational! Admin login should work.', 'green');
    log('\nTry logging in with:', 'yellow');
    log(`  Email: ${adminEmail}`, 'yellow');
    log(`  Password: ${testPassword}`, 'yellow');

    process.exit(0);

  } catch (error) {
    log(`\n✗ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run diagnostic
diagnoseLogin();
