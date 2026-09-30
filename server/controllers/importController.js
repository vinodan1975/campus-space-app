const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const ExcelJS = require('exceljs');

// Multer config — store uploaded CSVs in /uploads temporarily
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

/**
 * POST /api/import/rooms
 * CSV columns: roomNumber, floor, type, capacity, labType
 */
const importRooms = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const results = [];
    const errors = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      let inserted = 0;
      let skipped = 0;

      for (const row of results) {
        try {
          const { roomNumber, floor, type, capacity, labType } = row;
          if (!roomNumber || !floor || !type || !capacity) {
            errors.push(`Skipped row: missing required field → ${JSON.stringify(row)}`);
            skipped++;
            continue;
          }
          await Room.findOneAndUpdate(
            { roomNumber: roomNumber.trim() },
            {
              roomNumber: roomNumber.trim(),
              floor: Number(floor),
              type: type.trim(),
              capacity: Number(capacity),
              labType: labType ? labType.trim() : undefined,
            },
            { upsert: true, new: true }
          );
          inserted++;
        } catch (e) {
          errors.push(`Error on row: ${JSON.stringify(row)} → ${e.message}`);
          skipped++;
        }
      }

      fs.unlinkSync(req.file.path); // cleanup temp file
      res.json({ message: `Import complete`, inserted, skipped, errors });
    } catch (e) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: e.message });
    }
  }
];

/**
 * POST /api/import/users
 * CSV columns: userId, password, role, name
 */
const importUsers = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const results = [];
    const errors = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      let inserted = 0;
      let skipped = 0;

      for (const row of results) {
        try {
          const { userId, password, role, name, department, year } = row;
          if (!userId || !password || !role || !name) {
            errors.push(`Skipped row: missing required field → ${JSON.stringify(row)}`);
            skipped++;
            continue;
          }
          // Check if user already exists
          const existing = await User.findOne({ userId: userId.trim() });
          if (existing) {
            errors.push(`Skipped: User ${userId} already exists`);
            skipped++;
            continue;
          }
          // Use create() so the pre-save hook hashes the password
          await User.create({
            userId: userId.trim(),
            password: password.trim(),
            role: role.trim(),
            name: name.trim(),
            department: department ? department.trim() : undefined,
            year: year ? year.trim() : undefined,
          });
          inserted++;
        } catch (e) {
          errors.push(`Error on row: ${JSON.stringify(row)} → ${e.message}`);
          skipped++;
        }
      }

      fs.unlinkSync(req.file.path);
      res.json({ message: `Import complete`, inserted, skipped, errors });
    } catch (e) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: e.message });
    }
  }
];

/**
 * GET /api/import/template/rooms
 * GET /api/import/template/users
 * Returns a CSV template as a downloadable file
 */
const downloadTemplate = (req, res) => {
  const { type } = req.params;
  const templates = {
    rooms: 'roomNumber,floor,type,capacity,labType\n101,1,Classroom,60,\n102,1,Classroom,60,\nLab 1,2,Computer Lab,30,Windows\nSeminar Hall A,3,Seminar Hall,100,',
    users: 'userId,password,role,name,department,year\nSTU100,password123,Student,John Doe,BSc-IT,SY\nFAC100,password123,Faculty,Dr. Jane Smith,,\nADM100,password123,Admin,Admin User,,',
  };
  if (!templates[type]) return res.status(404).json({ message: 'Unknown template type' });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_template.csv"`);
  res.send(templates[type]);
};

/**
 * GET /api/import/export/rooms  — Export all rooms as Excel
 */
const exportRoomsExcel = async (req, res) => {
  try {
    const rooms = await Room.find({});
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rooms');

    sheet.columns = [
      { header: 'Room Number', key: 'roomNumber', width: 15 },
      { header: 'Floor', key: 'floor', width: 10 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Capacity', key: 'capacity', width: 12 },
      { header: 'Lab Type', key: 'labType', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    rooms.forEach(r => sheet.addRow({ roomNumber: r.roomNumber, floor: r.floor, type: r.type, capacity: r.capacity, labType: r.labType || '' }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="rooms_export.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { importRooms, importUsers, downloadTemplate, exportRoomsExcel };
