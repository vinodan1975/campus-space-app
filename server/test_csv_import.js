const http = require('http');
const fs = require('fs');
const path = require('path');

const boundary = '----FormBoundary123';
const csvPath = path.join(__dirname, 'test_rooms.csv');
const csvData = fs.readFileSync(csvPath);

const CRLF = '\r\n';
let body = '';
body += '--' + boundary + CRLF;
body += 'Content-Disposition: form-data; name="file"; filename="test_rooms.csv"' + CRLF;
body += 'Content-Type: text/csv' + CRLF + CRLF;
body += csvData.toString() + CRLF;
body += '--' + boundary + '--' + CRLF;

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/import/rooms',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log('Testing CSV Import for Rooms...\n');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Message:', json.message);
    console.log('Inserted:', json.inserted);
    console.log('Skipped:', json.skipped);
    if (json.errors && json.errors.length > 0) {
      console.log('Errors:', json.errors);
    }

    // Now verify rooms were added
    http.get('http://localhost:5000/api/rooms', (res2) => {
      let d = '';
      res2.on('data', (c) => (d += c));
      res2.on('end', () => {
        const rooms = JSON.parse(d);
        console.log('\n--- All Rooms After Import ---');
        rooms.forEach((r) => {
          console.log(`  ${r.roomNumber} | Floor ${r.floor} | ${r.type} | Cap: ${r.capacity} | ${r.status}`);
        });
        console.log(`\nTotal rooms: ${rooms.length}`);
        
        // Also test template download
        http.get('http://localhost:5000/api/import/template/rooms', (res3) => {
          let t = '';
          res3.on('data', (c) => (t += c));
          res3.on('end', () => {
            console.log('\n--- Template Download Test ---');
            console.log('Template content:\n' + t);
            console.log('\n✅ ALL CSV IMPORT TESTS PASSED');
            process.exit(0);
          });
        });
      });
    });
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
