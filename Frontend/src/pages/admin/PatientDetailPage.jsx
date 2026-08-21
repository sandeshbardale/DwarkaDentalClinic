import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, Pill, Trash2, DollarSign, PlusCircle, CreditCard } from 'lucide-react';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime, formatCurrency, today } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../app/store';
import Modal from '../../components/ui/Modal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'clinical', label: 'Clinical History', icon: FileText },
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

  // Billing Modal State
  const [billingModal, setBillingModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const pats = await api.getPatients();
      const found = pats.find(p => p.id === id);
      setPatient(found || null);

      if (found) {
        const apts = await api.getAppointments();
        setAppointments(apts.filter(a => a.patientId === id));

        const recs = await api.getClinicalRecords(id);
        setRecords(recs);

        const pays = await api.getPayments();
        setPayments(pays.filter(p => p.patientId === id));
      }
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

  const doctor = MOCK_DOCTORS.find(d => d.id === patient?.assignedDoctorId);

  // Calculate Total Paid
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
        // Reload payments
        const pays = await api.getPayments();
        setPayments(pays.filter(p => p.patientId === id));
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
    if (!window.confirm('Are you sure you want to delete this payment record? This action will perform a soft-delete (hide transaction only).')) {
      return;
    }

    try {
      const response = await api.deletePayment(payId, currentUserRole);
      if (response.success) {
        dispatch(addToast({ type: 'success', title: 'Payment Soft-Deleted', message: 'Transaction has been hidden from accounts.' }));
        // Reload payments
        const pays = await api.getPayments();
        setPayments(pays.filter(p => p.patientId === id));
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
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={patient.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">{patient.name}</h1>
              <StatusBadge status={patient.status} />
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
                <p className="font-medium text-[var(--color-text)]">{patient.totalVisits}</p>
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
          {/* Contact info */}
          <div className="card p-5 space-y-4">
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
                <span className="text-[var(--color-text-muted)]">{patient.address}</span>
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

          {/* Medical info */}
          <div className="card p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Medical Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Chief Complaint</p>
                <p className="text-[var(--color-text)]">{patient.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Allergies</p>
                <p className={patient.allergies === 'None' ? 'text-[var(--color-text-muted)]' : 'text-amber-600 font-medium'}>{patient.allergies}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Medical History</p>
                <p className="text-[var(--color-text)]">{patient.medicalHistory}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Assigned Doctor</p>
                <p className="font-medium text-[var(--color-primary-500)]">{doctor?.name || '—'}</p>
                {doctor && <p className="text-xs text-[var(--color-text-muted)]">{doctor.specialization}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments tab */}
      {activeTab === 'appointments' && (
        <div className="card overflow-hidden">
          {appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments" description="This patient has no appointment history." />
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Type</th><th>Status</th><th>Billing</th></tr></thead>
              <tbody>
                {appointments.slice().sort((a,b) => b.date.localeCompare(a.date)).map(apt => (
                  <tr key={apt.id}>
                    <td>{formatDate(apt.date)}</td>
                    <td>{formatTime(apt.time)}</td>
                    <td>{apt.doctorName}</td>
                    <td>{apt.type}</td>
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
              <div key={rec.id} className="card p-5">
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
                {rec.followUpDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <Calendar size={12} /> Follow-up scheduled: {formatDate(rec.followUpDate)} — {rec.followUpInstructions || 'Follow up visit'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Billing & Payments Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 flex items-center gap-4 border-l-4 border-emerald-500">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] font-medium">Total Paid Amount</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{formatCurrency(totalPaidSum)}</p>
              </div>
            </div>
            <div className="card p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Billing Operations</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Record a new patient transaction</p>
              </div>
              <button
                onClick={() => openAddPaymentModal(null)}
                className="flex items-center gap-1 text-xs px-3 h-8 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors font-semibold cursor-pointer"
              >
                <PlusCircle size={14} /> Record General Payment
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="card overflow-hidden">
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
                        {currentUserRole === 'admin' && (
                          <td className="text-center">
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer inline-flex items-center gap-1"
                              title="Delete Transaction (Soft-Delete)"
                            >
                              <Trash2 size={13} />
                              <span className="text-[10px] font-bold">Delete</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {billingModal && (
        <Modal open={billingModal} onClose={() => setBillingModal(false)} title="Record Patient Payment" size="sm">
          <div className="space-y-4">
            {selectedApt && (
              <div className="bg-[var(--color-bg-subtle)] p-3 rounded-lg border border-[var(--color-border)] text-xs space-y-1">
                <p className="font-semibold text-[var(--color-text)]">Link to Appointment:</p>
                <p className="text-[var(--color-text-muted)]">Type: {selectedApt.type} · Doctor: {selectedApt.doctorName}</p>
                <p className="text-[var(--color-text-muted)]">Date: {formatDate(selectedApt.date)}</p>
              </div>
            )}

            <div>
              <label htmlFor="pay-amount" className="text-sm font-medium block mb-1">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                id="pay-amount"
                type="number"
                required
                placeholder="e.g. 2000"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="pay-mode" className="text-sm font-medium block mb-1">Payment Mode <span className="text-red-500">*</span></label>
              <select
                id="pay-mode"
                value={payMode}
                onChange={e => setPayMode(e.target.value)}
                className="form-input cursor-pointer"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label htmlFor="pay-notes" className="text-sm font-medium block mb-1">Notes / Description</label>
              <input
                id="pay-notes"
                placeholder="e.g. RCT phase 1 payment"
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setBillingModal(false)} className="text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer">Cancel</button>
              <button onClick={handleAddPaymentSubmit} className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-medium cursor-pointer">Save Transaction</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
