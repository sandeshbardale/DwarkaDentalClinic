const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Clinic = require('../models/clinic.model');
const TreatmentCategory = require('../models/treatment-category.model');
const ApiError = require('../utils/ApiError');
const { calculateNextAppointmentDate } = require('../utils/scheduler');

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
 * Fetch appointments with filter / sort / pagination.
 * @param {object} query  { view, status, doctorId, categoryId, date, dateFrom, dateTo,
 *                          priority, sortBy, sortOrder, page, limit }
 * view: 'today' | 'missed' | 'upcoming' | 'all'
 */
async function getAllAppointments(query = {}) {
  const {
    view,
    status,
    doctorId,
    categoryId,
    date,
    dateFrom,
    dateTo,
    priority,
    sortBy = 'startAt',
    sortOrder = 'asc',
    page = 1,
    limit = 50,
  } = query;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const filter = { isDeleted: false };

  // ── View presets ────────────────────────────────────────────────────────────
  if (view === 'today') {
    filter.startAt = { $gte: todayStart, $lte: todayEnd };
    filter.status = { $nin: ['cancelled'] };
  } else if (view === 'missed') {
    filter.startAt = { $lt: todayStart }; // before today
    filter.status = { $in: ['scheduled', 'confirmed', 'arrived'] };
  } else if (view === 'upcoming') {
    filter.startAt = { $gt: todayEnd }; // after today
    filter.status = { $in: ['scheduled', 'confirmed'] };
  }

  // ── Manual filters ──────────────────────────────────────────────────────────
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const mongoose = require('mongoose');
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
    filter.doctorId = new mongoose.Types.ObjectId(doctorId);
  }
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    filter.treatmentCategoryId = new mongoose.Types.ObjectId(categoryId);
  }
  if (date) {
    const d = new Date(date);
    filter.startAt = {
      $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      $lte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    };
  }
  if (dateFrom || dateTo) {
    filter.startAt = {};
    if (dateFrom) filter.startAt.$gte = new Date(dateFrom);
    if (dateTo) filter.startAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
  }

  const sortFieldMap = { startAt: 'startAt', date: 'startAt', patient: 'patientId', doctor: 'doctorId' };
  const sortField = sortFieldMap[sortBy] || 'startAt';
  const sortDir = sortOrder === 'desc' ? -1 : 1;

  const pageNum = Math.max(1, parseInt(page));
  const pageLimit = Math.min(200, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageLimit;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'name patientNumber phone')
      .populate('doctorId', 'name specialization')
      .populate('treatmentCategoryId', 'name code defaultDurationMinutes defaultFollowUpDays')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return {
    data: appointments.map(toFrontendShape),
    pagination: { page: pageNum, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) },
  };
}

/**
 * Book a new appointment with conflict detection.
 */
async function bookAppointment(body, requestingUser) {
  const clinic = await getDefaultClinic();
  const {
    patientId, doctorId, date, time, notes, isEmergency,
    treatmentCategoryId, priority = 'normal',
  } = body;

  const patient = await Patient.findById(patientId);
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') throw ApiError.notFound('Doctor not found.');

  // Lookup treatment category for duration
  let durationMinutes = 30;
  let validCatId;
  const mongoose = require('mongoose');
  if (treatmentCategoryId && mongoose.Types.ObjectId.isValid(treatmentCategoryId)) {
    const cat = await TreatmentCategory.findById(treatmentCategoryId);
    if (cat) {
      durationMinutes = cat.defaultDurationMinutes || 30;
      validCatId = cat._id;
    }
  }

  const aptDate = isEmergency ? new Date().toISOString().split('T')[0] : date;
  const startAt = new Date(`${aptDate}T${time}`);
  const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

  // Conflict detection — check if doctor has overlapping appointment
  if (!isEmergency) {
    const conflict = await Appointment.findOne({
      doctorId: doctor._id,
      isDeleted: false,
      status: { $nin: ['cancelled', 'rescheduled', 'completed', 'missed'] },
      $or: [
        { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
      ],
    });
    if (conflict) {
      throw ApiError.badRequest(
        `Doctor already has an appointment at this time (${new Date(conflict.startAt).toTimeString().slice(0, 5)}). Please choose a different time.`
      );
    }
  }

  const count = await Appointment.countDocuments({ clinicId: clinic._id });
  const appointmentNumber = `APT-2026-${String(count + 1).padStart(4, '0')}`;

  const aptPriority = isEmergency ? 'emergency' : priority;
  const aptStatus = isEmergency ? 'confirmed' : 'scheduled';
  const aptNotes = isEmergency ? `[EMERGENCY] ${notes || ''}` : (notes || '');

  const appointment = await Appointment.create({
    clinicId: clinic._id,
    appointmentNumber,
    patientId: patient._id,
    doctorId: doctor._id,
    treatmentCategoryId: validCatId,
    startAt,
    endAt,
    durationMinutes,
    status: aptStatus,
    priority: aptPriority,
    notes: aptNotes,
    createdById: requestingUser ? requestingUser.id : doctor._id,
  });

  // Update patient's assigned doctor
  if (!patient.assignedDoctorId || patient.assignedDoctorId.toString() !== doctorId) {
    patient.assignedDoctorId = doctor._id;
    await patient.save();
  }

  const populated = await Appointment.findById(appointment._id)
    .populate('patientId', 'name patientNumber phone')
    .populate('doctorId', 'name specialization')
    .populate('treatmentCategoryId', 'name code defaultDurationMinutes defaultFollowUpDays')
    .lean();

  return toFrontendShape(populated);
}

/**
 * Update appointment status.
 * Handles: arrived, completed (auto follow-up), missed, cancelled, rescheduled
 */
async function updateAppointmentStatus(id, body, requestingUser) {
  const { status, nextDate, nextTime, notes } = body;

  const appointment = await Appointment.findById(id);
  if (!appointment || appointment.isDeleted) throw ApiError.notFound('Appointment not found.');

  const oldStatus = appointment.status;
  if (notes !== undefined) appointment.notes = notes;
  appointment.status = status;

  let followUpApt = null;

  if (status === 'arrived' && oldStatus !== 'arrived') {
    appointment.arrivedAt = new Date();
    await appointment.save();

  } else if (status === 'completed' && oldStatus !== 'completed') {
    appointment.completedAt = new Date();
    await appointment.save();

    const patient = await Patient.findById(appointment.patientId);
    if (patient) {
      // Get treatment category for follow-up days
      let followUpDays = 30;
      if (appointment.treatmentCategoryId) {
        const cat = await TreatmentCategory.findById(appointment.treatmentCategoryId);
        if (cat && cat.defaultFollowUpDays !== undefined) followUpDays = cat.defaultFollowUpDays;
      }

      const aptDateStr = appointment.startAt.toISOString().split('T')[0];
      const nextVisitDate = calculateNextAppointmentDate(aptDateStr, null, followUpDays);

      patient.lastVisitAt = appointment.startAt;
      patient.totalVisits = (patient.totalVisits || 0) + 1;
      patient.status = 'follow_up';
      if (nextVisitDate) patient.nextFollowUpAt = new Date(nextVisitDate);
      await patient.save();

      // Auto-schedule follow-up
      if (nextVisitDate && followUpDays > 0) {
        const clinic = await getDefaultClinic();
        const count = await Appointment.countDocuments({ clinicId: clinic._id });
        const aptNumber = `APT-2026-${String(count + 1).padStart(4, '0')}`;
        const nextStart = new Date(`${nextVisitDate}T${appointment.startAt.toTimeString().slice(0, 5)}`);
        const nextEnd = new Date(nextStart.getTime() + appointment.durationMinutes * 60 * 1000);

        followUpApt = await Appointment.create({
          clinicId: clinic._id,
          appointmentNumber: aptNumber,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          treatmentCategoryId: appointment.treatmentCategoryId,
          startAt: nextStart,
          endAt: nextEnd,
          durationMinutes: appointment.durationMinutes,
          status: 'scheduled',
          priority: 'normal',
          notes: `Auto-scheduled follow-up`,
          createdById: requestingUser ? requestingUser.id : appointment.doctorId,
        });
      }
    }

  } else if (status === 'missed') {
    await appointment.save();
    // Update patient status
    const patient = await Patient.findById(appointment.patientId);
    if (patient) {
      patient.status = 'follow_up';
      await patient.save();
    }

  } else if (status === 'rescheduled' && nextDate && nextTime) {
    const newStart = new Date(`${nextDate}T${nextTime}`);
    const newEnd = new Date(newStart.getTime() + appointment.durationMinutes * 60 * 1000);
    appointment.startAt = newStart;
    appointment.endAt = newEnd;
    appointment.status = 'scheduled';
    appointment.notes = `${appointment.notes || ''} [Rescheduled ${new Date().toISOString().split('T')[0]}]`;

    const patient = await Patient.findById(appointment.patientId);
    if (patient) { patient.nextFollowUpAt = newStart; await patient.save(); }
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
 * Get appointments for a specific patient.
 */
async function getAppointmentsByPatient(patientId) {
  const appointments = await Appointment.find({ patientId, isDeleted: false })
    .populate('doctorId', 'name specialization')
    .populate('treatmentCategoryId', 'name code')
    .sort({ startAt: -1 })
    .lean();
  return appointments.map(toFrontendShape);
}

/**
 * Soft-delete an appointment.
 */
async function softDeleteAppointment(id) {
  const appointment = await Appointment.findById(id);
  if (!appointment || appointment.isDeleted) throw ApiError.notFound('Appointment not found.');
  appointment.isDeleted = true;
  await appointment.save();
}

// ─── Shape helper ─────────────────────────────────────────────────────────────
function toFrontendShape(a) {
  const startAt = a.startAt ? new Date(a.startAt) : null;
  const patient = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
  const doctor = a.doctorId && typeof a.doctorId === 'object' ? a.doctorId : null;
  const category = a.treatmentCategoryId && typeof a.treatmentCategoryId === 'object' ? a.treatmentCategoryId : null;

  return {
    id: a._id.toString(),
    appointmentNumber: a.appointmentNumber,
    patientId: patient ? patient._id.toString() : a.patientId?.toString(),
    patientName: patient ? patient.name : '',
    patientNumber: patient ? patient.patientNumber : '',
    patientPhone: patient ? patient.phone : '',
    doctorId: doctor ? doctor._id.toString() : a.doctorId?.toString(),
    doctorName: doctor ? doctor.name : '',
    doctorSpecialization: doctor ? doctor.specialization : '',
    treatmentCategoryId: category ? category._id.toString() : (a.treatmentCategoryId?.toString() || null),
    treatmentCategoryName: category ? category.name : '',
    treatmentCategoryCode: category ? category.code : '',
    defaultDurationMinutes: category ? category.defaultDurationMinutes : null,
    defaultFollowUpDays: category ? category.defaultFollowUpDays : null,
    date: startAt ? startAt.toISOString().split('T')[0] : null,
    time: startAt ? startAt.toTimeString().slice(0, 5) : null,
    startAt: a.startAt,
    endAt: a.endAt,
    durationMinutes: a.durationMinutes,
    status: a.status,
    priority: a.priority || 'normal',
    notes: a.notes || '',
    arrivedAt: a.arrivedAt || null,
    completedAt: a.completedAt || null,
    reminderSent: a.reminderSent || false,
    isDeleted: a.isDeleted,
    createdAt: a.createdAt,
  };
}

module.exports = {
  getAllAppointments,
  bookAppointment,
  updateAppointmentStatus,
  getAppointmentsByPatient,
  softDeleteAppointment,
};
