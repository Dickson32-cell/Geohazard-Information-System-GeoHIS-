const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');
require('dotenv').config();

async function testLogin() {
  try {
    console.log('Testing Admin Login Flow...\n');

    // 1. Check if user exists
    const email = process.env.ADMIN_EMAIL || 'sowahjoseph81@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    console.log(`Looking for user with email: ${email}`);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ User not found in database!');
      return;
    }

    console.log('✓ User found:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    });

    // 2. Test password comparison
    console.log(`\nTesting password comparison...`);
    console.log(`Input password: ${password}`);
    console.log(`Stored hash: ${user.password_hash.substring(0, 20)}...`);

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Password does not match!');
      return;
    }

    console.log('✓ Password matches!');

    // 3. Test token generation
    console.log(`\nGenerating JWT tokens...`);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '1h'
    });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });

    console.log('✓ Token generated:', token.substring(0, 30) + '...');
    console.log('✓ Refresh token generated:', refreshToken.substring(0, 30) + '...');

    // 4. Verify token
    console.log(`\nVerifying JWT token...`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✓ Token verified:', decoded);

    console.log('\n✓✓✓ LOGIN FLOW SUCCESSFUL ✓✓✓');
    console.log('\nExpected response to frontend:');
    console.log(JSON.stringify({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token,
        refresh_token: refreshToken,
        expires_in: 3600
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testLogin();
