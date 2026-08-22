const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');

async function getDefaultClinic() {
  let clinic = await Clinic.findOne({});
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Dwarka Dental Clinic',
      email: 'info@dwarkadental.com',
      phone: '+91 98765 00000',
      address: { street: 'Sector 12', city: 'Dwarka, New Delhi', state: 'Delhi', zipCode: '110075' }
    });
  }
  return clinic;
}

/**
 * Fetch patients with search / filter / sort / pagination.
 * @param {object} query  { search, status, doctorId, sortBy, sortOrder, page, limit }
 * @returns {{ data: object[], pagination: object }}
 */
 async function getAllPatients(query = {}) {
  const {
    search = '',
    status,
    doctorId,
    categoryId,
    sortBy = 'registeredAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = query;

  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { patientNumber: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;

  const mongoose = require('mongoose');
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
    filter.assignedDoctorId = new mongoose.Types.ObjectId(doctorId);
  }

  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    const matchingApts = await Appointment.find({
      treatmentCategoryId: new mongoose.Types.ObjectId(categoryId),
      isDeleted: false,
    }).distinct('patientId');
    filter._id = { $in: matchingApts };
  }

  const sortMap = {
    name: 'name',
    registeredAt: 'registeredAt',
    lastVisit: 'lastVisitAt',
    nextFollowUp: 'nextFollowUpAt',
  };
  const sortField = sortMap[sortBy] || 'registeredAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, parseInt(page));
  const pageLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageLimit;

  const [patients, total] = await Promise.all([
    Patient.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(pageLimit).lean(),
    Patient.countDocuments(filter),
  ]);

  return {
    data: patients.map(toFrontendShape),
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit),
    },
  };
}

/**
 * Get a single patient by ID.
 */
async function getPatientById(id) {
  const patient = await Patient.findById(id).lean();
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');
  return toFrontendShape(patient);
}

/**
 * Register a new patient (and optionally create their first appointment).
 */
async function createPatient(body) {
  const clinic = await getDefaultClinic();

  const {
    name, age, dob, gender, phone, email, address,
    emergencyContact, bloodGroup, assignedDoctorId,
    chiefComplaint, allergies, medicalHistory,
    appointmentDate, appointmentTime, appointmentType,
    treatmentCategoryId, notes,
  } = body;

  const count = await Patient.countDocuments({ clinicId: clinic._id });
  const patientNumber = `DWK-2026-${String(count + 1).padStart(4, '0')}`;

  const allergiesArr = typeof allergies === 'string'
    ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
    : (allergies || []);

  const mongoose = require('mongoose');
  const validDoctorId = assignedDoctorId && mongoose.Types.ObjectId.isValid(assignedDoctorId)
    ? assignedDoctorId : undefined;

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
    allergies: allergiesArr,
    assignedDoctorId: validDoctorId,
    status: 'new',
    registeredAt: new Date(),
    totalVisits: 0,
  });

  let initialApt = null;
  if (appointmentDate && appointmentTime && validDoctorId) {
    const count2 = await Appointment.countDocuments({ clinicId: clinic._id });
    const appointmentNumber = `APT-2026-${String(count2 + 1).padStart(4, '0')}`;
    const startAt = new Date(`${appointmentDate}T${appointmentTime}`);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

    const validCatId = treatmentCategoryId && mongoose.Types.ObjectId.isValid(treatmentCategoryId)
      ? treatmentCategoryId : undefined;

    initialApt = await Appointment.create({
      clinicId: clinic._id,
      appointmentNumber,
      patientId: patient._id,
      doctorId: validDoctorId,
      treatmentCategoryId: validCatId,
      startAt,
      endAt,
      durationMinutes: 30,
      status: 'scheduled',
      notes: notes || '',
      createdById: validDoctorId,
    });
  }

  return {
    patient: toFrontendShape(patient.toObject()),
    appointment: initialApt ? toFrontendAppointment(initialApt.toObject()) : null,
  };
}

/**
 * Update editable patient fields.
 */
async function updatePatient(id, body) {
  const patient = await Patient.findById(id);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const allowed = [
    'name', 'phone', 'email', 'address', 'gender', 'bloodGroup',
    'chiefComplaint', 'medicalHistory', 'allergies', 'assignedDoctorId',
    'status', 'lastVisitAt', 'nextFollowUpAt', 'totalVisits',
    'emergencyContact', 'dateOfBirth',
  ];

  for (const field of allowed) {
    if (body[field] !== undefined) {
      patient[field] = body[field];
    }
  }
  await patient.save();
  return toFrontendShape(patient.toObject());
}

/**
 * Soft-delete a patient (Admin only).
 */
async function softDeletePatient(id) {
  const patient = await Patient.findById(id);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');
  patient.isDeleted = true;
  await patient.save();
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

function toFrontendShape(p) {
  return {
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
  getPatientById,
  createPatient,
  updatePatient,
  softDeletePatient,
  toFrontendShape,
  toFrontendAppointment,
};
