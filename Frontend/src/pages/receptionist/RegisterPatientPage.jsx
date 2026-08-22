import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { savePatientThunk, addToast } from '../../app/store';
import Input, { Textarea } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { today } from '../../utils/formatters';
import { api } from '../../utils/api';

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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', code: '', defaultDurationMinutes: 30, defaultFollowUpDays: 30 });
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    let localDocs = [];
    try {
      const raw = localStorage.getItem('ddc_doctors_v1');
      if (raw) localDocs = JSON.parse(raw);
    } catch (_) {}

    api.getDoctors().then(res => {
      const apiDocs = res.data || [];
      const map = new Map();
      const defaults = [
        { id: 'doc-1', name: 'Dr. Bhagwan Rakh', specialization: 'Orthodontics' },
        { id: 'doc-2', name: 'Dr. H M Sanap', specialization: 'Endodontics' },
      ];
      defaults.forEach(d => map.set(d.name.toLowerCase(), d));
      localDocs.forEach(d => map.set(d.name.toLowerCase(), d));
      apiDocs.forEach(d => map.set(d.name.toLowerCase(), d));
      setDoctors(Array.from(map.values()));
    }).catch(() => {
      const map = new Map();
      const defaults = [
        { id: 'doc-1', name: 'Dr. Bhagwan Rakh', specialization: 'Orthodontics' },
        { id: 'doc-2', name: 'Dr. H M Sanap', specialization: 'Endodontics' },
      ];
      defaults.forEach(d => map.set(d.name.toLowerCase(), d));
      localDocs.forEach(d => map.set(d.name.toLowerCase(), d));
      setDoctors(Array.from(map.values()));
    });
    fetchCategories();
  }, []);

  function fetchCategories() {
    api.getCategories({ status: 'active' }).then(res => setCategories(res.data || [])).catch(() => {});
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
    }
    if (s === 2) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required.';
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
      treatmentCategoryId: form.treatmentCategoryId,
      notes: form.notes,
    };

    try {
      const response = await dispatch(savePatientThunk(newPatientData));
      if (response && response.success) {
        // Sync to local storage cards so it shows on Dashboard and stays saved
        try {
          const raw = localStorage.getItem('ddc_patient_cards_v2');
          const existing = raw ? JSON.parse(raw) : [];
          const newCard = {
            id: response.patient?.id || `apt-${Date.now()}`,
            patientName: form.name,
            patientPhone: form.phone,
            age: parseInt(form.age) || 30,
            gender: form.gender || 'Male',
            doctorName: 'Dr. Sarah Smith',
            date: form.appointmentDate || new Date().toISOString().split('T')[0],
            categoryName: 'Orthodontic',
            status: 'Upcoming',
            totalFee: 15000,
            amountPaid: 3000,
            amountDue: 12000,
            paymentStatus: 'Pending',
            nextAppointmentDays: 28,
            paymentHistory: [
              { id: `pay-${Date.now()}`, receiptNo: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`, date: new Date().toISOString().split('T')[0], mode: 'UPI', amount: 3000, notes: 'Registration Deposit' }
            ]
          };
          localStorage.setItem('ddc_patient_cards_v2', JSON.stringify([newCard, ...existing]));
        } catch (err) {
          console.error('LocalStorage sync error', err);
        }

        dispatch(addToast({
          type: 'success',
          title: 'Patient Registered',
          message: `${form.name} (${response.patient.patientId}) has been successfully registered.`,
        }));
        setDone(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">Patient Registered Successfully!</h2>
        <p className="text-[var(--color-text-muted)] mb-6">The patient record has been created and an appointment has been scheduled.</p>
        <div className="flex gap-3">
          <button onClick={() => { setDone(false); setStep(1); setForm(initialForm); }} className="text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer">
            Register Another
          </button>
          <button onClick={() => navigate('/receptionist/patients')} className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] cursor-pointer">
            View All Patients
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
              <Input label="Email Address" id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="patient@email.com" />
            </div>
            <Textarea label="Address" id="reg-address" required value={form.address} onChange={e => update('address', e.target.value)} error={errors.address} placeholder="Full address…" rows={2} />

            <div className="pt-2 border-t border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">Emergency Contact <span className="text-[var(--color-text-muted)] font-normal">(optional)</span></p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Name" id="ec-name" value={form.emergencyName} onChange={e => update('emergencyName', e.target.value)} placeholder="Contact name" />
                <Input label="Relation" id="ec-rel" value={form.emergencyRelation} onChange={e => update('emergencyRelation', e.target.value)} placeholder="e.g., Father" />
                <Input label="Phone" id="ec-phone" type="tel" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} placeholder="+91…" />
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
                      className="text-xs text-[var(--color-primary-600)] hover:underline font-medium flex items-center gap-0.5"
                    >
                      + Add Category
                    </button>
                  </div>
                  <Select
                    id="reg-category"
                    options={categories.map(c => ({ value: c.id, label: `${c.name} (${c.defaultDurationMinutes} min)` }))}
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
