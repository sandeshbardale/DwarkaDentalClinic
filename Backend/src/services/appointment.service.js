const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const { calculateNextAppointmentDate } = require('../utils/scheduler');

async function getDefaultClinic() {
  const clinic = await Clinic.findOne({});
  if (!clinic) throw ApiError.internal('Clinic not found.');
  return clinic;
}

/**
 * Fetch all non-deleted appointments, sorted newest-first.
 */
async function getAllAppointments() {
  const appointments = await Appointment.find({ isDeleted: false })
    .sort({ startAt: -1 })
    .lean();
  return appointments.map(toFrontendShape);
}

/**
 * Book a new appointment.
 * @param {object} body  { patientId, doctorId, date, time, type, reason, notes, isEmergency }
 */
async function bookAppointment(body) {
  const clinic = await getDefaultClinic();
  const { patientId, doctorId, date, time, type, reason, notes, isEmergency } = body;

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') throw ApiError.notFound('Doctor not found.');

  const count = await Appointment.countDocuments({ clinicId: clinic._id });
  const appointmentNumber = `APT-2026-${String(count + 1).padStart(4, '0')}`;

  const aptDate = isEmergency ? new Date().toISOString().split('T')[0] : date;
  const startAt = new Date(`${aptDate}T${time}`);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

  const actualStatus = isEmergency ? 'confirmed' : 'scheduled';
  const actualNotes = isEmergency ? `[EMERGENCY VISIT - HIGH PRIORITY] ${notes || ''}` : (notes || '');
  const actualType = isEmergency ? 'Emergency' : (type || 'Consultation');

  const appointment = await Appointment.create({
    clinicId: clinic._id,
    appointmentNumber,
    patientId: patient._id,
    doctorId: doctor._id,
    startAt,
    endAt,
    durationMinutes: 30,
    status: actualStatus,
    notes: actualNotes,
    createdById: doctor._id,
  });

  // Update patient's assigned doctor if changed
  if (!patient.assignedDoctorId || patient.assignedDoctorId.toString() !== doctorId) {
    patient.assignedDoctorId = doctor._id;
    await patient.save();
  }

  return toFrontendShape(appointment.toObject(), { patientName: patient.name, doctorName: doctor.name, type: actualType, reason });
}

/**
 * Update appointment status, handle completion (auto follow-up) and reschedule.
 * @param {string} id       Appointment _id
 * @param {object} body     { status, nextDate, nextTime, notes }
 */
async function updateAppointmentStatus(id, body) {
  const { status, nextDate, nextTime, notes } = body;

  const appointment = await Appointment.findById(id);
  if (!appointment || appointment.isDeleted) throw ApiError.notFound('Appointment not found.');

  const oldStatus = appointment.status;

  if (notes !== undefined) appointment.notes = notes;
  appointment.status = status;

  let followUpApt = null;

  // Patient visited — mark completed, update patient stats, auto-schedule follow-up
  if (status === 'completed' && oldStatus !== 'completed') {
    appointment.completedAt = new Date();
    await appointment.save();

    const patient = await Patient.findById(appointment.patientId);
    if (patient) {
      const aptDateStr = appointment.startAt.toISOString().split('T')[0];
      const aptType = body.type || 'Consultation'; // best-effort; stored in notes
      const nextVisitDate = calculateNextAppointmentDate(aptDateStr, aptType);

      patient.lastVisitAt = appointment.startAt;
      patient.totalVisits = (patient.totalVisits || 0) + 1;
      patient.status = 'follow_up';
      if (nextVisitDate) patient.nextFollowUpAt = new Date(nextVisitDate);
      await patient.save();

      // Auto-schedule follow-up appointment
      if (nextVisitDate) {
        const clinic = await getDefaultClinic();
        const count = await Appointment.countDocuments({ clinicId: clinic._id });
        const aptNumber = `APT-2026-${String(count + 1).padStart(4, '0')}`;
        const nextStart = new Date(`${nextVisitDate}T${appointment.startAt.toTimeString().slice(0, 5)}`);
        const nextEnd = new Date(nextStart.getTime() + 30 * 60 * 1000);

        followUpApt = await Appointment.create({
          clinicId: clinic._id,
          appointmentNumber: aptNumber,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          startAt: nextStart,
          endAt: nextEnd,
          durationMinutes: 30,
          status: 'scheduled',
          notes: `Auto-scheduled follow-up`,
          createdById: appointment.doctorId,
        });
      }
    }
  } else if (status === 'rescheduled' || (status === 'scheduled' && nextDate && nextTime)) {
    // Rescheduled — update date/time
    const newStart = new Date(`${nextDate || appointment.startAt.toISOString().split('T')[0]}T${nextTime || appointment.startAt.toTimeString().slice(0, 5)}`);
    const newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);
    appointment.startAt = newStart;
    appointment.endAt = newEnd;
    appointment.status = 'scheduled';
    appointment.notes = `${appointment.notes || ''} [Rescheduled on ${new Date().toISOString().split('T')[0]}]`;

    const patient = await Patient.findById(appointment.patientId);
    if (patient) {
      patient.nextFollowUpAt = newStart;
      await patient.save();
    }
    await appointment.save();
  } else {
    await appointment.save();
  }

  return {
    appointment: toFrontendShape(appointment.toObject()),
    followUpAppointment: followUpApt ? toFrontendShape(followUpApt.toObject()) : null,
  };
}

/**
 * Soft-delete an appointment (Admin only).
 */
async function softDeleteAppointment(id) {
  const appointment = await Appointment.findById(id);
  if (!appointment || appointment.isDeleted) throw ApiError.notFound('Appointment not found.');
  appointment.isDeleted = true;
  await appointment.save();
}

// ─── Shape helper ─────────────────────────────────────────────────────────────

/**
 * Map a Mongoose Appointment document to the flat shape the frontend expects.
 * Frontend accesses: id, patientId, patientName, doctorId, doctorName, date, time, type, reason, status, notes.
 */
function toFrontendShape(a, extra = {}) {
  const startAt = a.startAt ? new Date(a.startAt) : null;
  return {
    id: a._id.toString(),
    patientId: a.patientId.toString(),
    patientName: extra.patientName || a.patientName || '',
    doctorId: a.doctorId.toString(),
    doctorName: extra.doctorName || a.doctorName || '',
    date: startAt ? startAt.toISOString().split('T')[0] : null,
    time: startAt ? startAt.toTimeString().slice(0, 5) : null,
    type: extra.type || 'Consultation',
    reason: extra.reason || a.notes || '',
    status: a.status,
    notes: a.notes || '',
    completedAt: a.completedAt || null,
    isDeleted: a.isDeleted,
  };
}

module.exports = {
  getAllAppointments,
  bookAppointment,
  updateAppointmentStatus,
  softDeleteAppointment,
};
