import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, CheckCircle, Pill, Calendar, FileText, ClipboardList, Phone, MapPin, Sparkles, Scissors, Image as ImageIcon } from 'lucide-react';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime, generateId, today } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { useDispatch } from 'react-redux';
import { addToast } from '../../app/store';
import { api } from '../../utils/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'history', label: 'Visit History', icon: ClipboardList },
  { id: 'record', label: 'New Clinical Record', icon: Plus },
  { id: 'ai', label: 'AI Cavity Detection', icon: Sparkles },
];

export default function PatientDetailPage({ basePath = '/doctor' }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // AI X-Ray states
  const [xrayFile, setXrayFile] = useState(null);
  const [xrayPreview, setXrayPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  // Interactive Canvas Crop box states (percentage of parent container dimensions)
  const [cropBox, setCropBox] = useState({ x: 25, y: 25, width: 50, height: 50 });
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, boxX: 0, boxY: 0 });

  // Clinical record form state
  const [form, setForm] = useState({
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    clinicalNotes: '',
    followUpDate: '',
    followUpInstructions: '',
    prescriptions: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
  });

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const pats = await api.getPatients();
      const found = pats.find(p => p.id === id);
      setPatient(found || null);

      if (found) {
        const clns = await api.getClinicalRecords(id);
        setRecords(clns);
        
        // Populate default complaint
        setForm(f => ({ ...f, chiefComplaint: found.chiefComplaint || '' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ type: 'error', title: 'Data Load Error', message: 'Failed to retrieve patient medical profile.' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updatePrescription(index, field, value) {
    setForm(prev => {
      const rxs = [...prev.prescriptions];
      rxs[index] = { ...rxs[index], [field]: value };
      return { ...prev, prescriptions: rxs };
    });
  }

  function addPrescription() {
    setForm(prev => ({ ...prev, prescriptions: [...prev.prescriptions, { medicine: '', dosage: '', duration: '', instructions: '' }] }));
  }

  function removePrescription(index) {
    setForm(prev => ({ ...prev, prescriptions: prev.prescriptions.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    if (!form.diagnosis || !form.treatment) {
      dispatch(addToast({ type: 'error', title: 'Required fields missing', message: 'Diagnosis and treatment are required.' }));
      return;
    }
    setSaving(true);
    try {
      const recordData = {
        patientId: id,
        appointmentId: null, // General clinical visit record
        doctorId: 'DOC-001', // Predefined logged-in doctor
        chiefComplaint: form.chiefComplaint,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        clinicalNotes: form.clinicalNotes,
        followUpDate: form.followUpDate || null,
        followUpInstructions: form.followUpInstructions,
        prescription: form.prescriptions.filter(rx => rx.medicine),
      };

      const response = await api.addClinicalRecord(recordData);
      if (response.success) {
        setSaved(true);
        dispatch(addToast({ type: 'success', title: 'Record Saved', message: `Clinical record successfully saved for patient.` }));
        // Reset form
        setForm({
          chiefComplaint: patient?.chiefComplaint || '',
          diagnosis: '',
          treatment: '',
          clinicalNotes: '',
          followUpDate: '',
          followUpInstructions: '',
          prescriptions: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
        });
        // Reload clinical records
        const clns = await api.getClinicalRecords(id);
        setRecords(clns);
        setActiveTab('history');
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Save Failed', message: err.message }));
    } finally {
      setSaving(false);
    }
  }

  // ─── AI X-RAY UPLOADER & CROP LOGIC ─────────────────────────────────────────
  const handleXrayChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setXrayFile(file);
      setXrayPreview(URL.createObjectURL(file));
      setAiReport(null);
    }
  };

  // Draggable crop overlay mouse events
  const startDrag = (e) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const deltaX = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.current.y) / rect.height) * 100;

    let newX = Math.max(0, Math.min(100 - cropBox.width, dragStart.current.boxX + deltaX));
    let newY = Math.max(0, Math.min(100 - cropBox.height, dragStart.current.boxY + deltaY));

    setCropBox(prev => ({
      ...prev,
      x: Math.round(newX),
      y: Math.round(newY)
    }));
  };

  const stopDrag = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  // Perform tooth crop using Canvas context draw and dispatch to AI
  const handleCropAndAnalyze = () => {
    const img = document.getElementById('xray-img-source');
    if (!img) return;

    setAnalyzing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Natural sizes
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    const cropX = (cropBox.x / 100) * nw;
    const cropY = (cropBox.y / 100) * nh;
    const cropW = (cropBox.width / 100) * nw;
    const cropH = (cropBox.height / 100) * nh;

    canvas.width = cropW;
    canvas.height = cropH;

    // Draw the cropped portion
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setAnalyzing(false);
        return;
      }
      try {
        const file = new File([blob], `crop-${Date.now()}.png`, { type: 'image/png' });
        const response = await api.uploadXray(id, file);
        if (response.success) {
          setAiReport(response.report);
          dispatch(addToast({
            type: 'success',
            title: 'AI Analysis Complete',
            message: `Result: ${response.report.result} (Confidence: ${(response.report.confidence * 100).toFixed(0)}%)`
          }));
        }
      } catch (err) {
        dispatch(addToast({ type: 'error', title: 'Analysis Failed', message: err.message }));
      } finally {
        setAnalyzing(false);
      }
    }, 'image/png');
  };

  // Apply suggestion directly to diagnosis form ("AI assist, Doctor decides")
  const applyAiSuggestion = () => {
    if (!aiReport) return;
    setForm(f => ({
      ...f,
      diagnosis: `AI Analysis detected: ${aiReport.result} (${(aiReport.confidence * 100).toFixed(0)}% confidence).`,
      treatment: aiReport.suggestions === 'No treatment needed' ? 'Regular scaling & routine check-ups recommended.' : `${aiReport.suggestions} procedure required.`,
    }));
    setActiveTab('record');
    dispatch(addToast({ type: 'success', title: 'Suggestion Applied', message: 'Form populated with AI recommendations.' }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-8 h-8 animate-spin text-[var(--color-primary-500)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <p className="text-sm text-[var(--color-text-muted)]">Loading clinical files...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <EmptyState title="Patient not found" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Link to={`${basePath}/patients`} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
        <ArrowLeft size={15} /> Back to Patients
      </Link>

      {/* Patient header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={patient.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">{patient.name}</h1>
              <StatusBadge status={patient.status} />
            </div>
            <p className="text-sm text-[var(--color-text-muted)] font-mono mb-3">{patient.patientId}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-[var(--color-text-subtle)]">Age / Gender</p><p className="font-medium">{patient.age} · {patient.gender}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Blood Group</p><p className="font-medium">{patient.bloodGroup}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Allergies</p><p className={`font-medium ${patient.allergies !== 'None' ? 'text-amber-600 font-semibold' : ''}`}>{patient.allergies}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Total Visits</p><p className="font-medium">{patient.totalVisits}</p></div>
            </div>
            {patient.medicalHistory && patient.medicalHistory !== 'No significant medical history' && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg mt-3 border border-red-100 inline-block font-semibold">
                ⚠️ Medical History: {patient.medicalHistory}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'border-[var(--color-primary-500)] text-[var(--color-primary-500)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Contact</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]"><Phone size={13} />{patient.phone}</div>
              <div className="flex items-start gap-2 text-[var(--color-text-muted)]"><MapPin size={13} className="mt-0.5" />{patient.address}</div>
            </div>
          </div>
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Clinical Summary</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-xs text-[var(--color-text-subtle)]">Chief Complaint: </span>{patient.chiefComplaint}</div>
              <div><span className="text-xs text-[var(--color-text-subtle)]">Last Visit: </span>{formatDate(patient.lastVisit)}</div>
              <div><span className="text-xs text-[var(--color-text-subtle)]">Next Follow-up: </span>{formatDate(patient.nextFollowUp)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Visit history tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No clinical records" description="Use 'New Clinical Record' tab to add the first record." />
          ) : (
            records.map(rec => (
              <div key={rec.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(rec.visitDate)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{rec.doctorName}</p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Complaint</p><p>{rec.chiefComplaint}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Diagnosis</p><p className="font-medium text-[var(--color-text)]">{rec.diagnosis}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Treatment</p><p>{rec.treatment}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Notes</p><p className="text-[var(--color-text-muted)]">{rec.clinicalNotes || '—'}</p></div>
                </div>
                {rec.prescription && rec.prescription.length > 0 && (
                  <div className="bg-[var(--color-bg)] rounded-lg p-3 border border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2 flex items-center gap-1"><Pill size={11} /> Prescription</p>
                    {rec.prescription.map((rx, i) => (
                      <p key={i} className="text-sm"><span className="font-medium">{rx.medicine}</span> — {rx.dosage}, {rx.duration}. {rx.instructions}</p>
                    ))}
                  </div>
                )}
                {rec.followUpDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <Calendar size={12} /> Follow-up: {formatDate(rec.followUpDate)} — {rec.followUpInstructions || 'Routine review'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* New clinical record tab */}
      {activeTab === 'record' && (
        <div className="card p-6 space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-base font-semibold text-[var(--color-text)]">New Clinical Record — {formatDate(today())}</h2>
            {aiReport && (
              <button
                onClick={applyAiSuggestion}
                className="flex items-center gap-1.5 text-xs px-3 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold cursor-pointer hover:bg-indigo-100 transition-colors"
              >
                <Sparkles size={13} /> Apply AI Recommendation Suggestion
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="complaint" className="text-sm font-medium block mb-1">Chief Complaint <span className="text-red-500">*</span></label>
              <input id="complaint" value={form.chiefComplaint} onChange={e => updateForm('chiefComplaint', e.target.value)} className="form-input" placeholder="Patient's presenting complaint…" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="diagnosis" className="text-sm font-medium block mb-1">Diagnosis <span className="text-red-500">*</span></label>
              <textarea id="diagnosis" value={form.diagnosis} onChange={e => updateForm('diagnosis', e.target.value)} className="form-textarea" rows={2} placeholder="Clinical diagnosis…" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="treatment" className="text-sm font-medium block mb-1">Treatment / Procedure <span className="text-red-500">*</span></label>
              <textarea id="treatment" value={form.treatment} onChange={e => updateForm('treatment', e.target.value)} className="form-textarea" rows={2} placeholder="Procedure performed…" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium block mb-1">Clinical Notes</label>
              <textarea id="notes" value={form.clinicalNotes} onChange={e => updateForm('clinicalNotes', e.target.value)} className="form-textarea" rows={3} placeholder="Observations, patient response, instructions given…" />
            </div>
            <div>
              <label htmlFor="followUpDate" className="text-sm font-medium block mb-1">Follow-up Date</label>
              <input id="followUpDate" type="date" value={form.followUpDate} onChange={e => updateForm('followUpDate', e.target.value)} className="form-input" min={today()} />
            </div>
            <div>
              <label htmlFor="followUpInstr" className="text-sm font-medium block mb-1">Follow-up Instructions</label>
              <input id="followUpInstr" value={form.followUpInstructions} onChange={e => updateForm('followUpInstructions', e.target.value)} className="form-input" placeholder="e.g., Crown fitting appointment" />
            </div>
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium flex items-center gap-2"><Pill size={14} /> Prescriptions</label>
              <button onClick={addPrescription} className="text-xs px-3 h-7 rounded-lg border border-[var(--color-primary-200)] text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] cursor-pointer">+ Add Medicine</button>
            </div>
            <div className="space-y-3">
              {form.prescriptions.map((rx, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                  <input value={rx.medicine} onChange={e => updatePrescription(i, 'medicine', e.target.value)} className="form-input text-sm" placeholder="Medicine name" aria-label="Medicine name" />
                  <input value={rx.dosage} onChange={e => updatePrescription(i, 'dosage', e.target.value)} className="form-input text-sm" placeholder="Dosage" aria-label="Dosage" />
                  <input value={rx.duration} onChange={e => updatePrescription(i, 'duration', e.target.value)} className="form-input text-sm" placeholder="Duration" aria-label="Duration" />
                  <div className="flex gap-1">
                    <input value={rx.instructions} onChange={e => updatePrescription(i, 'instructions', e.target.value)} className="form-input text-sm flex-1" placeholder="Instructions" aria-label="Instructions" />
                    {form.prescriptions.length > 1 && (
                      <button onClick={() => removePrescription(i)} className="text-red-400 hover:text-red-600 px-1.5 cursor-pointer" aria-label="Remove prescription">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 h-9 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] disabled:opacity-60 cursor-pointer transition-colors"
            >
              {saving ? 'Saving…' : <><Save size={14} /> Save Clinical Record</>}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                <CheckCircle size={16} /> Record saved!
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Cavity Detection Tab */}
      {activeTab === 'ai' && (
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-1.5">
              <Sparkles size={16} className="text-indigo-600" /> AI-Assisted Cavity Detection
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Upload a patient dental X-Ray, crop the specific tooth area, and request an AI check.</p>
          </div>

          {/* Interactive Crop Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side: Upload and Interactive Cropper */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">X-Ray Input</span>
                <label className="flex items-center gap-1 text-xs px-2.5 h-8 rounded border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold transition-colors cursor-pointer">
                  <ImageIcon size={12} />
                  Choose X-Ray Image
                  <input type="file" accept="image/*" onChange={handleXrayChange} className="hidden" />
                </label>
              </div>

              {xrayPreview ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Scissors size={10} /> Drag the blue box to crop a single tooth area from the X-Ray before analysis.
                  </p>
                  
                  {/* Cropper Container */}
                  <div
                    ref={containerRef}
                    className="relative border border-[var(--color-border)] rounded-xl bg-slate-900 overflow-hidden mx-auto select-none"
                    style={{ maxWidth: '400px', height: '300px' }}
                  >
                    <img
                      id="xray-img-source"
                      src={xrayPreview}
                      alt="Dental X-Ray source"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    
                    {/* Draggable Crop Rectangle Overlay */}
                    <div
                      onMouseDown={startDrag}
                      className="absolute border-2 border-dashed border-indigo-500 bg-indigo-300/30 cursor-move flex items-center justify-center"
                      style={{
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.width}%`,
                        height: `${cropBox.height}%`,
                      }}
                    >
                      <span className="bg-indigo-600 text-white font-bold text-[9px] px-1 py-0.5 rounded shadow">
                        Tooth Crop
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCropAndAnalyze}
                    disabled={analyzing}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer transition-colors shadow"
                  >
                    {analyzing ? 'AI Analyzing Crop...' : 'Crop & Run AI Analysis'}
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-10 text-center bg-[var(--color-bg)] flex flex-col items-center justify-center">
                  <ImageIcon size={40} className="text-[var(--color-text-subtle)] mb-2" />
                  <p className="text-sm font-medium text-[var(--color-text)]">No X-Ray image uploaded yet</p>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1">Select an X-ray image to start the crop tool.</p>
                </div>
              )}
            </div>

            {/* Right side: AI Report output */}
            <div className="space-y-4">
              <span className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider block">Analysis Output</span>
              
              {aiReport ? (
                <div className="card p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <div>
                      <p className="text-xs text-indigo-700 font-semibold uppercase tracking-wider">Report generated</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{aiReport.id}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${aiReport.result === 'Cavity' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {aiReport.result}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Confidence Level</p>
                      <p className="text-base font-bold text-[var(--color-text)]">{(aiReport.confidence * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Suggested Action</p>
                      <p className="text-base font-bold text-indigo-800">{aiReport.suggestions}</p>
                    </div>
                  </div>

                  {/* Warning Note */}
                  <div className="p-3 bg-amber-50 text-amber-800 text-[10px] rounded-lg border border-amber-200 font-medium">
                    ⚠️ <strong>Notice:</strong> AI assist karto, doctor final decision gheto. AI reports are recommendation aids; the treating dentist makes the final diagnosis.
                  </div>

                  <button
                    onClick={applyAiSuggestion}
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow"
                  >
                    <CheckCircle size={14} /> Accept & Apply to Clinical Record
                  </button>
                </div>
              ) : (
                <div className="card p-8 border border-[var(--color-border)] text-center flex flex-col items-center justify-center">
                  <Sparkles size={30} className="text-indigo-400 mb-2" />
                  <p className="text-sm font-medium text-[var(--color-text)]">Awaiting AI check</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Upload and crop a tooth area on the left to review prediction reports here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
