const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');

/**
 * Returns the single clinic document from the database.
 * All operations attach clinicId from this document.
 */
async function getDefaultClinic() {
  const clinic = await Clinic.findOne({});
  if (!clinic) throw ApiError.internal('Clinic not found. Run the server to seed default data.');
  return clinic;
}

/**
 * Fetch all non-deleted patients, serialized for the frontend.
 * Converts Mongoose docs to plain objects with frontend-compatible field names.
 */
async function getAllPatients() {
  const patients = await Patient.find({ isDeleted: false }).sort({ registeredAt: -1 }).lean();
  return patients.map(toFrontendShape);
}

/**
 * Register a new patient (and optionally create their first appointment).
 * @param {object} body  POST request body from RegisterPatientPage
 * @returns {{ patient: object, appointment: object|null }}
 */
async function createPatient(body) {
  const clinic = await getDefaultClinic();

  const {
    name, age, dob, gender, phone, email, address,
    emergencyContact, bloodGroup, assignedDoctorId,
    chiefComplaint, allergies, medicalHistory,
    appointmentDate, appointmentTime, appointmentType, notes,
  } = body;

  // Auto-generate a sequential patientNumber (DWK-2026-XXXX)
  const count = await Patient.countDocuments({ clinicId: clinic._id });
  const patientNumber = `DWK-2026-${String(count + 1).padStart(4, '0')}`;

  // allergies may come as a plain string from the form; store as an array
  const allergiesArr = typeof allergies === 'string'
    ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
    : (allergies || []);

  // Guard: only use assignedDoctorId if it looks like a valid MongoDB ObjectId (24 hex chars)
  const mongoose = require('mongoose');
  const validDoctorId = assignedDoctorId && mongoose.Types.ObjectId.isValid(assignedDoctorId)
    ? assignedDoctorId
    : undefined;

  const patient = await Patient.create({
    clinicId: clinic._id,
    patientNumber,
    name,
    dateOfBirth: dob || undefined,
    gender,
    phone,
    email,
    address,
    emergencyContact: emergencyContact?.name ? emergencyContact : undefined,
    bloodGroup,
    chiefComplaint,
    medicalHistory,
    allergies: allergiesArr.length ? allergiesArr : [],
    assignedDoctorId: validDoctorId,
    status: 'new',
    registeredAt: new Date(),
    totalVisits: 0,
  });

  let initialApt = null;
  if (appointmentDate && appointmentTime && validDoctorId) {
    const doctor = await User.findById(validDoctorId);
    const doctorName = doctor ? doctor.name : 'Dr. General Dentist';
    const count2 = await Appointment.countDocuments({ clinicId: clinic._id });
    const appointmentNumber = `APT-2026-${String(count2 + 1).padStart(4, '0')}`;

    const startAt = new Date(`${appointmentDate}T${appointmentTime}`);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000); // 30-min default

    initialApt = await Appointment.create({
      clinicId: clinic._id,
      appointmentNumber,
      patientId: patient._id,
      doctorId: validDoctorId,
      treatmentCategoryId: undefined,
      startAt,
      endAt,
      durationMinutes: 30,
      status: 'scheduled',
      notes: notes || '',
      createdById: validDoctorId, // Use doctor as creator stub until auth provides userId
    });
  }

  return {
    patient: toFrontendShape(patient.toObject()),
    appointment: initialApt ? toFrontendAppointment(initialApt.toObject()) : null,
  };
}

/**
 * Update editable patient fields.
 * @param {string} id     Mongoose _id string
 * @param {object} body   Fields to update
 */
async function updatePatient(id, body) {
  const patient = await Patient.findById(id);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const allowedFields = [
    'name', 'phone', 'email', 'address', 'gender', 'bloodGroup',
    'chiefComplaint', 'medicalHistory', 'allergies', 'assignedDoctorId',
    'status', 'lastVisitAt', 'nextFollowUpAt', 'totalVisits',
    'emergencyContact',
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      patient[field] = body[field];
    }
  }
  await patient.save();
  return toFrontendShape(patient.toObject());
}

/**
 * Soft-delete a patient (Admin only).
 * @param {string} id  Mongoose _id string
 */
async function softDeletePatient(id) {
  const patient = await Patient.findById(id);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');
  patient.isDeleted = true;
  await patient.save();
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

/**
 * Map a Mongoose Patient document to the flat shape the frontend expects.
 * The current frontend pages access: id, patientId, name, age, phone, email,
 * address, gender, bloodGroup, status, assignedDoctorId, lastVisit,
 * nextFollowUp, totalVisits, chiefComplaint, allergies, medicalHistory,
 * emergencyContact, registeredAt.
 */
function toFrontendShape(p) {
  return {
    // _id → id for frontend key usage
    id: p._id.toString(),
    patientId: p.patientNumber,
    name: p.name,
    age: p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth)) / 3.156e10) : undefined,
    dob: p.dateOfBirth,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    emergencyContact: p.emergencyContact || null,
    bloodGroup: p.bloodGroup,
    chiefComplaint: p.chiefComplaint,
    medicalHistory: p.medicalHistory,
    allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || 'None'),
    assignedDoctorId: p.assignedDoctorId ? p.assignedDoctorId.toString() : null,
    status: p.status,
    registeredAt: p.registeredAt,
    lastVisit: p.lastVisitAt,
    nextFollowUp: p.nextFollowUpAt,
    totalVisits: p.totalVisits || 0,
    isDeleted: p.isDeleted,
  };
}

function toFrontendAppointment(a) {
  const startAt = a.startAt ? new Date(a.startAt) : null;
  return {
    id: a._id.toString(),
    patientId: a.patientId.toString(),
    doctorId: a.doctorId.toString(),
    date: startAt ? startAt.toISOString().split('T')[0] : null,
    time: startAt ? startAt.toTimeString().slice(0, 5) : null,
    type: 'Consultation',
    status: a.status,
    notes: a.notes,
  };
}

module.exports = {
  getAllPatients,
  createPatient,
  updatePatient,
  softDeletePatient,
  toFrontendShape,
  toFrontendAppointment,
};
