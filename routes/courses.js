const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get all active courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Get course by code
router.get('/:code', async (req, res) => {
  try {
    const course = await Course.findOne({ code: req.params.code, isActive: true });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// Seed courses (run once to populate database)
router.post('/seed', async (req, res) => {
  try {
    const courses = [
      {
        name: 'Bachelor of Business Administration',
        code: 'BBA',
        duration: '3 Years',
        eligibility: '10+2 in any Stream',
        description: 'Comprehensive program covering business management, finance, marketing, and entrepreneurship.',
        fees: 45000,
        seats: 60,
        category: 'Undergraduate',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800'
      },
      {
        name: 'Bachelor of Computer Applications',
        code: 'BCA',
        duration: '3 Years',
        eligibility: '10+2 in any Stream',
        description: 'Focus on computer programming, software development, and IT fundamentals.',
        fees: 42000,
        seats: 60,
        category: 'Undergraduate',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'
      },
      {
        name: 'Bachelor of Commerce',
        code: 'BCom',
        duration: '3 Years',
        eligibility: '10+2 in any Stream',
        description: 'Covers accounting, taxation, business law, and commerce fundamentals.',
        fees: 38000,
        seats: 100,
        category: 'Undergraduate',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
      },
      {
        name: 'Bachelor of Science (Agriculture)',
        code: 'BSc(AG)',
        duration: '4 Years',
        eligibility: '10+2 Passed 50% with Bio & Agriculture',
        description: 'Agricultural science, crop management, and modern farming techniques.',
        fees: 50000,
        seats: 40,
        category: 'Undergraduate',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800'
      },
      {
        name: 'Bachelor of Education',
        code: 'BEd',
        duration: '2 Years',
        eligibility: 'Graduation in any Stream',
        description: 'Teacher training program focused on pedagogy and educational psychology.',
        fees: 55000,
        seats: 100,
        category: 'Postgraduate',
        image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800'
      },
      {
        name: 'Master of Education',
        code: 'MEd',
        duration: '2 Years',
        eligibility: 'Graduation in any Stream',
        description: 'Advanced education program for experienced teachers and educators.',
        fees: 60000,
        seats: 50,
        category: 'Postgraduate',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
      },
      {
        name: 'Diploma in Elementary Education',
        code: 'DElEd',
        duration: '2 Years',
        eligibility: 'Graduation in any Stream',
        description: 'Primary teacher training program (formerly known as B.T.C.).',
        fees: 41000,
        seats: 100,
        category: 'Undergraduate',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'
      }
    ];

    await Course.deleteMany({}); // Clear existing courses
    await Course.insertMany(courses);

    res.json({
      success: true,
      message: 'Courses seeded successfully',
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error seeding courses',
      error: error.message
    });
  }
});

module.exports = router;