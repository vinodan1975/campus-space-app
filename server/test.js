const http = require('http');

const BASE = 'http://localhost:5000/api';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

async function runTests() {
  const results = [];
  let studentToken, facultyToken, facUserId, roomId, bookingId;

  console.log('\n========== CAMPUS SPACE API TESTS ==========\n');

  // ── 1. Student Login ────────────────────────────────────────────────
  try {
    const r = await request('POST', '/auth/login', { userId: 'STU001', password: 'password123' });
    studentToken = r.data.token;
    const ok = r.status === 200 && r.data.role === 'Student' && r.data.token;
    console.log(`${ok ? PASS : FAIL} [1] Student Login (STU001)  →  role: ${r.data.role}`);
    results.push({ name: 'Student Login', ok });
  } catch (e) {
    console.log(`${FAIL} [1] Student Login → ${e.message}`);
    results.push({ name: 'Student Login', ok: false });
  }

  // ── 2. Faculty Login ────────────────────────────────────────────────
  try {
    const r = await request('POST', '/auth/login', { userId: 'FAC001', password: 'password123' });
    facultyToken = r.data.token;
    facUserId = r.data._id;
    const ok = r.status === 200 && r.data.role === 'Faculty' && r.data.token;
    console.log(`${ok ? PASS : FAIL} [2] Faculty Login (FAC001)  →  role: ${r.data.role}, name: ${r.data.name}`);
    results.push({ name: 'Faculty Login', ok });
  } catch (e) {
    console.log(`${FAIL} [2] Faculty Login → ${e.message}`);
    results.push({ name: 'Faculty Login', ok: false });
  }

  // ── 3. Admin Login ──────────────────────────────────────────────────
  try {
    const r = await request('POST', '/auth/login', { userId: 'ADM001', password: 'password123' });
    const ok = r.status === 200 && r.data.role === 'Admin';
    console.log(`${ok ? PASS : FAIL} [3] Admin Login  (ADM001)   →  role: ${r.data.role}`);
    results.push({ name: 'Admin Login', ok });
  } catch (e) {
    console.log(`${FAIL} [3] Admin Login → ${e.message}`);
    results.push({ name: 'Admin Login', ok: false });
  }

  // ── 4. Wrong Password ───────────────────────────────────────────────
  try {
    const r = await request('POST', '/auth/login', { userId: 'FAC001', password: 'wrongpass' });
    // Should fail with 401
    const ok = r.status === 401;
    console.log(`${ok ? PASS : FAIL} [4] Wrong Password → status: ${r.status}`);
    results.push({ name: 'Wrong Password Rejected', ok });
  } catch (e) {
    console.log(`${FAIL} [4] Wrong Password → ${e.message}`);
    results.push({ name: 'Wrong Password Rejected', ok: false });
  }

  // ── 5. Get All Rooms (Live Dashboard) ──────────────────────────────
  try {
    const r = await request('GET', '/rooms');
    const ok = r.status === 200 && Array.isArray(r.data) && r.data.length > 0;
    if (ok) {
      roomId = r.data.find(rm => rm.status === 'Available')?._id;
      console.log(`${PASS} [5] Get Rooms → ${r.data.length} rooms returned`);
      r.data.forEach(rm => {
        const icon = rm.status === 'Available' ? '🟢' : rm.status === 'Occupied' ? '🔴' : '🟡';
        console.log(`       ${icon} ${rm.roomNumber} (Floor ${rm.floor}) → ${rm.status}${rm.faculty ? ' | '+rm.faculty+' | '+rm.subject : ''}`);
      });
    } else {
      console.log(`${FAIL} [5] Get Rooms → status: ${r.status}`);
    }
    results.push({ name: 'Get Rooms Dashboard', ok });
  } catch (e) {
    console.log(`${FAIL} [5] Get Rooms → ${e.message}`);
    results.push({ name: 'Get Rooms Dashboard', ok: false });
  }

  // ── 6. Search Rooms by Floor ─────────────────────────────────────
  try {
    const r = await request('GET', '/rooms/search?floor=1');
    const ok = r.status === 200 && Array.isArray(r.data) && r.data.every(rm => rm.floor === 1);
    console.log(`${ok ? PASS : FAIL} [6] Search by Floor 1 → ${r.data.length} rooms`);
    results.push({ name: 'Search by Floor', ok });
  } catch (e) {
    console.log(`${FAIL} [6] Search by Floor → ${e.message}`);
    results.push({ name: 'Search by Floor', ok: false });
  }

  // ── 7. Search by Type ─────────────────────────────────────────────
  try {
    const r = await request('GET', '/rooms/search?type=Computer Lab');
    const ok = r.status === 200 && Array.isArray(r.data) && r.data.length > 0;
    console.log(`${ok ? PASS : FAIL} [7] Search by Type "Computer Lab" → ${r.data.length} labs`);
    results.push({ name: 'Search by Type', ok });
  } catch (e) {
    console.log(`${FAIL} [7] Search by Type → ${e.message}`);
    results.push({ name: 'Search by Type', ok: false });
  }

  // ── 8. Search by Capacity ─────────────────────────────────────────
  try {
    const r = await request('GET', '/rooms/search?capacity=30');
    const ok = r.status === 200 && Array.isArray(r.data) && r.data.every(rm => rm.capacity >= 30);
    console.log(`${ok ? PASS : FAIL} [8] Search Capacity ≥ 30 → ${r.data.length} rooms`);
    results.push({ name: 'Search by Capacity', ok });
  } catch (e) {
    console.log(`${FAIL} [8] Search by Capacity → ${e.message}`);
    results.push({ name: 'Search by Capacity', ok: false });
  }

  // ── 9. Faculty Create Booking ──────────────────────────────────────
  if (roomId && facUserId) {
    try {
      const start = new Date(); start.setHours(start.getHours() + 1);
      const end = new Date();   end.setHours(end.getHours() + 2);
      const r = await request('POST', '/bookings', {
        room: roomId,
        subject: 'Test Extra Lecture',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'Reserved',
        faculty: facUserId,
      });
      bookingId = r.data._id;
      const ok = r.status === 201 && r.data._id;
      console.log(`${ok ? PASS : FAIL} [9] Create Booking → ID: ${bookingId}`);
      results.push({ name: 'Faculty Create Booking', ok });
    } catch (e) {
      console.log(`${FAIL} [9] Create Booking → ${e.message}`);
      results.push({ name: 'Faculty Create Booking', ok: false });
    }
  } else {
    console.log(`⚠️  [9] Skipped - no available room found`);
    results.push({ name: 'Faculty Create Booking', ok: false });
  }

  // ── 10. Verify Room Status Updated ────────────────────────────────
  if (roomId) {
    try {
      const r = await request('GET', '/rooms');
      const bookedRoom = r.data.find(rm => rm._id === roomId);
      const ok = bookedRoom && bookedRoom.status !== 'Available';
      console.log(`${ok ? PASS : FAIL} [10] Room Status After Booking → ${bookedRoom?.status} | Faculty: ${bookedRoom?.faculty}`);
      results.push({ name: 'Room Status Updates', ok });
    } catch (e) {
      console.log(`${FAIL} [10] Room Status → ${e.message}`);
      results.push({ name: 'Room Status Updates', ok: false });
    }
  }

  // ── 11. Cancel Booking ────────────────────────────────────────────
  if (bookingId) {
    try {
      const r = await request('DELETE', `/bookings/${bookingId}`);
      const ok = r.status === 200 && r.data.message;
      console.log(`${ok ? PASS : FAIL} [11] Cancel Booking → ${r.data.message}`);
      results.push({ name: 'Cancel Booking', ok });
    } catch (e) {
      console.log(`${FAIL} [11] Cancel Booking → ${e.message}`);
      results.push({ name: 'Cancel Booking', ok: false });
    }
  }

  // ── 12. Room Available After Cancel ─────────────────────────────
  if (roomId) {
    try {
      await new Promise(r => setTimeout(r, 500));
      const r = await request('GET', '/rooms');
      const room = r.data.find(rm => rm._id === roomId);
      const ok = room && room.status === 'Available';
      console.log(`${ok ? PASS : FAIL} [12] Room Available After Cancel → ${room?.status}`);
      results.push({ name: 'Room Available After Cancel', ok });
    } catch (e) {
      console.log(`${FAIL} [12] Room After Cancel → ${e.message}`);
      results.push({ name: 'Room Available After Cancel', ok: false });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`\n========== RESULTS: ${passed}/${total} PASSED ==========`);
  results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}`));
  console.log('');
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(e => { console.error(e); process.exit(1); });
