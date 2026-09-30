const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Student', 'Faculty', 'Admin'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String, // e.g. 'BSc-IT', 'BAF', 'BMS'
    trim: true,
  },
  year: {
    type: String, // 'FY', 'SY', 'TY'
    enum: ['FY', 'SY', 'TY', null],
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
