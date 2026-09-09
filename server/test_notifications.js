/**
 * Notification Integration Test
 * Simulates: Student tab open (socket listener) + Faculty creates booking via API
 * Verifies: Student receives room_booked event in real-time
 */
const { io: ioClient } = require('socket.io-client');
const http = require('http');

const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function apiPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(API + path);
    const req = http.request({
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    http.get({ hostname: url.hostname, port: url.port, path: url.pathname + url.search }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });
}

function apiDelete(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'DELETE' }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testNotifications() {
  console.log('\n========== NOTIFICATION TEST ==========\n');

  // Step 1: Login as Faculty to get IDs
  console.log('Step 1: Faculty logs in...');
  const fac = await apiPost('/auth/login', { userId: 'FAC001', password: 'password123' });
  console.log(`  → Faculty: ${fac.name} (${fac._id})`);

  // Step 2: Get an available room
  console.log('Step 2: Finding an available room...');
  const rooms = await apiGet('/rooms');
  const availableRoom = rooms.find(r => r.status === 'Available');
  if (!availableRoom) {
    console.log('  ❌ No available rooms found! Run node seed.js first.');
    process.exit(1);
  }
  console.log(`  → Room ${availableRoom.roomNumber} is Available`);

  // Step 3: Connect student socket (simulates student's browser tab)
  console.log('\nStep 3: Student browser tab connects to socket...');
  const studentSocket = ioClient(SOCKET_URL, { transports: ['websocket'] });

  await new Promise((resolve) => studentSocket.on('connect', () => {
    console.log(`  → Student socket connected (id: ${studentSocket.id})`);
    resolve();
  }));

  // Step 4: Set up notification listener BEFORE booking
  let notificationReceived = false;
  let notificationData = null;

  studentSocket.on('room_booked', (data) => {
    notificationReceived = true;
    notificationData = data;
    console.log('\n  🔔 STUDENT RECEIVED NOTIFICATION:');
    console.log(`     Room: ${data.roomNumber}`);
    console.log(`     Faculty: ${data.faculty}`);
    console.log(`     Subject: ${data.subject}`);
    console.log(`     Status: ${data.status}`);
  });

  // Step 5: Faculty books room (simulate 2 seconds later)
  console.log('\nStep 4: Waiting 1 second then faculty books a room...');
  await new Promise(r => setTimeout(r, 1000));

  const start = new Date(); start.setHours(start.getHours() + 1);
  const end = new Date();   end.setHours(end.getHours() + 2);

  console.log(`  → Faculty booking Room ${availableRoom.roomNumber} for "Notification Test Lecture"...`);
  const booking = await apiPost('/bookings', {
    room: availableRoom._id,
    subject: 'Notification Test Lecture',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: 'Reserved',
    faculty: fac._id,
  });
  console.log(`  → Booking created (ID: ${booking._id})`);

  // Step 6: Wait for notification to arrive
  console.log('\nStep 5: Waiting for notification to arrive on student socket...');
  await new Promise(r => setTimeout(r, 2000));

  // Step 7: Verify
  console.log('\n========== RESULT ==========');
  if (notificationReceived) {
    console.log('✅ PASS - Student notification received!');
    console.log(`   Room: ${notificationData.roomNumber} | Faculty: ${notificationData.faculty} | Subject: ${notificationData.subject}`);
  } else {
    console.log('❌ FAIL - Student did NOT receive notification');
  }

  // Cleanup
  await apiDelete(`/bookings/${booking._id}`);
  console.log('\n(Booking cleaned up)');
  studentSocket.disconnect();
  process.exit(notificationReceived ? 0 : 1);
}

testNotifications().catch(e => { console.error(e); process.exit(1); });
