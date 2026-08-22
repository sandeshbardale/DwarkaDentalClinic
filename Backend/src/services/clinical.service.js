const ClinicalRecord = require('../models/clinical-record.model');
const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
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
 * Fetch clinical records for a patient, sorted newest-first.
 * @param {string} patientId  Mongoose _id string
 */
async function getClinicalRecordsByPatient(patientId) {
  const records = await ClinicalRecord.find({ patientId, isDeleted: false })
    .sort({ visitDate: -1 })
    .lean();

  return records.map((r) => {
    let prescription = [];
    try {
      prescription = r.prescription ? JSON.parse(r.prescription) : [];
    } catch (_) {
      prescription = [];
    }
    return { ...r, id: r._id.toString(), prescription };
  });
}

/**
 * Add a new clinical record for a patient visit.
 * @param {object} body  { patientId, appointmentId?, doctorId, chiefComplaint, diagnosis, treatment, clinicalNotes, followUpDate?, followUpInstructions?, prescription? }
 */
async function addClinicalRecord(body) {
  const clinic = await getDefaultClinic();
  const {
    patientId, appointmentId, doctorId, chiefComplaint,
    diagnosis, treatment, clinicalNotes, followUpDate,
    followUpInstructions, prescription, dentalChart,
  } = body;

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const doctor = await User.findById(doctorId);
  const doctorName = doctor ? doctor.name : 'Dr. Dentist';

  const prescriptionStr = prescription ? JSON.stringify(prescription) : null;

  const record = await ClinicalRecord.create({
    clinicId: clinic._id,
    patientId: patient._id,
    appointmentId: appointmentId || undefined,
    doctorId,
    doctorName,
    visitDate: new Date(),
    chiefComplaint: chiefComplaint || patient.chiefComplaint || '',
    diagnosis,
    treatment,
    clinicalNotes: clinicalNotes || '',
    followUpDate: followUpDate || undefined,
    followUpInstructions: followUpInstructions || '',
    prescription: prescriptionStr,
    dentalChart: Array.isArray(dentalChart) ? dentalChart : [],
    status: 'completed',
  });

  // Update patient summary fields
  patient.lastVisitAt = new Date();
  patient.totalVisits = (patient.totalVisits || 0) + 1;
  if (followUpDate) {
    patient.nextFollowUpAt = new Date(followUpDate);
    patient.status = 'follow_up';
  } else {
    patient.status = 'completed';
  }
  if (chiefComplaint) patient.chiefComplaint = chiefComplaint;
  await patient.save();

  // Mark appointment as completed if provided
  if (appointmentId) {
    const apt = await Appointment.findById(appointmentId);
    if (apt) {
      apt.status = 'completed';
      apt.completedAt = new Date();
      await apt.save();
    }
  }

  const parsed = {
    ...record.toObject(),
    id: record._id.toString(),
    prescription: prescription || [],
  };

  return parsed;
}

module.exports = { getClinicalRecordsByPatient, addClinicalRecord };
