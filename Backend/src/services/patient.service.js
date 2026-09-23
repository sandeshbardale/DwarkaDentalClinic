const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const Clinic = require('../models/clinic.model');
const TreatmentCategory = require('../models/treatment-category.model');
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
    limit = 200,
  } = query;

  const filter = { isDeleted: false };

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { patientNumber: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { chiefComplaint: { $regex: s, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;

  const mongoose = require('mongoose');
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
    filter.assignedDoctorId = new mongoose.Types.ObjectId(doctorId);
  }

  if (categoryId) {
    let catObjId = mongoose.Types.ObjectId.isValid(categoryId) ? new mongoose.Types.ObjectId(categoryId) : null;
    if (!catObjId) {
      const TreatmentCategory = require('../models/treatment-category.model');
      const found = await TreatmentCategory.findOne({
        $or: [{ code: String(categoryId).toUpperCase() }, { name: new RegExp(`^${categoryId}$`, 'i') }]
      });
      if (found) catObjId = found._id;
    }
    if (catObjId) {
      const matchingApts = await Appointment.find({
        treatmentCategoryId: catObjId,
        isDeleted: false,
      }).distinct('patientId');
      filter.$or = [
        { treatmentCategoryId: catObjId },
        { _id: { $in: matchingApts } },
      ];
    }
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
  const parsedLimit = limit === 'all' ? 2000 : parseInt(limit || 200);
  const pageLimit = Math.min(2000, Math.max(1, isNaN(parsedLimit) ? 200 : parsedLimit));
  const skip = (pageNum - 1) * pageLimit;

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .populate('assignedDoctorId', 'name specialization')
      .populate('treatmentCategoryId', 'name code defaultDurationMinutes defaultFollowUpDays')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
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
  const patient = await Patient.findById(id)
    .populate('assignedDoctorId', 'name specialization')
    .populate('treatmentCategoryId', 'name code defaultDurationMinutes defaultFollowUpDays')
    .lean();
  if (!patient || patient.isDeleted) throw ApiError.notFound('Patient not found.');
  return toFrontendShape(patient);
}

function normalizeCategory(str) {
  if (!str) return 'General Consultation';
  let clean = String(str).trim().toLowerCase();
  clean = clean.replace(/^cat-/, '').trim();
  clean = clean.replace(/\s*\([^)]*\)/g, '').trim();
  if (['root canal', 'rct', 'root canal treatment', 'endodontics & rct', 'endodontics'].includes(clean)) return 'Root Canal Treatment';
  if (['orthodontic', 'orthodontics', 'othodontic', 'othodontics', 'ortho', 'braces'].includes(clean)) return 'Orthodontics';
  if (['extraction', 'tooth extraction', 'extractions', 'extract'].includes(clean)) return 'Tooth Extraction';
  if (['dental implant', 'implant', 'implants', 'dental implants'].includes(clean)) return 'Dental Implant';
  if (['general consultation', 'consultation', 'consult', 'general dentistry'].includes(clean)) return 'General Consultation';
  if (['cleaning & scaling', 'scaling & cleaning', 'scale', 'scaling', 'cleaning', 'periodontics'].includes(clean)) return 'Cleaning & Scaling';
  if (['cavity filling', 'filling', 'fill'].includes(clean)) return 'Cavity Filling';
  if (['prosthodontics & crown', 'crown', 'prosthodontics', 'implantology & prosthodontics'].includes(clean)) return 'Prosthodontics & Crown';
  if (['emergency dental', 'emergency', 'emerg'].includes(clean)) return 'Emergency Dental';
  if (['x-ray & diagnosis', 'x-ray', 'xray', 'diagnosis'].includes(clean)) return 'X-Ray & Diagnosis';
  return clean;
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
  let validDoctorId = assignedDoctorId && mongoose.Types.ObjectId.isValid(assignedDoctorId)
    ? assignedDoctorId : undefined;

  if (!validDoctorId) {
    const defaultDoc = await User.findOne({ clinicId: clinic._id, role: 'doctor', status: 'active' });
    if (defaultDoc) validDoctorId = defaultDoc._id;
  }

  // Robust category resolution
  let validCatId;
  let catName = 'General Consultation';
  const catParam = treatmentCategoryId || body.treatmentCategoryName || body.categoryName;

  const allCategories = await TreatmentCategory.find({}).lean();

  if (catParam) {
    const rawParam = String(catParam).trim();
    const normParam = normalizeCategory(rawParam).toLowerCase();
    const cleanCode = rawParam.replace(/^cat-/, '').toUpperCase();

    // 1. Direct ID match
    let matched = allCategories.find(c => c._id.toString() === rawParam || c.id === rawParam);

    // 2. Direct Code match
    if (!matched) {
      matched = allCategories.find(c => c.code && c.code.toUpperCase() === cleanCode);
    }

    // 3. Normalized Name match
    if (!matched) {
      matched = allCategories.find(c => normalizeCategory(c.name).toLowerCase() === normParam);
    }

    // 4. Fuzzy Substring match
    if (!matched) {
      matched = allCategories.find(c => {
        const cNorm = normalizeCategory(c.name).toLowerCase();
        return cNorm.includes(normParam) || normParam.includes(cNorm);
      });
    }

    if (matched) {
      validCatId = matched._id;
      catName = matched.name;
    } else {
      catName = body.treatmentCategoryName || body.categoryName || rawParam;
    }
  }

  // Fallback to General Consultation if no category was specified
  if (!validCatId && (!body.treatmentCategoryName && !body.categoryName && !treatmentCategoryId)) {
    const generalCat = allCategories.find(c => normalizeCategory(c.name).toLowerCase() === 'general consultation') || allCategories[0];
    if (generalCat) {
      validCatId = generalCat._id;
      catName = generalCat.name;
    }
  }

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
    treatmentCategoryId: validCatId,
    treatmentCategoryName: catName,
    status: 'new',
    registeredAt: new Date(),
    totalVisits: 0,
  });

  let initialApt = null;
  const aptDate = appointmentDate || new Date().toISOString().split('T')[0];
  const aptTime = appointmentTime || '10:00';

  if (validDoctorId) {
    try {
      const count2 = await Appointment.countDocuments({ clinicId: clinic._id });
      const appointmentNumber = `APT-2026-${String(count2 + 1).padStart(4, '0')}`;
      // Parse as IST (UTC+5:30) to avoid midnight boundary shifts
      const startAt = new Date(`${aptDate}T${aptTime}:00+05:30`);
      const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

      const doctor = await User.findById(validDoctorId).lean();

      initialApt = await Appointment.create({
        clinicId: clinic._id,
        appointmentNumber,
        patientId: patient._id,
        patientName: patient.name,
        patientPhone: patient.phone || '',
        doctorId: validDoctorId,
        doctorName: doctor?.name || '',
        treatmentCategoryId: validCatId,
        treatmentCategoryName: catName,
        date: aptDate,
        time: aptTime,
        startAt,
        endAt,
        durationMinutes: 30,
        status: 'scheduled',
        priority: 'normal',
        notes: notes || chiefComplaint || '',
        createdById: validDoctorId,
        isDeleted: false,
      });
    } catch (aptErr) {
      console.error('[createPatient] Appointment creation failed:', aptErr.message);
    }
  }

  let recordedPayment = null;
  const advanceAmount = Number(body.advanceAmount || body.advancePayment || 0);
  if (advanceAmount > 0) {
    try {
      const paymentService = require('./payment.service');
      let pMethod = 'upi';
      const rawMethod = String(body.paymentMode || 'upi').toLowerCase().trim();
      if (rawMethod.includes('cash')) pMethod = 'cash';
      else if (rawMethod.includes('card')) pMethod = 'card';
      else if (rawMethod.includes('bank') || rawMethod.includes('transfer') || rawMethod.includes('net')) pMethod = 'bank_transfer';
      else pMethod = 'upi';

      recordedPayment = await paymentService.addPayment({
        patientId: patient._id,
        appointmentId: initialApt ? initialApt._id : undefined,
        amount: advanceAmount,
        mode: pMethod,
        notes: body.paymentNotes || 'Registration Advance Payment',
        date: aptDate,
      }, { id: validDoctorId || clinic._id });
    } catch (payErr) {
      console.error('[createPatient] Advance payment creation failed:', payErr.message);
    }
  }

  return {
    patient: toFrontendShape(patient.toObject()),
    appointment: initialApt ? toFrontendAppointment(initialApt.toObject()) : null,
    payment: recordedPayment || null,
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
    'treatmentCategoryId', 'treatmentCategoryName',
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
 * Soft-delete a patient (Admin and Receptionist).
 * Also cancels and soft-deletes all associated appointments.
 */
async function softDeletePatient(id) {
  const mongoose = require('mongoose');
  let patient = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    patient = await Patient.findById(id);
  }
  if (!patient) {
    patient = await Patient.findOne({ patientNumber: String(id) });
  }

  if (patient) {
    patient.isDeleted = true;
    await patient.save();
  }

  // Also soft-delete all appointments associated with this patient
  const idList = [];
  if (id) {
    idList.push(id);
    if (mongoose.Types.ObjectId.isValid(id)) {
      idList.push(new mongoose.Types.ObjectId(id));
    }
  }
  if (patient?._id) {
    idList.push(patient._id);
    idList.push(patient._id.toString());
  }

  if (idList.length > 0) {
    await Appointment.updateMany(
      { patientId: { $in: idList } },
      { $set: { isDeleted: true, status: 'cancelled' } }
    );
  }
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

function toFrontendShape(p) {
  const docObj = p.assignedDoctorId && typeof p.assignedDoctorId === 'object' && p.assignedDoctorId.name ? p.assignedDoctorId : null;
  const docId = docObj ? docObj._id.toString() : (p.assignedDoctorId ? p.assignedDoctorId.toString() : null);

  const catObj = p.treatmentCategoryId && typeof p.treatmentCategoryId === 'object' && p.treatmentCategoryId.name ? p.treatmentCategoryId : null;
  const catId = catObj ? catObj._id.toString() : (p.treatmentCategoryId ? p.treatmentCategoryId.toString() : null);
  const catName = (catObj && catObj.name) || p.treatmentCategoryName || 'General Consultation';

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
    assignedDoctorId: docId,
    doctorName: docObj ? docObj.name : null,
    doctorSpecialization: docObj ? docObj.specialization : null,
    treatmentCategoryId: catId,
    treatmentCategoryName: catName,
    categoryName: catName,
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
    appointmentNumber: a.appointmentNumber || '',
    patientId: a.patientId ? a.patientId.toString() : '',
    patientName: a.patientName || '',
    patientPhone: a.patientPhone || '',
    doctorId: a.doctorId ? a.doctorId.toString() : '',
    doctorName: a.doctorName || '',
    treatmentCategoryName: a.treatmentCategoryName || 'General Consultation',
    date: a.date || (startAt ? startAt.toISOString().split('T')[0] : null),
    time: a.time || (startAt ? startAt.toTimeString().slice(0, 5) : null),
    type: 'Consultation',
    status: a.status || 'scheduled',
    notes: a.notes || '',
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
