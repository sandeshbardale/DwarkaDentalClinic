import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Calendar, Users } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { savePatientThunk, addToast } from '../../app/store';
import Input, { Textarea } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { today } from '../../utils/formatters';
import { api } from '../../utils/api';
import { normalizeCategoryName } from '../../components/dashboard/CategoryBoardDashboard';

const STEPS = [
  { id: 1, label: 'Personal Information' },
  { id: 2, label: 'Contact & Emergency' },
  { id: 3, label: 'Medical & Appointment' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];



const initialForm = {
  // Step 1
  name: '', dob: '', age: '', gender: '', bloodGroup: '',
  // Step 2
  phone: '', email: '', address: '',
  emergencyName: '', emergencyRelation: '', emergencyPhone: '',
  // Step 3
  chiefComplaint: '', allergies: 'None', medicalHistory: 'No significant medical history',
  assignedDoctorId: '', appointmentDate: today(), appointmentTime: '', treatmentCategoryId: '',
  notes: '',
};

export default function RegisterPatientPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [registeredResult, setRegisteredResult] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', code: '', defaultDurationMinutes: 30, defaultFollowUpDays: 30 });
  const [catSaving, setCatSaving] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [categories, setCategories] = useState([]);

  const DEFAULT_CATEGORIES = [
    { id: 'CONSULT', name: 'General Consultation', defaultDurationMinutes: 30 },
    { id: 'ORTHO', name: 'Orthodontics', defaultDurationMinutes: 45 },
    { id: 'RCT', name: 'Root Canal Treatment', defaultDurationMinutes: 60 },
    { id: 'EXTRACT', name: 'Tooth Extraction', defaultDurationMinutes: 30 },
    { id: 'FILL', name: 'Cavity Filling', defaultDurationMinutes: 45 },
    { id: 'SCALE', name: 'Cleaning & Scaling', defaultDurationMinutes: 45 },
    { id: 'IMPLANT', name: 'Dental Implant', defaultDurationMinutes: 90 },
    { id: 'CROWN', name: 'Prosthodontics & Crown', defaultDurationMinutes: 60 },
    { id: 'EMERG', name: 'Emergency Dental', defaultDurationMinutes: 30 },
    { id: 'XRAY', name: 'X-Ray & Diagnosis', defaultDurationMinutes: 20 },
  ];

  useEffect(() => {
    let localDocs = [];
    try {
      const raw = localStorage.getItem('ddc_doctors_v1');
      if (raw) localDocs = JSON.parse(raw);
    } catch (_) {}

    const defaults = [
      { id: 'doc-1', name: 'Dr. Bhagwan Rakh', specialization: 'Orthodontics' },
      { id: 'doc-2', name: 'Dr. H M Sanap', specialization: 'Endodontics & RCT' },
      { id: 'doc-3', name: 'Dr. Neha Sharma', specialization: 'General Dentistry' },
      { id: 'doc-4', name: 'Dr. Rohan Mehta', specialization: 'Endodontics & RCT' },
      { id: 'doc-5', name: 'Dr. Kavita Iyer', specialization: 'Periodontics' },
      { id: 'doc-6', name: 'Dr. Arjun Kapoor', specialization: 'Implantology & Prosthodontics' },
    ];

    api.getDoctors().then(res => {
      const apiDocs = res.data || [];
      const map = new Map();
      defaults.forEach(d => map.set(d.name.toLowerCase(), d));
      localDocs.forEach(d => map.set(d.name.toLowerCase(), d));
      apiDocs.forEach(d => map.set(d.name.toLowerCase(), d));
      setDoctors(Array.from(map.values()));
    }).catch(() => {
      const map = new Map();
      defaults.forEach(d => map.set(d.name.toLowerCase(), d));
      localDocs.forEach(d => map.set(d.name.toLowerCase(), d));
      setDoctors(Array.from(map.values()));
    });

    fetchCategories();
  }, []);

  function fetchCategories() {
    const queryCategory = searchParams.get('category') || searchParams.get('categoryId') || '';

    api.getCategories({ status: 'active' }).then(res => {
      const apiCats = res.data || [];
      const map = new Map();
      DEFAULT_CATEGORIES.forEach(c => {
        const norm = normalizeCategoryName(c.name);
        map.set(norm.toLowerCase(), { ...c, id: c.id || c._id, name: norm });
      });
      apiCats.forEach(c => {
        const norm = normalizeCategoryName(c.name);
        map.set(norm.toLowerCase(), { ...c, id: c.id || c._id, name: norm });
      });
      const list = Array.from(map.values());
      setCategories(list);

      if (queryCategory) {
        const normQ = normalizeCategoryName(queryCategory).toLowerCase();
        const matched = list.find(c =>
          String(c.id || c._id) === queryCategory ||
          normalizeCategoryName(c.name).toLowerCase() === normQ ||
          (c.code && c.code.toLowerCase() === normQ) ||
          (c.code && normQ.includes(c.code.toLowerCase()))
        );
        if (matched) {
          const selectedId = matched.id || matched._id;
          update('treatmentCategoryId', selectedId);
          // Auto assign doctor
          const normCatName = normalizeCategoryName(matched.name).toLowerCase();
          const matchedDoc = doctors.find(d => {
            const docSpec = normalizeCategoryName(d.specialization || '').toLowerCase();
            return docSpec === normCatName || docSpec.includes(normCatName) || normCatName.includes(docSpec);
          });
          if (matchedDoc) {
            update('assignedDoctorId', matchedDoc.id || matchedDoc._id);
          }
        }
      }
    }).catch(() => {
      const list = DEFAULT_CATEGORIES.map(c => ({ ...c, id: c.id || c._id, name: normalizeCategoryName(c.name) }));
      setCategories(list);

      if (queryCategory) {
        const normQ = normalizeCategoryName(queryCategory).toLowerCase();
        const matched = list.find(c =>
          String(c.id || c._id) === queryCategory ||
          normalizeCategoryName(c.name).toLowerCase() === normQ ||
          (c.code && c.code.toLowerCase() === normQ) ||
          (c.code && normQ.includes(c.code.toLowerCase()))
        );
        if (matched) {
          const selectedId = matched.id || matched._id;
          update('treatmentCategoryId', selectedId);
        }
      }
    });
  }

  async function handleCreateCategory() {
    if (!newCat.name.trim() || !newCat.code.trim()) return;
    setCatSaving(true);
    try {
      const created = await api.createCategory({
        name: newCat.name.trim(),
        code: newCat.code.trim().toUpperCase(),
        defaultDurationMinutes: Number(newCat.defaultDurationMinutes) || 30,
        defaultFollowUpDays: Number(newCat.defaultFollowUpDays) || 30,
        isActive: true,
      });
      const catObj = created.data;
      await fetchCategories();
      if (catObj && catObj.id) {
        update('treatmentCategoryId', catObj.id);
      }
      setShowAddCategoryModal(false);
      setNewCat({ name: '', code: '', defaultDurationMinutes: 30, defaultFollowUpDays: 30 });
    } catch (err) {
      alert(err.message);
    } finally {
      setCatSaving(false);
    }
  }

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  function validateStep(s) {
    const errs = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name = 'Full name is required.';
      if (!form.gender) errs.gender = 'Gender is required.';
      if (!form.age) errs.age = 'Age is required.';
      else if (isNaN(form.age) || Number(form.age) <= 0 || Number(form.age) > 120) errs.age = 'Please enter a valid age (1-120).';
    }
    if (s === 2) {
      const cleanPhone = (form.phone || '').replace(/\D/g, '');
      if (!form.phone.trim()) {
        errs.phone = 'Mobile number is required.';
      } else if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        errs.phone = 'Please enter a valid 10-digit mobile number (e.g. 9876543210).';
      }

      if (form.email && form.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) {
          errs.email = 'Please enter a valid email address (e.g. name@domain.com).';
        }
      }

      if (form.emergencyPhone && form.emergencyPhone.trim()) {
        const cleanEmPhone = form.emergencyPhone.replace(/\D/g, '');
        if (cleanEmPhone.length < 10 || cleanEmPhone.length > 13) {
          errs.emergencyPhone = 'Please enter a valid 10-digit emergency mobile number.';
        }
      }

      if (!form.address.trim()) errs.address = 'Address is required.';
    }
    if (s === 3) {
      if (!form.chiefComplaint.trim()) errs.chiefComplaint = 'Chief complaint is required.';
      if (!form.assignedDoctorId) errs.assignedDoctorId = 'Please assign a doctor.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep(s => s + 1);
  }

  function prev() { setStep(s => s - 1); }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setLoading(true);

    const selectedDoc = doctors.find(d =>
      String(d.id || d._id) === String(form.assignedDoctorId)
    );
    const selectedCat = categories.find(c =>
      String(c.id || c._id) === String(form.treatmentCategoryId) ||
      normalizeCategoryName(c.name).toLowerCase() === normalizeCategoryName(String(form.treatmentCategoryId)).toLowerCase() ||
      (c.code && c.code.toLowerCase() === String(form.treatmentCategoryId).toLowerCase())
    );
    const catName = normalizeCategoryName(selectedCat?.name || form.treatmentCategoryId || 'General Consultation');
    const catId = selectedCat?.id || selectedCat?._id || form.treatmentCategoryId;
    const docName = selectedDoc?.name || 'Dr. Bhagwan Rakh';

    const newPatientData = {
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      dob: form.dob,
      phone: form.phone,
      email: form.email,
      address: form.address,
      emergencyContact: {
        name: form.emergencyName,
        relation: form.emergencyRelation,
        phone: form.emergencyPhone,
      },
      bloodGroup: form.bloodGroup,
      assignedDoctorId: form.assignedDoctorId,
      chiefComplaint: form.chiefComplaint,
      allergies: form.allergies,
      medicalHistory: form.medicalHistory,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      treatmentCategoryId: catId,
      treatmentCategoryName: catName,
      categoryName: catName,
      notes: form.notes,
    };

    try {
      let patientResult = null;
      let aptResult = null;
      let isBackendSaved = false;

      try {
        const response = await dispatch(savePatientThunk(newPatientData));
        patientResult = response?.data?.patient || response?.patient || null;
        aptResult = response?.data?.appointment || null;
        if (patientResult) isBackendSaved = true;
      } catch (backendErr) {
        console.warn('Backend service offline or unreachable, registering locally:', backendErr.message);
      }

      // If backend is offline or returned an error, fallback to local patient record
      if (!patientResult) {
        const fallbackNum = `DWK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        patientResult = {
          id: `pat-${Date.now()}`,
          _id: `pat-${Date.now()}`,
          patientNumber: fallbackNum,
          patientId: fallbackNum,
          name: form.name,
          phone: form.phone,
          age: parseInt(form.age) || 30,
          gender: form.gender,
          email: form.email,
          address: form.address,
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
      }

      if (patientResult) {
        const todayIso = new Date().toISOString().split('T')[0];
        const cardDate = form.appointmentDate || todayIso;
        const cardStatus = cardDate === todayIso ? 'Today' : (cardDate < todayIso ? 'Missed' : 'Upcoming');

        // Sync to localStorage so dashboard, patients page, appointments page all see it instantly
        try {
          const raw = localStorage.getItem('ddc_patient_cards_v2');
          const existing = raw ? JSON.parse(raw) : [];

          // Remove any old card with same phone or fake ID so we don't get duplicates
          const deduped = existing.filter(c =>
            (c.patientPhone || '').replace(/\D/g, '') !== form.phone.replace(/\D/g, '')
          );

          const newCard = {
            id: patientResult.id || patientResult._id || `pat-${Date.now()}`,
            patientNumber: patientResult.patientNumber || patientResult.patientId || '',
            patientName: form.name,
            patientPhone: form.phone,
            age: parseInt(form.age) || 30,
            gender: form.gender ? (form.gender.charAt(0).toUpperCase() + form.gender.slice(1).toLowerCase()) : 'Male',
            bloodGroup: form.bloodGroup || 'O+',
            email: form.email || '',
            address: form.address || '',
            emergencyContact: {
              name: form.emergencyName || '',
              relation: form.emergencyRelation || 'Family',
              phone: form.emergencyPhone || ''
            },
            chiefComplaint: form.chiefComplaint || 'Dental consultation',
            allergies: form.allergies || 'None',
            medicalHistory: form.medicalHistory || 'None',
            doctorName: docName,
            date: cardDate,
            categoryName: catName,
            treatmentCategoryId: catId,
            treatmentCategoryName: catName,
            status: cardStatus,
            totalFee: 15000,
            amountPaid: 3000,
            amountDue: 12000,
            paymentStatus: 'Pending',
            nextAppointmentDays: 28,
            createdAt: new Date().toISOString(),
            paymentHistory: [
              {
                id: `pay-${Date.now()}`,
                receiptNo: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
                date: todayIso,
                mode: 'UPI',
                amount: 3000,
                notes: 'Registration Deposit'
              }
            ]
          };
          localStorage.setItem('ddc_patient_cards_v2', JSON.stringify([newCard, ...deduped]));
          try {
            const rawV1 = localStorage.getItem('ddc_patient_cards_v1');
            const v1Arr = rawV1 ? JSON.parse(rawV1) : [];
            const v1Deduped = v1Arr.filter(c => (c.patientPhone || '').replace(/\D/g, '') !== form.phone.replace(/\D/g, ''));
            localStorage.setItem('ddc_patient_cards_v1', JSON.stringify([newCard, ...v1Deduped]));
          } catch (_) {}

          // Ensure new patient is never marked as deleted in ddc_deleted_patients
          try {
            const rawDel = localStorage.getItem('ddc_deleted_patients');
            if (rawDel) {
              const delArr = JSON.parse(rawDel);
              const pIdStr = String(patientResult.id || patientResult._id || '').toLowerCase();
              const pPhoneClean = form.phone.replace(/\D/g, '');
              const cleaned = Array.isArray(delArr) ? delArr.filter(x => {
                const str = String(x).toLowerCase();
                if (pIdStr && str === pIdStr) return false;
                if (str.startsWith('phone:') && str === `phone:${pPhoneClean}`) return false;
                return true;
              }) : [];
              localStorage.setItem('ddc_deleted_patients', JSON.stringify(cleaned));
            }
          } catch (_) {}

          // Broadcast to all open pages so they refresh immediately (no manual reload needed)
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('ddc_patient_data_updated', {
            detail: {
              action: 'register',
              card: newCard,
              patient: patientResult,
              appointment: aptResult || null
            }
          }));
        } catch (err) {
          console.error('LocalStorage sync error', err);
        }

        dispatch(addToast({
          type: isBackendSaved ? 'success' : 'info',
          title: isBackendSaved ? 'Patient Registered' : 'Patient Registered (Offline Mode)',
          message: isBackendSaved
            ? `${form.name} (${patientResult.patientNumber || patientResult.patientId || 'New'}) has been successfully registered.`
            : `${form.name} (${patientResult.patientNumber || patientResult.patientId}) registered locally. Start backend to persist to MongoDB.`,
        }));
        // Store appointment info so success screen can show right link
        const aptDate = form.appointmentDate || new Date().toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const aptView = aptDate > todayStr ? 'upcoming' : 'today';
        setRegisteredResult({
          patient: patientResult,
          appointment: aptResult || null,
          aptView,
          aptDate,
        });
        setDone(true);
      } else {
        dispatch(addToast({ type: 'error', title: 'Registration Failed', message: 'Could not register patient. Please try again.' }));
      }
    } catch (e) {
      console.error('Registration error:', e);
      dispatch(addToast({ type: 'error', title: 'Error', message: e.message || 'Registration failed.' }));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const goToAppointments = () => {
      // Re-fire event so any mounted Appointments page refreshes immediately
      window.dispatchEvent(new CustomEvent('ddc_patient_data_updated'));
      const view = registeredResult?.aptView || 'today';
      navigate(`/receptionist/appointments?view=${view}`);
    };

    const goToPatients = () => {
      window.dispatchEvent(new CustomEvent('ddc_patient_data_updated'));
      navigate('/receptionist/patients');
    };

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 shadow-md">
          <CheckCircle size={38} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">Patient Registered Successfully!</h2>
        <p className="text-[var(--color-text-muted)] mb-2">The patient record has been created and an appointment has been scheduled.</p>

        {/* Appointment quick-info */}
        {registeredResult?.patient && (
          <div className="mt-3 mb-6 card p-4 text-left w-full max-w-sm space-y-2 border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <Calendar size={15} />
              Appointment Details
            </div>
            <div className="text-sm text-[var(--color-text)]">
              <span className="font-medium">{registeredResult.patient.name}</span>
              {registeredResult.patient.patientNumber && (
                <span className="ml-2 text-xs text-[var(--color-text-muted)]">({registeredResult.patient.patientNumber})</span>
              )}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] flex gap-3">
              <span>📅 {registeredResult.aptDate}</span>
              <span className={`font-semibold capitalize ${
                registeredResult.aptView === 'today' ? 'text-amber-600' : 'text-blue-600'
              }`}>{registeredResult.aptView === 'today' ? '🟡 Today' : '🔵 Upcoming'}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => { setDone(false); setStep(1); setForm(initialForm); setRegisteredResult(null); }}
            className="text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer"
          >
            Register Another
          </button>
          <button
            onClick={goToAppointments}
            className="text-sm px-5 h-9 rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer flex items-center gap-1.5 font-medium shadow-sm"
          >
            <Calendar size={14} /> View in Appointments
          </button>
          <button
            onClick={goToPatients}
            className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] cursor-pointer flex items-center gap-1.5"
          >
            <Users size={14} /> View All Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/receptionist/patients')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Register New Patient</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-[var(--color-primary-500)] text-white' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]'}`}>
              {step > s.id ? '✓' : s.id}
            </div>
            <span className={`text-xs hidden sm:block ${step === s.id ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text-muted)]'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ml-2 ${step > s.id ? 'bg-emerald-400' : 'bg-[var(--color-border)]'}`} />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="card p-6">
        {/* Step 1 — Personal */}
        {step === 1 && (
          <div className="space-y-4">
            <Input label="Full Name" id="reg-name" required value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} placeholder="e.g., Aarav Patil" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Age" id="reg-age" type="number" required min={1} max={120} value={form.age} onChange={e => update('age', e.target.value)} error={errors.age} placeholder="28" />
              <Input label="Date of Birth" id="reg-dob" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Gender" id="reg-gender" required options={GENDER_OPTIONS} placeholder="Select gender" value={form.gender} onChange={e => update('gender', e.target.value)} error={errors.gender} />
              <Select label="Blood Group" id="reg-blood" options={BLOOD_GROUPS} placeholder="Select" value={form.bloodGroup} onChange={e => update('bloodGroup', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2 — Contact */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone Number" id="reg-phone" type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} error={errors.phone} placeholder="+91 98001 XXXXX" />
              <Input label="Email Address" id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} error={errors.email} placeholder="patient@email.com" />
            </div>
            <Textarea label="Address" id="reg-address" required value={form.address} onChange={e => update('address', e.target.value)} error={errors.address} placeholder="Full address…" rows={2} />

            <div className="pt-2 border-t border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">Emergency Contact <span className="text-[var(--color-text-muted)] font-normal">(optional)</span></p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Name" id="ec-name" value={form.emergencyName} onChange={e => update('emergencyName', e.target.value)} placeholder="Contact name" />
                <Input label="Relation" id="ec-rel" value={form.emergencyRelation} onChange={e => update('emergencyRelation', e.target.value)} placeholder="e.g., Father" />
                <Input label="Phone" id="ec-phone" type="tel" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} error={errors.emergencyPhone} placeholder="+91…" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Medical + Appointment */}
        {step === 3 && (
          <div className="space-y-4">
            <Textarea label="Chief Complaint / Reason for Visit" id="reg-complaint" required value={form.chiefComplaint} onChange={e => update('chiefComplaint', e.target.value)} error={errors.chiefComplaint} rows={2} placeholder="Why is the patient visiting?" />
            <Input label="Known Allergies" id="reg-allergies" value={form.allergies} onChange={e => update('allergies', e.target.value)} placeholder="None / Penicillin / etc." />
            <Textarea label="Medical History" id="reg-medhistory" value={form.medicalHistory} onChange={e => update('medicalHistory', e.target.value)} rows={2} placeholder="Significant medical conditions…" />

            <div className="pt-3 border-t border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Appointment Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Assign Doctor" id="reg-doctor" required
                  options={doctors.map(d => ({ value: d.id, label: `${d.name}${d.specialization ? ' — ' + d.specialization : ''}` }))}
                  placeholder={doctors.length === 0 ? 'Loading doctors…' : 'Select doctor'}
                  value={form.assignedDoctorId}
                  onChange={e => update('assignedDoctorId', e.target.value)}
                  error={errors.assignedDoctorId}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reg-category" className="text-xs font-medium text-[var(--color-text-muted)]">Treatment Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-xs text-[var(--color-primary-600)] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      + Add Category
                    </button>
                  </div>
                  <Select
                    id="reg-category"
                    options={categories.map(c => ({ value: c.id, label: `${c.name} (${c.defaultDurationMinutes || 30} min)` }))}
                    placeholder={categories.length === 0 ? 'Loading categories…' : 'Select category'}
                    value={form.treatmentCategoryId}
                    onChange={e => update('treatmentCategoryId', e.target.value)}
                  />
                </div>
                <Input label="Appointment Date" id="reg-apt-date" type="date" value={form.appointmentDate} onChange={e => update('appointmentDate', e.target.value)} min={today()} />
                <Input label="Appointment Time" id="reg-apt-time" type="time" value={form.appointmentTime} onChange={e => update('appointmentTime', e.target.value)} />
              </div>
            </div>
            <Textarea label="Additional Notes" id="reg-notes" value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} placeholder="Any additional information…" />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={step === 1 ? () => navigate('/receptionist/patients') : prev}
          className="flex items-center gap-2 text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors"
        >
          <ChevronLeft size={15} /> {step === 1 ? 'Cancel' : 'Previous'}
        </button>

        {step < STEPS.length ? (
          <button onClick={next} className="flex items-center gap-2 text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] cursor-pointer transition-colors font-medium">
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 text-sm px-5 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] disabled:opacity-60 cursor-pointer transition-colors font-medium">
            {loading ? 'Registering…' : <><CheckCircle size={15} /> Register Patient</>}
          </button>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">New Treatment Category</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Orthodontics, Prosthodontics"
                  value={newCat.name}
                  onChange={e => setNewCat(c => ({ ...c, name: e.target.value }))}
                  className="input mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Category Code *</label>
                <input
                  type="text"
                  placeholder="e.g. ORTHO, PROSTHO"
                  value={newCat.code}
                  onChange={e => setNewCat(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                  className="input mt-1 w-full font-mono uppercase"
                  maxLength={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    value={newCat.defaultDurationMinutes}
                    onChange={e => setNewCat(c => ({ ...c, defaultDurationMinutes: e.target.value }))}
                    className="input mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">Follow-up (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCat.defaultFollowUpDays}
                    onChange={e => setNewCat(c => ({ ...c, defaultFollowUpDays: e.target.value }))}
                    className="input mt-1 w-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                disabled={catSaving}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={catSaving || !newCat.name.trim() || !newCat.code.trim()}
                className="btn btn-primary btn-sm"
              >
                {catSaving ? 'Saving…' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
