import http from 'http';
import fs from 'fs';

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
let body = Buffer.from('');

function append(str) {
  body = Buffer.concat([body, Buffer.from(str)]);
}

append('--' + boundary + '\r\n');
append('Content-Disposition: form-data; name=\"name\"\r\n\r\n');
append('Test Product Large\r\n');

append('--' + boundary + '\r\n');
append('Content-Disposition: form-data; name=\"description\"\r\n\r\n');
append('Test desc\r\n');

append('--' + boundary + '\r\n');
append('Content-Disposition: form-data; name=\"category\"\r\n\r\n');
append('skin\r\n');

append('--' + boundary + '\r\n');
append('Content-Disposition: form-data; name=\"variants\"\r\n\r\n');
append('[{\"volume\":\"200ml\",\"price\":500,\"stock\":10}]\r\n');

append('--' + boundary + '\r\n');
append('Content-Disposition: form-data; name=\"imagepath\"; filename=\"dummy_test.jpg\"\r\n');
append('Content-Type: image/jpeg\r\n\r\n');

const imgData = Buffer.from('fake image data 123');
body = Buffer.concat([body, imgData]);
append('\r\n--' + boundary + '--\r\n');

const req = http.request({
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/product/add',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data.substring(0, 500)));
});
req.on('error', e => console.error('Error:', e));
req.write(body);
req.end();
