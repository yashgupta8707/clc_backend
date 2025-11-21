// routes/students.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Student = require("../models/Student");

// ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for photo + signature
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

// Validation middleware (match frontend field names)
const validateStudent = [
  body("studentName").notEmpty().trim().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone").isMobilePhone().withMessage("Valid phone number is required"),
  body("course").notEmpty().withMessage("Course is required"),
];

// Helper: generate registration number like CCM2025xxxxx
const generateRegistrationNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  return `CCM${year}${now.getTime().toString().slice(-5)}`;
};

// Register new student
router.post(
  "/register",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  validateStudent,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const files = req.files || {};
      const photoFile = files.photo && files.photo[0];
      const signatureFile = files.signature && files.signature[0];

      const photoPath = photoFile ? `/uploads/${photoFile.filename}` : null;
      const signaturePath = signatureFile
        ? `/uploads/${signatureFile.filename}`
        : null;

      const registrationNo = generateRegistrationNo();

      // Build student data from body
      const body = req.body;

      const studentData = {
        ...body,
        fullName: body.studentName,
        registrationNo,
        documents: {
          photo: photoPath,
          signature: signaturePath,
        },
      };

      const student = new Student(studentData);
      await student.save();

      res.status(201).json({
        success: true,
        message: "Registration successful! We will contact you soon.",
        data: student,
      });
    } catch (error) {
      console.error("Student registration error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
    }
  }
);

// Get all students (admin)
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
});

// Get student by ID (for details / print page)
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student",
      error: error.message,
    });
  }
});

// Update student status (admin)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
});

module.exports = router;
