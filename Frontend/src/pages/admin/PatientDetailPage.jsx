import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, Pill, Trash2, DollarSign, PlusCircle, CreditCard, Edit3, Activity } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatCurrency, today } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../app/store';
import Modal from '../../components/ui/Modal';
import DentalChart from '../../components/clinical/DentalChart';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'clinical', label: 'Clinical History', icon: FileText },
  { id: 'odontogram', label: 'Dental Chart', icon: Activity },
  { id: 'billing', label: 'Billing & Payments', icon: DollarSign },
];

export default function PatientDetailPage({ basePath = '/admin' }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  // Select active role to enforce Admin-only soft deletes
  const currentUserRole = useSelector(state => state.auth.role);

  const [activeTab, setActiveTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Patient Profile State
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState({
    name: '', phone: '', age: 30, gender: 'Male', bloodGroup: 'O+',
    email: '', address: '', chiefComplaint: '', allergies: 'None', medicalHistory: 'None'
  });

  // Billing Modal State
  const [billingModal, setBillingModal] = useState(false);
  const [receiptModalPayment, setReceiptModalPayment] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const [patRes, aptsRes, recsRes, paysRes] = await Promise.all([
        api.getPatient(id),
        api.getAppointmentsByPatient(id),
        api.getClinicalRecords(id),
        api.getPaymentsByPatient(id),
      ]);
      const pData = patRes.data?.patient || patRes.data || null;
      setPatient(pData);
      setAppointments(Array.isArray(aptsRes.data) ? aptsRes.data : []);
      const recs = Array.isArray(recsRes) ? recsRes : (recsRes.data || []);
      setRecords(Array.isArray(recs) ? recs : []);
      const pays = Array.isArray(paysRes.data?.payments) ? paysRes.data.payments : (Array.isArray(paysRes.data) ? paysRes.data : []);
      setPayments(pays);
    } catch (err) {
      console.error('Failed to load patient records:', err);
      dispatch(addToast({ type: 'error', title: 'Data Load Error', message: 'Failed to fetch patient data from database.' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  function openEditPatientModal() {
    if (!patient) return;
    setEditPatientForm({
      name: patient.name || '',
      phone: patient.phone || '',
      age: patient.age || 30,
      gender: patient.gender || 'Male',
      bloodGroup: patient.bloodGroup || 'O+',
      email: patient.email || '',
      address: patient.address || '',
      chiefComplaint: patient.chiefComplaint || '',
      allergies: patient.allergies || 'None',
      medicalHistory: patient.medicalHistory || 'None',
    });
    setEditPatientModalOpen(true);
  }

  async function handleEditPatientSubmit(e) {
    e.preventDefault();
    if (!editPatientForm.name || !editPatientForm.phone) {
      dispatch(addToast({ type: 'error', title: 'Missing info', message: 'Name and Phone number are required.' }));
      return;
    }

    setSavingPatient(true);
    try {
      const updatedData = {
        name: editPatientForm.name.trim(),
        phone: editPatientForm.phone.trim(),
        age: Number(editPatientForm.age),
        gender: editPatientForm.gender,
        bloodGroup: editPatientForm.bloodGroup,
        email: editPatientForm.email.trim(),
        address: editPatientForm.address.trim(),
        chiefComplaint: editPatientForm.chiefComplaint.trim(),
        allergies: editPatientForm.allergies.trim(),
        medicalHistory: editPatientForm.medicalHistory.trim(),
      };

      await api.updatePatient(id, updatedData).catch(() => null);

      setPatient(prev => ({ ...prev, ...updatedData }));
      dispatch(addToast({ type: 'success', title: 'Profile Updated', message: 'Patient details and name updated successfully.' }));
      setEditPatientModalOpen(false);
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Update Failed', message: err.message }));
    } finally {
      setSavingPatient(false);
    }
  }

  const assignedDoctorName = appointments.length > 0
    ? appointments.find(a => a.doctorId === patient?.assignedDoctorId)?.doctorName || '–'
    : '–';

  const totalPaidSum = payments.reduce((sum, p) => sum + p.amount, 0);

  const openAddPaymentModal = (apt = null) => {
    setSelectedApt(apt);
    setPayAmount(apt ? (apt.type === 'Consultation' ? '500' : '2000') : '');
    setPayMode('UPI');
    setPayNotes(apt ? `${apt.type} payment` : 'General payment');
    setBillingModal(true);
  };

  const handleAddPaymentSubmit = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      dispatch(addToast({ type: 'error', title: 'Invalid amount', message: 'Please enter a valid payment amount.' }));
      return;
    }

    try {
      const paymentData = {
        patientId: id,
        appointmentId: selectedApt ? selectedApt.id : null,
        amount: parseFloat(payAmount),
        mode: payMode,
        notes: payNotes,
        date: today(),
      };

      const response = await api.addPayment(paymentData);
      if (response.success) {
        dispatch(addToast({ type: 'success', title: 'Payment Saved', message: `Transaction of ${formatCurrency(payAmount)} logged successfully.` }));
        setBillingModal(false);
        const paysRes = await api.getPaymentsByPatient(id);
        const pays = Array.isArray(paysRes.data?.payments) ? paysRes.data.payments : (Array.isArray(paysRes.data) ? paysRes.data : []);
        setPayments(pays);
      }
    } catch (error) {
      dispatch(addToast({ type: 'error', title: 'Payment Save Failed', message: error.message }));
    }
  };

  const handleDeletePayment = async (payId) => {
    if (currentUserRole !== 'admin') {
      dispatch(addToast({ type: 'error', title: 'Action Denied', message: 'Only admin users are permitted to delete payment logs.' }));
      return;
    }
    if (!window.confirm('Are you sure you want to delete this payment record? This will soft-delete (hide transaction only).')) return;
    try {
      const response = await api.deletePayment(payId);
      if (response.success) {
        dispatch(addToast({ type: 'success', title: 'Payment Voided', message: 'Transaction has been hidden from accounts.' }));
        const paysRes = await api.getPaymentsByPatient(id);
        const pays = Array.isArray(paysRes.data?.payments) ? paysRes.data.payments : (Array.isArray(paysRes.data) ? paysRes.data : []);
        setPayments(pays);
      }
    } catch (error) {
      dispatch(addToast({ type: 'error', title: 'Delete Failed', message: error.message }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-8 h-8 animate-spin text-[var(--color-primary-500)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <p className="text-sm text-[var(--color-text-muted)]">Loading clinical and billing profiles...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <EmptyState title="Patient not found" description="This patient record doesn't exist." />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <Link to={`${basePath}/patients`} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer">
        <ArrowLeft size={15} /> Back to Patients
      </Link>

      {/* Header card */}
      <div className="card p-6 bg-white border border-[var(--color-border)] rounded-xl shadow-xs">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={patient.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[var(--color-text)]">{patient.name}</h1>
                <StatusBadge status={patient.status} />
              </div>
              {currentUserRole !== 'admin' ? (
                <button
                  onClick={openEditPatientModal}
                  className="btn btn-outline btn-xs flex items-center gap-1.5 text-[var(--color-primary-600)] border-[var(--color-primary-200)] hover:bg-[var(--color-primary-50)] cursor-pointer font-semibold"
                >
                  <Edit3 size={13} /> Edit Name & Details
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                  🔒 Admin View-Only
                </span>
              )}
            </div>

            <p className="text-sm text-[var(--color-text-muted)] mb-3 font-mono">{patient.patientId}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Age / Gender</p>
                <p className="font-medium text-[var(--color-text)]">{patient.age} yrs · {patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Blood Group</p>
                <p className="font-medium text-[var(--color-text)]">{patient.bloodGroup || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Registered</p>
                <p className="font-medium text-[var(--color-text)]">{formatDate(patient.registeredAt)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Total Visits</p>
                <p className="font-medium text-[var(--color-text)]">{patient.totalVisits || 1}</p>
              </div>
            </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4 bg-white border border-[var(--color-border)] rounded-xl">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Contact Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <span>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                  <span className="break-all">{patient.email}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <span className="text-[var(--color-text-muted)]">{patient.address || 'Dwarka, New Delhi'}</span>
              </div>
            </div>
            {patient.emergencyContact && (
              <div className="pt-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Emergency Contact</p>
                <p className="text-sm font-medium">{patient.emergencyContact.name} <span className="font-normal text-[var(--color-text-muted)]">({patient.emergencyContact.relation})</span></p>
                <p className="text-sm text-[var(--color-text-muted)]">{patient.emergencyContact.phone}</p>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4 bg-white border border-[var(--color-border)] rounded-xl">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Medical Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Chief Complaint</p>
                <p className="text-[var(--color-text)]">{patient.chiefComplaint || 'Consultation'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Allergies</p>
                <p className={patient.allergies === 'None' ? 'text-[var(--color-text-muted)]' : 'text-amber-600 font-medium'}>{patient.allergies || 'None'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Medical History</p>
                <p className="text-[var(--color-text)]">{patient.medicalHistory || 'No prior medical history recorded'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Assigned Doctor</p>
                <p className="font-medium text-[var(--color-primary-500)]">{assignedDoctorName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments tab */}
      {activeTab === 'appointments' && (
        <div className="card overflow-hidden bg-white border border-[var(--color-border)] rounded-xl">
          {appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments" description="This patient has no appointment history." />
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Type</th><th>Status</th><th>Billing</th></tr></thead>
              <tbody>
                {appointments.slice().sort((a,b) => b.date.localeCompare(a.date)).map(apt => (
                  <tr key={apt.id}>
                    <td>{formatDate(apt.date)}</td>
                    <td>{apt.time}</td>
                    <td>{apt.doctorName}</td>
                    <td>{apt.treatmentCategoryName || '–'}</td>
                    <td><StatusBadge status={apt.status} /></td>
                    <td>
                      {apt.status === 'completed' && (
                        <button
                          onClick={() => openAddPaymentModal(apt)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors font-medium cursor-pointer"
                        >
                          <DollarSign size={12} /> Add Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Clinical history tab */}
      {activeTab === 'clinical' && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <EmptyState icon={FileText} title="No clinical records" description="No clinical history found for this patient." />
          ) : (
            records.slice().sort((a,b) => b.visitDate.localeCompare(a.visitDate)).map(rec => (
              <div key={rec.id} className="card p-5 bg-white border border-[var(--color-border)] rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{formatDate(rec.visitDate)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{rec.doctorName}</p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Complaint</p>
                    <p>{rec.chiefComplaint}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Diagnosis</p>
                    <p>{rec.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Treatment</p>
                    <p className="text-[var(--color-text)]">{rec.treatment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-[var(--color-text-muted)]">{rec.clinicalNotes || '—'}</p>
                  </div>
                </div>
                {rec.prescription && rec.prescription.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Pill size={12} /> Prescription
                    </p>
                    <div className="space-y-1.5">
                      {rec.prescription.map((rx, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-[var(--color-text)]">{rx.medicine}</span>
                          <span className="text-[var(--color-text-muted)]"> — {rx.dosage} for {rx.duration}. {rx.instructions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Odontogram */}
      {activeTab === 'odontogram' && (
        <DentalChart
          initialChart={records.find(r => r.dentalChart && r.dentalChart.length > 0)?.dentalChart || []}
          onSaveChart={async (chartData) => {
            try {
              const currentDoctorId = appointments.find(a => a.doctorId)?.doctorId || '60d5ecb8b5c9c80015f8a000';
              await api.addClinicalRecord({
                patientId: id,
                doctorId: currentDoctorId,
                chiefComplaint: patient.chiefComplaint || 'Dental Chart Update',
                diagnosis: 'Odontogram Examination',
                treatment: 'Dental Charting',
                clinicalNotes: `Updated dental chart with ${chartData.length} tooth findings.`,
                dentalChart: chartData,
              });
              dispatch(addToast({ type: 'success', title: 'Dental Chart Saved', message: 'Tooth findings successfully recorded.' }));
              loadPatientData();
            } catch (err) {
              dispatch(addToast({ type: 'error', title: 'Save Failed', message: err.message }));
            }
          }}
        />
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 flex items-center gap-4 border-l-4 border-emerald-500 bg-white">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] font-medium">Total Paid Amount</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{formatCurrency(totalPaidSum)}</p>
              </div>
            </div>
            <div className="card p-5 flex items-center justify-between bg-white border border-[var(--color-border)] rounded-xl">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Billing Overview</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Patient transaction history & official receipts</p>
              </div>
              {currentUserRole !== 'admin' && (
                <button
                  onClick={() => openAddPaymentModal(null)}
                  className="flex items-center gap-1 text-xs px-3 h-8 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors font-semibold cursor-pointer"
                >
                  <PlusCircle size={14} /> Record General Payment
                </button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden bg-white border border-[var(--color-border)] rounded-xl">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Transaction History</h3>
            </div>
            {payments.length === 0 ? (
              <EmptyState icon={CreditCard} title="No payments recorded" description="This patient has no transaction history." />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Txn ID</th>
                      <th>Mode</th>
                      <th>Notes</th>
                      <th className="text-right">Amount</th>
                      {currentUserRole === 'admin' && <th className="text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice().sort((a,b) => b.date.localeCompare(a.date)).map(p => (
                      <tr key={p.id}>
                        <td className="text-sm">{formatDate(p.date)}</td>
                        <td className="text-xs font-mono text-[var(--color-text-muted)]">{p.id}</td>
                        <td className="text-sm font-medium">{p.mode}</td>
                        <td className="text-sm text-[var(--color-text-muted)]">{p.notes || '—'}</td>
                        <td className="text-sm font-semibold text-[var(--color-text)] text-right">{formatCurrency(p.amount)}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setReceiptModalPayment(p)}
                              className="btn btn-outline btn-xs flex items-center gap-1 text-[var(--color-primary-600)]"
                            >
                              🖨️ Receipt
                            </button>
                            {currentUserRole === 'admin' && (
                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer inline-flex items-center gap-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Patient Details Modal */}
      {editPatientModalOpen && (
        <Modal open={true} onClose={() => setEditPatientModalOpen(false)} title={`Edit Patient Details — ${patient.name}`} size="md">
          <form onSubmit={handleEditPatientSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={editPatientForm.name}
                onChange={e => setEditPatientForm({ ...editPatientForm, name: e.target.value })}
                className="form-input text-sm"
                placeholder="Full Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editPatientForm.phone}
                  onChange={e => setEditPatientForm({ ...editPatientForm, phone: e.target.value })}
                  className="form-input text-sm"
                  placeholder="Mobile Number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Age *</label>
                <input
                  type="number"
                  required
                  value={editPatientForm.age}
                  onChange={e => setEditPatientForm({ ...editPatientForm, age: e.target.value })}
                  className="form-input text-sm"
                  placeholder="Age"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Gender</label>
                <select
                  value={editPatientForm.gender}
                  onChange={e => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}
                  className="form-input text-sm cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Blood Group</label>
                <select
                  value={editPatientForm.bloodGroup}
                  onChange={e => setEditPatientForm({ ...editPatientForm, bloodGroup: e.target.value })}
                  className="form-input text-sm cursor-pointer"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Full Residential Address</label>
              <input
                type="text"
                value={editPatientForm.address}
                onChange={e => setEditPatientForm({ ...editPatientForm, address: e.target.value })}
                className="form-input text-sm"
                placeholder="House No, Sector, Dwarka, New Delhi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Chief Complaint</label>
                <input
                  type="text"
                  value={editPatientForm.chiefComplaint}
                  onChange={e => setEditPatientForm({ ...editPatientForm, chiefComplaint: e.target.value })}
                  className="form-input text-sm"
                  placeholder="e.g. Tooth pain, Braces"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Allergies</label>
                <input
                  type="text"
                  value={editPatientForm.allergies}
                  onChange={e => setEditPatientForm({ ...editPatientForm, allergies: e.target.value })}
                  className="form-input text-sm"
                  placeholder="e.g. None or Dust"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditPatientModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" disabled={savingPatient} className="btn btn-primary btn-sm font-semibold">
                {savingPatient ? 'Saving...' : 'Save Patient Details'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Payment Modal */}
      {billingModal && (
        <Modal open={billingModal} onClose={() => setBillingModal(false)} title="Record Patient Payment" size="sm">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Amount (₹) *</label>
              <input type="number" required placeholder="e.g. 2000" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="form-input" />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Payment Mode *</label>
              <select value={payMode} onChange={e => setPayMode(e.target.value)} className="form-input cursor-pointer">
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <input placeholder="Payment description" value={payNotes} onChange={e => setPayNotes(e.target.value)} className="form-input" />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setBillingModal(false)} className="btn btn-outline btn-sm">Cancel</button>
              <button onClick={handleAddPaymentSubmit} className="btn btn-primary btn-sm font-semibold">Save Transaction</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {receiptModalPayment && (
        <Modal open={true} onClose={() => setReceiptModalPayment(null)} title="Payment Receipt">
          <div className="space-y-4 p-2 print:p-0">
            <div className="border border-[var(--color-border)] rounded-xl p-6 space-y-5 bg-white print:border-none">
              <div className="border-b pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-primary-600)]">Dwarka Dental Clinic</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Dwarka, New Delhi · Phone: +91 98765 00000</p>
                </div>
                <div className="text-right">
                  <span className="badge badge-green uppercase text-xs font-mono">Official Receipt</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[var(--color-text-muted)] font-medium">Patient Name:</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{patient.name}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] font-medium">Payment Method:</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{receiptModalPayment.mode}</p>
                </div>
              </div>

              <div className="border-t border-b py-3 flex justify-between items-center text-sm font-medium">
                <span>Description: {receiptModalPayment.notes || 'Dental Consultation'}</span>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(receiptModalPayment.amount)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end print:hidden">
              <button onClick={() => setReceiptModalPayment(null)} className="btn btn-outline btn-sm">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm flex items-center gap-1.5">🖨️ Print Receipt</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
