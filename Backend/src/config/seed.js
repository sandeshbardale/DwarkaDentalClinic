/**
 * Database Seeder
 * Seeds clinic, staff users, treatment categories, patients, and appointments into MongoDB.
 * Ensures appointments for TODAY, UPCOMING, MISSED, and ALL tabs exist dynamically.
 */
const bcrypt = require('bcryptjs');
const Clinic = require('../models/clinic.model');
const User = require('../models/user.model');
const TreatmentCategory = require('../models/treatment-category.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

const DEFAULT_TREATMENT_CATEGORIES = [
  { name: 'General Consultation', code: 'CONSULT', defaultDurationMinutes: 30, defaultFollowUpDays: 30 },
  { name: 'Orthodontics', code: 'ORTHO', defaultDurationMinutes: 45, defaultFollowUpDays: 28 },
  { name: 'Root Canal Treatment', code: 'RCT', defaultDurationMinutes: 60, defaultFollowUpDays: 10 },
  { name: 'Tooth Extraction', code: 'EXTRACT', defaultDurationMinutes: 30, defaultFollowUpDays: 5 },
  { name: 'Cavity Filling', code: 'FILL', defaultDurationMinutes: 45, defaultFollowUpDays: 30 },
  { name: 'Cleaning & Scaling', code: 'SCALE', defaultDurationMinutes: 45, defaultFollowUpDays: 180 },
  { name: 'Dental Implant', code: 'IMPLANT', defaultDurationMinutes: 90, defaultFollowUpDays: 14 },
  { name: 'Prosthodontics & Crown', code: 'CROWN', defaultDurationMinutes: 60, defaultFollowUpDays: 7 },
  { name: 'Emergency Dental', code: 'EMERG', defaultDurationMinutes: 30, defaultFollowUpDays: 3 },
  { name: 'X-Ray & Diagnosis', code: 'XRAY', defaultDurationMinutes: 20, defaultFollowUpDays: 7 },
];

const DEFAULT_STAFF = [
  {
    name: 'Dr. Admin',
    email: 'admin@dwarkadental.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91 98765 00001',
  },
  {
    name: 'Dr. Neha Sharma',
    email: 'doctor@dwarkadental.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+91 98765 00002',
    specialization: 'General Dentistry',
  },
  {
    name: 'Dr. Rohan Mehta',
    email: 'rohan@dwarkadental.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+91 98765 00004',
    specialization: 'Endodontics & RCT',
  },
  {
    name: 'Dr. Kavita Iyer',
    email: 'kavita@dwarkadental.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+91 98765 00005',
    specialization: 'Periodontics',
  },
  {
    name: 'Dr. Arjun Kapoor',
    email: 'arjun@dwarkadental.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+91 98765 00006',
    specialization: 'Implantology & Prosthodontics',
  },
  {
    name: 'Priya Patel',
    email: 'receptionist@dwarkadental.com',
    password: 'recep123',
    role: 'receptionist',
    phone: '+91 98765 00003',
  },
];

const PATIENT_SEED_DATA = [
  {
    patientNumber: 'DWK-2026-0001',
    name: 'Aarav Patil',
    dateOfBirth: new Date('1996-04-12'),
    gender: 'male',
    phone: '+91 98001 11001',
    email: 'aarav.patil@email.com',
    address: 'Flat 4B, Sunrise Apartments, Dwarka Sector 7, New Delhi 110075',
    emergencyContact: { name: 'Ramesh Patil', relation: 'Father', phone: '+91 98001 11002' },
    bloodGroup: 'B+',
    chiefComplaint: 'Orthodontic consultation — misaligned teeth',
    allergies: [],
    medicalHistory: 'No significant medical history',
    status: 'follow_up',
    totalVisits: 4,
  },
  {
    patientNumber: 'DWK-2026-0002',
    name: 'Sneha Kulkarni',
    dateOfBirth: new Date('1989-09-22'),
    gender: 'female',
    phone: '+91 98001 11003',
    email: 'sneha.kulkarni@email.com',
    address: 'H-12, Model Town, Dwarka Sector 12, New Delhi 110078',
    emergencyContact: { name: 'Vijay Kulkarni', relation: 'Husband', phone: '+91 98001 11004' },
    bloodGroup: 'O+',
    chiefComplaint: 'Severe toothache — lower right molar',
    allergies: ['Penicillin'],
    medicalHistory: 'Hypertension (controlled)',
    status: 'follow_up',
    totalVisits: 6,
  },
  {
    patientNumber: 'DWK-2026-0003',
    name: 'Rohit Sharma',
    dateOfBirth: new Date('1982-11-08'),
    gender: 'male',
    phone: '+91 98001 11005',
    email: 'rohit.sharma@email.com',
    address: '23, Patel Nagar, Dwarka Sector 3, New Delhi 110059',
    emergencyContact: { name: 'Anita Sharma', relation: 'Wife', phone: '+91 98001 11006' },
    bloodGroup: 'A+',
    chiefComplaint: 'Gum bleeding and sensitivity',
    allergies: [],
    medicalHistory: 'Diabetes Type 2',
    status: 'completed',
    totalVisits: 3,
  },
  {
    patientNumber: 'DWK-2026-0004',
    name: 'Lakshmi Nair',
    dateOfBirth: new Date('1969-06-30'),
    gender: 'female',
    phone: '+91 98001 11007',
    email: 'lakshmi.nair@email.com',
    address: 'Block C, Vasant Kunj, New Delhi 110070',
    emergencyContact: { name: 'Suresh Nair', relation: 'Son', phone: '+91 98001 11008' },
    bloodGroup: 'AB+',
    chiefComplaint: 'Missing tooth — requires implant',
    allergies: ['Latex'],
    medicalHistory: 'Osteoporosis, Thyroid',
    status: 'follow_up',
    totalVisits: 8,
  },
  {
    patientNumber: 'DWK-2026-0005',
    name: 'Karan Mehta',
    dateOfBirth: new Date('2005-02-14'),
    gender: 'male',
    phone: '+91 98001 11009',
    email: 'karan.mehta@email.com',
    address: 'Sector 22, Dwarka, New Delhi 110077',
    emergencyContact: { name: 'Sunil Mehta', relation: 'Father', phone: '+91 98001 11010' },
    bloodGroup: 'O-',
    chiefComplaint: 'Wisdom tooth pain',
    allergies: [],
    medicalHistory: 'No significant history',
    status: 'new',
    totalVisits: 1,
  },
  {
    patientNumber: 'DWK-2026-0006',
    name: 'Divya Nanda',
    dateOfBirth: new Date('1993-07-19'),
    gender: 'female',
    phone: '+91 98001 11011',
    email: 'divya.nanda@email.com',
    address: '5A, Rohini Sector 11, New Delhi 110085',
    emergencyContact: { name: 'Raj Nanda', relation: 'Brother', phone: '+91 98001 11012' },
    bloodGroup: 'B-',
    chiefComplaint: 'Cavity filling — two teeth',
    allergies: ['Sulfa drugs'],
    medicalHistory: 'No significant history',
    status: 'follow_up',
    totalVisits: 2,
  },
  {
    patientNumber: 'DWK-2026-0007',
    name: 'Ajay Bose',
    dateOfBirth: new Date('1976-12-03'),
    gender: 'male',
    phone: '+91 98001 11013',
    email: 'ajay.bose@email.com',
    address: '77, Pitampura, New Delhi 110034',
    emergencyContact: { name: 'Ritu Bose', relation: 'Wife', phone: '+91 98001 11014' },
    bloodGroup: 'A-',
    chiefComplaint: 'Gum disease treatment',
    allergies: [],
    medicalHistory: 'Hypertension',
    status: 'inactive',
    totalVisits: 5,
  },
  {
    patientNumber: 'DWK-2026-0008',
    name: 'Preethi Rajan',
    dateOfBirth: new Date('1998-03-25'),
    gender: 'female',
    phone: '+91 98001 11015',
    email: 'preethi.rajan@email.com',
    address: 'Flat 201, Lajpat Nagar III, New Delhi 110024',
    emergencyContact: { name: 'Rajan Pillai', relation: 'Father', phone: '+91 98001 11016' },
    bloodGroup: 'O+',
    chiefComplaint: 'Teeth whitening and cleaning',
    allergies: [],
    medicalHistory: 'No significant history',
    status: 'follow_up',
    totalVisits: 2,
  },
  {
    patientNumber: 'DWK-2026-0009',
    name: 'Manish Tiwari',
    dateOfBirth: new Date('1986-08-17'),
    gender: 'male',
    phone: '+91 98001 11017',
    email: 'manish.tiwari@email.com',
    address: 'H-Block, Sector 63, Noida 201301',
    emergencyContact: { name: 'Sunita Tiwari', relation: 'Wife', phone: '+91 98001 11018' },
    bloodGroup: 'B+',
    chiefComplaint: 'Dental implant — upper jaw',
    allergies: ['NSAIDs'],
    medicalHistory: 'No significant history',
    status: 'follow_up',
    totalVisits: 7,
  },
  {
    patientNumber: 'DWK-2026-0010',
    name: 'Sunita Agarwal',
    dateOfBirth: new Date('1962-05-10'),
    gender: 'female',
    phone: '+91 98001 11019',
    email: 'sunita.agarwal@email.com',
    address: 'B-221, Defence Colony, New Delhi 110024',
    emergencyContact: { name: 'Rakesh Agarwal', relation: 'Son', phone: '+91 98001 11020' },
    bloodGroup: 'AB-',
    chiefComplaint: 'Denture repair and root canal',
    allergies: ['Penicillin', 'Codeine'],
    medicalHistory: 'Diabetes, Heart disease',
    status: 'follow_up',
    totalVisits: 12,
  },
  {
    patientNumber: 'DWK-2026-0011',
    name: 'Vijay Desai',
    dateOfBirth: new Date('1980-01-28'),
    gender: 'male',
    phone: '+91 98001 11021',
    email: 'vijay.desai@email.com',
    address: 'Flat 3C, Saket, New Delhi 110017',
    emergencyContact: { name: 'Pooja Desai', relation: 'Wife', phone: '+91 98001 11022' },
    bloodGroup: 'A+',
    chiefComplaint: 'Scaling and polishing',
    allergies: [],
    medicalHistory: 'No significant history',
    status: 'new',
    totalVisits: 1,
  },
  {
    patientNumber: 'DWK-2026-0012',
    name: 'Anita Joshi',
    dateOfBirth: new Date('1995-11-04'),
    gender: 'female',
    phone: '+91 98001 11023',
    email: 'anita.joshi@email.com',
    address: 'Kalkaji Extension, New Delhi 110019',
    emergencyContact: { name: 'Pradeep Joshi', relation: 'Father', phone: '+91 98001 11024' },
    bloodGroup: 'O+',
    chiefComplaint: 'Braces — orthodontic treatment',
    allergies: [],
    medicalHistory: 'No significant history',
    status: 'completed',
    totalVisits: 9,
  },
  {
    patientNumber: 'DWK-2026-0013',
    name: 'Ramesh Chandra',
    dateOfBirth: new Date('1966-03-18'),
    gender: 'male',
    phone: '+91 98001 11025',
    email: 'ramesh.chandra@email.com',
    address: 'Mayur Vihar Phase 1, New Delhi 110091',
    emergencyContact: { name: 'Geeta Chandra', relation: 'Wife', phone: '+91 98001 11026' },
    bloodGroup: 'B+',
    chiefComplaint: 'Multiple extractions and full denture',
    allergies: [],
    medicalHistory: 'Hypertension, COPD',
    status: 'follow_up',
    totalVisits: 6,
  },
  {
    patientNumber: 'DWK-2026-0014',
    name: 'Pooja Reddy',
    dateOfBirth: new Date('2001-09-09'),
    gender: 'female',
    phone: '+91 98001 11027',
    email: 'pooja.reddy@email.com',
    address: 'Hauz Khas Village, New Delhi 110016',
    emergencyContact: { name: 'Suresh Reddy', relation: 'Father', phone: '+91 98001 11028' },
    bloodGroup: 'A+',
    chiefComplaint: 'Sensitivity in front teeth',
    allergies: [],
    medicalHistory: 'No significant history',
    status: 'new',
    totalVisits: 1,
  },
  {
    patientNumber: 'DWK-2026-0015',
    name: 'Gaurav Singh',
    dateOfBirth: new Date('1988-06-22'),
    gender: 'male',
    phone: '+91 98001 11029',
    email: 'gaurav.singh@email.com',
    address: 'Janakpuri, New Delhi 110058',
    emergencyContact: { name: 'Kavita Singh', relation: 'Wife', phone: '+91 98001 11030' },
    bloodGroup: 'O-',
    chiefComplaint: 'Follow-up for root canal treatment',
    allergies: [],
    medicalHistory: 'No significant history',
    status: 'follow_up',
    totalVisits: 3,
  },
];

/**
 * Creates date objects relative to today's date (00:00:00) with specified day offset and hour/minute time.
 */
function makeDateTime(dayOffset, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedDatabase() {
  try {
    // ── 1. Seed Clinic ──────────────────────────────────────────────────────
    let clinic = await Clinic.findOne({});
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'Dwarka Dental Clinic',
        phone: '+91 98765 00000',
        email: 'info@dwarkadental.com',
        address: 'Dwarka, New Delhi',
        settings: {},
      });
      console.log('[Seed] Clinic created');
    }

    // ── 2. Seed Staff Users with bcrypt hashed passwords ───────────────────
    const staffMap = {};
    for (const staff of DEFAULT_STAFF) {
      let existing = await User.findOne({ email: staff.email }).select('+passwordHash');
      if (!existing) {
        const passwordHash = await bcrypt.hash(staff.password, 12);
        existing = await User.create({
          clinicId: clinic._id,
          name: staff.name,
          email: staff.email,
          passwordHash,
          role: staff.role,
          phone: staff.phone,
          specialization: staff.specialization,
          status: 'active',
        });
        console.log(`[Seed] User created: ${staff.email} (${staff.role})`);
      } else {
        const isValid = await bcrypt.compare(staff.password, existing.passwordHash).catch(() => false);
        if (!isValid) {
          existing.passwordHash = await bcrypt.hash(staff.password, 12);
          await existing.save();
          console.log(`[Seed] Password hash refreshed for: ${staff.email}`);
        }
      }
      staffMap[staff.email] = existing;
    }

    // ── 3. Seed Treatment Categories ────────────────────────────────────────
    const catMap = {};
    for (const cat of DEFAULT_TREATMENT_CATEGORIES) {
      const doc = await TreatmentCategory.findOneAndUpdate(
        { code: cat.code },
        { ...cat, clinicId: clinic._id, isActive: true, isDeleted: false },
        { upsert: true, new: true }
      );
      catMap[cat.code] = doc;
    }
    console.log(`[Seed] ${DEFAULT_TREATMENT_CATEGORIES.length} treatment categories updated/seeded`);

    // ── 4. Seed Patients ────────────────────────────────────────────────────
    const doctorList = [
      staffMap['doctor@dwarkadental.com'],
      staffMap['rohan@dwarkadental.com'],
      staffMap['kavita@dwarkadental.com'],
      staffMap['arjun@dwarkadental.com'],
    ].filter(Boolean);

    const patientMap = {};
    for (let i = 0; i < PATIENT_SEED_DATA.length; i++) {
      const pData = PATIENT_SEED_DATA[i];
      const assignedDoctor = doctorList[i % doctorList.length];

      let patient = await Patient.findOne({ clinicId: clinic._id, patientNumber: pData.patientNumber });
      if (!patient) {
        patient = await Patient.create({
          ...pData,
          clinicId: clinic._id,
          assignedDoctorId: assignedDoctor._id,
          registeredAt: new Date(Date.now() - (30 - i) * 86400000),
          isDeleted: false,
        });
        console.log(`[Seed] Patient created: ${patient.name} (${patient.patientNumber})`);
      }
      patientMap[pData.patientNumber] = patient;
    }

    // ── 5. Seed Appointments ─────────────────────────────────────────────────
    // Always refresh appointments if count is 0
    const aptCount = await Appointment.countDocuments({ clinicId: clinic._id, isDeleted: false });
    if (aptCount === 0) {
      console.log('[Seed] Seeding appointment records for TODAY, UPCOMING, and MISSED...');

      const defaultDoctor = staffMap['doctor@dwarkadental.com'] || doctorList[0];
      const rohanDoctor = staffMap['rohan@dwarkadental.com'] || defaultDoctor;
      const kavitaDoctor = staffMap['kavita@dwarkadental.com'] || defaultDoctor;
      const arjunDoctor = staffMap['arjun@dwarkadental.com'] || defaultDoctor;

      const p1 = patientMap['DWK-2026-0001'];
      const p2 = patientMap['DWK-2026-0002'];
      const p3 = patientMap['DWK-2026-0003'];
      const p4 = patientMap['DWK-2026-0004'];
      const p5 = patientMap['DWK-2026-0005'];
      const p6 = patientMap['DWK-2026-0006'];
      const p7 = patientMap['DWK-2026-0007'];
      const p8 = patientMap['DWK-2026-0008'];
      const p9 = patientMap['DWK-2026-0009'];
      const p10 = patientMap['DWK-2026-0010'];
      const p11 = patientMap['DWK-2026-0011'];
      const p12 = patientMap['DWK-2026-0012'];
      const p13 = patientMap['DWK-2026-0013'];
      const p14 = patientMap['DWK-2026-0014'];
      const p15 = patientMap['DWK-2026-0015'];

      const APPOINTMENTS_SEED = [
        // ── TODAY'S APPOINTMENTS (dayOffset: 0) ─────────────────────────────
        {
          num: 'APT-2026-0001',
          patient: p1,
          doctor: defaultDoctor,
          cat: catMap['ORTHO'],
          day: 0, hour: 9, min: 0, duration: 45,
          status: 'confirmed',
          priority: 'normal',
          notes: 'Review braces progress — month 3',
        },
        {
          num: 'APT-2026-0002',
          patient: p8,
          doctor: defaultDoctor,
          cat: catMap['SCALE'],
          day: 0, hour: 10, min: 0, duration: 30,
          status: 'arrived',
          priority: 'normal',
          notes: 'Post-whitening sensitivity check',
        },
        {
          num: 'APT-2026-0003',
          patient: p15,
          doctor: defaultDoctor,
          cat: catMap['RCT'],
          day: 0, hour: 11, min: 0, duration: 60,
          status: 'in_progress',
          priority: 'high',
          notes: 'Post root canal review & dressing',
        },
        {
          num: 'APT-2026-0004',
          patient: p12,
          doctor: defaultDoctor,
          cat: catMap['ORTHO'],
          day: 0, hour: 14, min: 0, duration: 30,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Monthly brace tightening',
        },
        {
          num: 'APT-2026-0005',
          patient: p2,
          doctor: rohanDoctor,
          cat: catMap['RCT'],
          day: 0, hour: 9, min: 30, duration: 60,
          status: 'completed',
          priority: 'high',
          notes: 'Second session of root canal — lower right molar',
        },
        {
          num: 'APT-2026-0006',
          patient: p6,
          doctor: rohanDoctor,
          cat: catMap['FILL'],
          day: 0, hour: 11, min: 0, duration: 45,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Composite filling — upper left premolar',
        },
        {
          num: 'APT-2026-0007',
          patient: p10,
          doctor: rohanDoctor,
          cat: catMap['CROWN'],
          day: 0, hour: 15, min: 0, duration: 60,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Crown measurement & fitting trial',
        },
        {
          num: 'APT-2026-0008',
          patient: p4,
          doctor: arjunDoctor,
          cat: catMap['IMPLANT'],
          day: 0, hour: 10, min: 30, duration: 60,
          status: 'confirmed',
          priority: 'normal',
          notes: 'Post-surgical implant review',
        },
        {
          num: 'APT-2026-0009',
          patient: p9,
          doctor: arjunDoctor,
          cat: catMap['IMPLANT'],
          day: 0, hour: 16, min: 0, duration: 60,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Final implant placement consultation',
        },

        // ── UPCOMING APPOINTMENTS (dayOffset: 1, 2, 3, 5) ────────────────────
        {
          num: 'APT-2026-0010',
          patient: p5,
          doctor: arjunDoctor,
          cat: catMap['EXTRACT'],
          day: 1, hour: 10, min: 0, duration: 30,
          status: 'scheduled',
          priority: 'emergency',
          notes: 'Wisdom tooth extraction procedure',
        },
        {
          num: 'APT-2026-0011',
          patient: p11,
          doctor: kavitaDoctor,
          cat: catMap['SCALE'],
          day: 1, hour: 11, min: 30, duration: 45,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Full mouth cleaning and scaling',
        },
        {
          num: 'APT-2026-0012',
          patient: p14,
          doctor: rohanDoctor,
          cat: catMap['CONSULT'],
          day: 2, hour: 10, min: 30, duration: 30,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Sensitivity assessment in front teeth',
        },
        {
          num: 'APT-2026-0013',
          patient: p2,
          doctor: rohanDoctor,
          cat: catMap['CROWN'],
          day: 2, hour: 14, min: 0, duration: 45,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Post root canal crown fitting review',
        },
        {
          num: 'APT-2026-0014',
          patient: p4,
          doctor: arjunDoctor,
          cat: catMap['IMPLANT'],
          day: 3, hour: 11, min: 0, duration: 45,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Final osseointegration check',
        },
        {
          num: 'APT-2026-0015',
          patient: p13,
          doctor: arjunDoctor,
          cat: catMap['CROWN'],
          day: 5, hour: 15, min: 0, duration: 60,
          status: 'scheduled',
          priority: 'normal',
          notes: 'Full denture trial fitting',
        },

        // ── MISSED APPOINTMENTS (dayOffset: -1, -2) ──────────────────────────
        {
          num: 'APT-2026-0016',
          patient: p3,
          doctor: kavitaDoctor,
          cat: catMap['CONSULT'],
          day: -1, hour: 11, min: 0, duration: 30,
          status: 'missed',
          priority: 'normal',
          notes: 'Patient missed follow-up consultation',
        },
        {
          num: 'APT-2026-0017',
          patient: p7,
          doctor: kavitaDoctor,
          cat: catMap['SCALE'],
          day: -2, hour: 15, min: 30, duration: 45,
          status: 'missed',
          priority: 'normal',
          notes: 'Patient missed gum treatment session',
        },

        // ── PAST COMPLETED APPOINTMENTS (dayOffset: -5, -10) ─────────────────
        {
          num: 'APT-2026-0018',
          patient: p1,
          doctor: defaultDoctor,
          cat: catMap['ORTHO'],
          day: -10, hour: 10, min: 30, duration: 45,
          status: 'completed',
          priority: 'normal',
          notes: 'Braces monthly adjustment complete',
        },
        {
          num: 'APT-2026-0019',
          patient: p2,
          doctor: rohanDoctor,
          cat: catMap['RCT'],
          day: -5, hour: 9, min: 30, duration: 60,
          status: 'completed',
          priority: 'normal',
          notes: 'First session of root canal — lower right molar',
        },
      ];

      for (const apt of APPOINTMENTS_SEED) {
        if (!apt.patient || !apt.doctor) continue;

        const startAt = makeDateTime(apt.day, apt.hour, apt.min);
        const endAt = new Date(startAt.getTime() + (apt.duration || 30) * 60000);

        await Appointment.create({
          clinicId: clinic._id,
          appointmentNumber: apt.num,
          patientId: apt.patient._id,
          doctorId: apt.doctor._id,
          treatmentCategoryId: apt.cat ? apt.cat._id : undefined,
          startAt,
          endAt,
          durationMinutes: apt.duration || 30,
          status: apt.status,
          priority: apt.priority || 'normal',
          notes: apt.notes || '',
          createdById: staffMap['receptionist@dwarkadental.com']?._id || apt.doctor._id,
          isDeleted: false,
        });
      }
      console.log(`[Seed] ${APPOINTMENTS_SEED.length} appointments seeded successfully!`);
    } else {
      console.log(`[Seed] Database already has ${aptCount} appointments.`);
    }

    console.log('[Seed] Database seeding complete!');
  } catch (err) {
    console.error('[Seed] Seeding error:', err);
  }
}

module.exports = { seedDatabase };
