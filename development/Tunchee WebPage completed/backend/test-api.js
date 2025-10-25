const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/v1/gallery',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log('Response:', chunk.toString());
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.error('Error code:', e.code);
  console.error('Error errno:', e.errno);
});

req.end();