require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Booking = require('./models/Booking');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus_space');
    console.log('MongoDB Connected for Seeding');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany();
    await Room.deleteMany();
    await Booking.deleteMany();

    console.log('Existing data cleared.');

    // 1. Create Users (use create() to trigger pre-save hook)
    const usersData = [
      { userId: 'STU001', password: 'password123', role: 'Student', name: 'Alice Student', department: 'BSc-IT', year: 'SY' },
      { userId: 'STU002', password: 'password123', role: 'Student', name: 'Bob Student', department: 'BAF', year: 'FY' },
      { userId: 'FAC001', password: 'password123', role: 'Faculty', name: 'Dr. John Smith' },
      { userId: 'FAC002', password: 'password123', role: 'Faculty', name: 'Prof. Sarah Johnson' },
      { userId: 'ADM001', password: 'password123', role: 'Admin', name: 'Admin User' }
    ];

    const users = [];
    for (const u of usersData) {
      users.push(await User.create(u));
    }

    const fac1 = users.find(u => u.userId === 'FAC001');
    const fac2 = users.find(u => u.userId === 'FAC002');

    console.log('Users inserted.');

    // 2. Create Rooms
    const rooms = await Room.insertMany([
      { roomNumber: '101', floor: 1, type: 'Classroom', capacity: 60 },
      { roomNumber: '102', floor: 1, type: 'Classroom', capacity: 60 },
      { roomNumber: 'Study Room 1', floor: 1, type: 'Study Room', capacity: 10 },
      { roomNumber: '201', floor: 2, type: 'Classroom', capacity: 40 },
      { roomNumber: '202', floor: 2, type: 'Classroom', capacity: 40 },
      { roomNumber: 'Lab 1', floor: 3, type: 'Computer Lab', capacity: 30, labType: 'Standard' },
      { roomNumber: 'Lab 2', floor: 3, type: 'Computer Lab', capacity: 35, labType: 'High Performance' }
    ]);

    console.log('Rooms inserted.');

    // 3. Create Bookings to simulate live dashboard
    const now = new Date();
    
    // Create a time 1 hour in the past to 1 hour in the future (currently occupied)
    const startTimeOccupied = new Date(now.getTime() - 60 * 60 * 1000);
    const endTimeOccupied = new Date(now.getTime() + 60 * 60 * 1000);
    
    await Booking.insertMany([
      {
        room: rooms.find(r => r.roomNumber === '102')._id,
        faculty: fac1._id,
        subject: 'Data Structures',
        department: 'BSc-IT',
        year: 'SY',
        startTime: startTimeOccupied,
        endTime: endTimeOccupied,
        status: 'Occupied',
        isRoutine: true
      },
      {
        room: rooms.find(r => r.roomNumber === '202')._id,
        faculty: fac2._id,
        subject: 'Financial Accounting',
        department: 'BAF',
        year: 'FY',
        startTime: startTimeOccupied,
        endTime: endTimeOccupied,
        status: 'Occupied',
        isRoutine: true
      },
      {
        room: rooms.find(r => r.roomNumber === 'Lab 2')._id,
        faculty: fac1._id,
        subject: 'Web Dev Workshop',
        department: 'BSc-IT',
        year: 'TY',
        startTime: startTimeOccupied,
        endTime: endTimeOccupied,
        status: 'Reserved',
        isRoutine: false
      }
    ]);

    console.log('Bookings inserted.');
    console.log('Database successfully seeded!');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
