const http = require('http');

const postData = JSON.stringify({
  email: 'sowahjoseph81@gmail.com',
  password: 'Admin123!'
});

console.log('Attempting to call login endpoint...\n');
console.log('POST /api/v1/auth/login');
console.log('Body:', postData);

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('\n--- RESPONSE ---');
  console.log(`STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('BODY:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('BODY:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Connection error:', e.message);
  if (e.code === 'ECONNREFUSED') {
    console.error('Unable to connect to http://localhost:5002');
    console.error('Make sure backend is running with: npm start');
  }
});

req.write(postData);
req.end();

// Don't exit immediately
setTimeout(() => {
  console.log('\n(Test will exit after 3 seconds)');
}, 3000);
