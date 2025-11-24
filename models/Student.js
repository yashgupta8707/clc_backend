// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // Basic / system
    registrationNo: {
      type: String,
    },

    // Personal details (match frontend)
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      // keep for compatibility, mirror studentName
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
    },
    motherName: {
      type: String,
    },
    nationality: {
      type: String,
      default: "Indian",
    },
    category: {
      type: String,
    },
    subCategory: {
      type: String,
    },

    adhaarNo: {
      type: String,
      required: true,
      unique: true,
    },

    fatherContact: {
      type: String,
      required: true,
    },

    // Address
    address: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    district: {
      type: String,
    },
    city: {
      type: String,
    },
    pincode: {
      type: String,
      required: true,
    },

    // Course
    course: {
      type: String,
      required: true,
      enum: ["BBA", "BCA", "BCom", "BSc(AG)", "BEd", "MEd", "DElEd"],
    },

    // Old simple fields kept optional (in case)
    qualification: String,
    percentage: Number,

    // Detailed educational fields (10th / 12th / Grad / Other)
    tenthBoard: String,
    tenthYear: String,
    tenthMarksheetNo: String,
    tenthRollNo: String,
    tenthTotalMarks: Number,
    tenthMarksObtained: Number,
    tenthPercentage: Number,

    twelfthBoard: String,
    twelfthYear: String,
    twelfthMarksheetNo: String,
    twelfthRollNo: String,
    twelfthTotalMarks: Number,
    twelfthMarksObtained: Number,
    twelfthPercentage: Number,

    graduationBoard: String,
    graduationYear: String,
    graduationMarksheetNo: String,
    graduationRollNo: String,
    graduationTotalMarks: Number,
    graduationMarksObtained: Number,
    graduationPercentage: Number,

    otherBoard: String,
    otherYear: String,
    otherMarksheetNo: String,
    otherRollNo: String,
    otherTotalMarks: Number,
    otherMarksObtained: Number,
    otherPercentage: Number,

    // Uploaded docs
    documents: {
      photo: String,
      signature: String,
    },

    declarationAccepted: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);
