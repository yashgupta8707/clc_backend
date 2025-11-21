const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  duration: {
    type: String,
    required: true
  },
  eligibility: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fees: {
    type: Number,
    required: true
  },
  seats: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['Undergraduate', 'Postgraduate'],
    required: true
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);