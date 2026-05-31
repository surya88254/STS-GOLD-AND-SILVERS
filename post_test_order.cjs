const fs = require('fs');
const http = require('http');
const data = fs.readFileSync('test_order.json');
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/send-order-notification',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('RESPONSE', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('REQERR', e);
  process.exit(1);
});

req.write(data);
req.end();
