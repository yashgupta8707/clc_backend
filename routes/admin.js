// routes/admin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

// Hardcoded admin credentials (change these!)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // Change this password!
  email: 'admin@citycollegeofmanagement.com'
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check credentials
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        username: ADMIN_CREDENTIALS.username,
        email: ADMIN_CREDENTIALS.email,
        role: 'admin' 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        username: ADMIN_CREDENTIALS.username,
        email: ADMIN_CREDENTIALS.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Verify Token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: {
        username: req.admin.username,
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message
    });
  }
});

// Get Dashboard Stats
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const pendingStudents = await Student.countDocuments({ status: 'Pending' });
    const approvedStudents = await Student.countDocuments({ status: 'Approved' });
    const rejectedStudents = await Student.countDocuments({ status: 'Rejected' });
    
    const totalMessages = await Contact.countDocuments();
    const newMessages = await Contact.countDocuments({ status: 'New' });
    const inProgressMessages = await Contact.countDocuments({ status: 'In Progress' });
    const resolvedMessages = await Contact.countDocuments({ status: 'Resolved' });

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await Student.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        students: {
          total: totalStudents,
          pending: pendingStudents,
          approved: approvedStudents,
          rejected: rejectedStudents,
          recent: recentRegistrations
        },
        messages: {
          total: totalMessages,
          new: newMessages,
          inProgress: inProgressMessages,
          resolved: resolvedMessages
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// Get All Students (with filters and pagination)
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      course, 
      search 
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by course
    if (course && course !== 'all') {
      query.course = course;
    }

    // Search by name, email, or registration number
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNo: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Student.countDocuments(query);

    res.json({
      success: true,
      students,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalStudents: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Get Single Student Details
router.get('/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student details',
      error: error.message
    });
  }
});

// Update Student Status
router.patch('/students/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student status updated successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating student status',
      error: error.message
    });
  }
});

// Delete Student
router.delete('/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

// Get All Contact Messages (with filters and pagination)
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search 
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by name, email, or subject
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Contact.countDocuments(query);

    res.json({
      success: true,
      messages,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalMessages: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

// Get Single Message Details
router.get('/messages/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching message details',
      error: error.message
    });
  }
});

// Update Message Status
router.patch('/messages/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['New', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message status updated successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating message status',
      error: error.message
    });
  }
});

// Delete Message
router.delete('/messages/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
});

module.exports = router;