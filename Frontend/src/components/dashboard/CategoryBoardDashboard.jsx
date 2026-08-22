import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Calendar, Clock, AlertTriangle, Plus, Phone, Calendar as CalendarIcon,
  Loader2, CheckCircle2, ShieldAlert, Edit3, DollarSign, Download, Send, Filter,
  RefreshCw, Trash2, ArrowUpDown, ChevronDown, ChevronRight, Tag, RotateCcw,
  Sparkles, Stethoscope, Activity, User, ExternalLink, MapPin, HeartPulse, UserCheck, Shield, ArrowRight, ArrowLeft, Search, FileSpreadsheet
} from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import Modal, { ConfirmModal } from '../ui/Modal';
import { formatDate } from '../../utils/formatters';

const CARDS_STORAGE_KEY = 'ddc_patient_cards_v2';
const CATS_STORAGE_KEY = 'ddc_categories_v2';

const CATEGORY_THEMES = {
  'Root Canal': { border: 'border-l-rose-500', bgIcon: 'bg-rose-50 text-rose-600 border-rose-100', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Orthodontic': { border: 'border-l-violet-600', bgIcon: 'bg-violet-50 text-violet-600 border-violet-100', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  'Extraction': { border: 'border-l-amber-500', bgIcon: 'bg-amber-50 text-amber-600 border-amber-100', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Dental Implant': { border: 'border-l-sky-500', bgIcon: 'bg-sky-50 text-sky-600 border-sky-100', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  'default': { border: 'border-l-indigo-500', bgIcon: 'bg-indigo-50 text-indigo-600 border-indigo-100', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Root Canal', code: 'RCT', defaultFollowUpDays: 8 },
  { id: 'cat-2', name: 'Orthodontic', code: 'ORTHO', defaultFollowUpDays: 28 },
  { id: 'cat-3', name: 'Extraction', code: 'EXT', defaultFollowUpDays: 7 },
  { id: 'cat-4', name: 'Dental Implant', code: 'IMP', defaultFollowUpDays: 30 },
];

const INITIAL_CARDS = [
  {
    id: 'apt-1',
    patientName: 'Rajesh Kumar',
    patientPhone: '9876543210',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    email: 'rajesh.k@gmail.com',
    address: 'Sector 12, Dwarka, New Delhi',
    emergencyContact: { name: 'Suresh Kumar', relation: 'Brother', phone: '9876543299' },
    chiefComplaint: 'Severe tooth pain in lower right molar',
    allergies: 'None',
    medicalHistory: 'No prior medical conditions',
    doctorName: 'Dr. Bhagwan Rakh',
    date: '2026-04-29',
    categoryName: 'Root Canal',
    status: 'Today',
    totalFee: 8000,
    amountPaid: 4500,
    amountDue: 3500,
    paymentStatus: 'Pending',
    nextAppointmentDays: 8,
    paymentHistory: [
      { id: 'pay-101', receiptNo: 'RCP-2026-001', date: '2026-04-15', mode: 'UPI', amount: 4500, notes: 'RCT Phase 1 Advance' }
    ]
  },
  {
    id: 'apt-2',
    patientName: 'Sunita Sharma',
    patientPhone: '9876543211',
    age: 29,
    gender: 'Female',
    bloodGroup: 'O+',
    email: 'sunita.s@gmail.com',
    address: 'Sector 7, Dwarka, New Delhi',
    emergencyContact: { name: 'Ramesh Sharma', relation: 'Spouse', phone: '9876543298' },
    chiefComplaint: 'RCT follow-up and crown fitting',
    allergies: 'Penicillin',
    medicalHistory: 'Low Blood Pressure',
    doctorName: 'Dr. H M Sanap',
    date: '2026-05-02',
    categoryName: 'Root Canal',
    status: 'Upcoming',
    totalFee: 6000,
    amountPaid: 6000,
    amountDue: 0,
    paymentStatus: 'Paid',
    nextAppointmentDays: 8,
    paymentHistory: [
      { id: 'pay-102', receiptNo: 'RCP-2026-002', date: '2026-04-20', mode: 'Card', amount: 6000, notes: 'Full Payment' }
    ]
  },
  {
    id: 'apt-3',
    patientName: 'Amit Patel',
    patientPhone: '9876543212',
    age: 26,
    gender: 'Male',
    bloodGroup: 'A+',
    email: 'amit.patel@gmail.com',
    address: 'Sector 10, Dwarka, New Delhi',
    emergencyContact: { name: 'Pravin Patel', relation: 'Father', phone: '9876543297' },
    chiefComplaint: 'Monthly braces wire tightening',
    allergies: 'None',
    medicalHistory: 'None',
    doctorName: 'Dr. Bhagwan Rakh',
    date: '2026-05-20',
    categoryName: 'Orthodontic',
    status: 'Today',
    totalFee: 35000,
    amountPaid: 35000,
    amountDue: 0,
    paymentStatus: 'Paid',
    nextAppointmentDays: 28,
    paymentHistory: [
      { id: 'pay-103', receiptNo: 'RCP-2026-003', date: '2026-01-10', mode: 'UPI', amount: 15000, notes: 'Initial Braces Down Payment' },
      { id: 'pay-104', receiptNo: 'RCP-2026-004', date: '2026-02-15', mode: 'Cash', amount: 10000, notes: 'Monthly Adjustment Fee 1' },
      { id: 'pay-105', receiptNo: 'RCP-2026-005', date: '2026-03-20', mode: 'UPI', amount: 10000, notes: 'Monthly Adjustment Fee 2' }
    ]
  },
  {
    id: 'apt-4',
    patientName: 'Pooja Verma',
    patientPhone: '9876543214',
    age: 31,
    gender: 'Female',
    bloodGroup: 'AB+',
    email: 'pooja.v@gmail.com',
    address: 'Sector 4, Dwarka, New Delhi',
    emergencyContact: { name: 'Vikas Verma', relation: 'Spouse', phone: '9876543296' },
    chiefComplaint: 'Orthodontic alignment adjustment',
    allergies: 'Dust',
    medicalHistory: 'Thyroid',
    doctorName: 'Dr. H M Sanap',
    date: '2026-05-26',
    categoryName: 'Orthodontic',
    status: 'Upcoming',
    totalFee: 40000,
    amountPaid: 34000,
    amountDue: 6000,
    paymentStatus: 'Pending',
    nextAppointmentDays: 28,
    paymentHistory: [
      { id: 'pay-106', receiptNo: 'RCP-2026-006', date: '2026-03-01', mode: 'UPI', amount: 34000, notes: 'Monthly Installment 1' }
    ]
  },
  {
    id: 'apt-5',
    patientName: 'Anita Desai',
    patientPhone: '9876543215',
    age: 42,
    gender: 'Female',
    bloodGroup: 'B+',
    email: 'anita.d@gmail.com',
    address: 'Sector 19, Dwarka, New Delhi',
    emergencyContact: { name: 'Mahesh Desai', relation: 'Spouse', phone: '9876543295' },
    chiefComplaint: 'Wisdom tooth extraction',
    allergies: 'Sulfa drugs',
    medicalHistory: 'Hypertension',
    doctorName: 'Dr. Bhagwan Rakh',
    date: '2026-04-26',
    categoryName: 'Extraction',
    status: 'Missed',
    totalFee: 6500,
    amountPaid: 2000,
    amountDue: 4500,
    paymentStatus: 'Pending',
    nextAppointmentDays: 7,
    paymentHistory: [
      { id: 'pay-107', receiptNo: 'RCP-2026-007', date: '2026-04-25', mode: 'Cash', amount: 2000, notes: 'Token Advance' }
    ]
  },
  {
    id: 'apt-6',
    patientName: 'Sneha Reddy',
    patientPhone: '9876543213',
    age: 28,
    gender: 'Female',
    bloodGroup: 'O+',
    email: 'sneha.r@gmail.com',
    address: 'Sector 22, Dwarka, New Delhi',
    emergencyContact: { name: 'Vikram Reddy', relation: 'Brother', phone: '9876543294' },
    chiefComplaint: 'Dental implant screw fixation',
    allergies: 'None',
    medicalHistory: 'None',
    doctorName: 'Dr. H M Sanap',
    date: '2026-05-28',
    categoryName: 'Dental Implant',
    status: 'Upcoming',
    totalFee: 25000,
    amountPaid: 20000,
    amountDue: 5000,
    paymentStatus: 'Pending',
    nextAppointmentDays: 30,
    paymentHistory: [
      { id: 'pay-108', receiptNo: 'RCP-2026-008', date: '2026-04-10', mode: 'Card', amount: 20000, notes: 'Implant Stage 1' }
    ]
  }
];

export function normalizeCategoryName(name) {
  if (!name) return 'Orthodontic';
  const clean = name.trim().toLowerCase().replace(/\s+treatment$/i, '');
  if (['root canal', 'rct', 'root canal treatment'].includes(clean)) return 'Root Canal';
  if (['orthodontic', 'orthodontics', 'othodontic', 'othodontics', 'ortho', 'braces'].includes(clean)) return 'Orthodontic';
  if (['extraction', 'tooth extraction', 'extractions'].includes(clean)) return 'Extraction';
  if (['dental implant', 'implant', 'implants', 'dental implants'].includes(clean)) return 'Dental Implant';
  return name.trim();
}

function deduplicateCategories(catList) {
  if (!Array.isArray(catList)) return DEFAULT_CATEGORIES;
  const seen = new Set();
  const result = [];
  for (const c of catList) {
    if (!c || !c.name) continue;
    const cleanName = normalizeCategoryName(c.name);
    const key = cleanName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ ...c, name: cleanName });
    }
  }
  return result.length > 0 ? result : DEFAULT_CATEGORIES;
}

function getStoredCards() {
  const keys = ['ddc_patient_cards_v2', 'ddc_patient_cards_v1', 'ddc_patient_cards', 'dwarka_patients', 'patients'];
  const allCards = [];
  const seenIds = new Set();

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const card of parsed) {
            const cardId = card.id || card._id || `${card.patientName || card.name}-${card.patientPhone || card.phone}`;
            if (cardId && !seenIds.has(cardId)) {
              seenIds.add(cardId);
              allCards.push({
                ...card,
                patientName: card.patientName || card.name || 'Patient',
                patientPhone: card.patientPhone || card.phone || '9876543210',
                categoryName: normalizeCategoryName(card.categoryName || card.treatmentCategoryName)
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const card of INITIAL_CARDS) {
    const cardId = card.id;
    if (!seenIds.has(cardId)) {
      seenIds.add(cardId);
      allCards.push({
        ...card,
        categoryName: normalizeCategoryName(card.categoryName)
      });
    }
  }

  return allCards;
}

function getStoredCategories() {
  try {
    const raw = localStorage.getItem(CATS_STORAGE_KEY);
    if (raw) return deduplicateCategories(JSON.parse(raw));
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_CATEGORIES;
}

export default function CategoryBoardDashboard() {
  const { role: userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [categories, setCategories] = useState(getStoredCategories);
  const [cards, setCards] = useState(getStoredCards);
  const [doctorsList, setDoctorsList] = useState(['Dr. Bhagwan Rakh', 'Dr. H M Sanap']);

  useEffect(() => {
    async function loadDoctors() {
      let localDocs = [];
      try {
        const raw = localStorage.getItem('ddc_doctors_v1');
        if (raw) localDocs = JSON.parse(raw);
      } catch (_) {}

      try {
        const res = await api.getDoctors();
        const apiDocs = Array.isArray(res.data) && res.data.length > 0 ? res.data : [];
        const namesSet = new Set(['Dr. Bhagwan Rakh', 'Dr. H M Sanap']);
        localDocs.forEach(d => { if (d.name) namesSet.add(d.name); });
        apiDocs.forEach(d => { if (d.name) namesSet.add(d.name); });
        setDoctorsList(Array.from(namesSet));
      } catch (_) {
        const namesSet = new Set(['Dr. Bhagwan Rakh', 'Dr. H M Sanap']);
        localDocs.forEach(d => { if (d.name) namesSet.add(d.name); });
        setDoctorsList(Array.from(namesSet));
      }
    }
    loadDoctors();
  }, []);

  // Synchronized Search via URL Search Params
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  function handleSearchChange(val) {
    if (val) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  // Track expanded categories (collapsed by default)
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortBy, setSortBy] = useState('DATE_ASC');

  // Registration Multi-Step State (Step 1, 2, 3)
  const [regStep, setRegStep] = useState(1);

  // Modals state
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [editPatientCard, setEditPatientCard] = useState(null);
  const [paymentHistoryCard, setPaymentHistoryCard] = useState(null);
  const [rescheduleModalCard, setRescheduleModalCard] = useState(null);
  const [callModalCard, setCallModalCard] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Toggle Category Expand/Collapse
  function toggleCategoryExpand(categoryId) {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }

  function expandAllCategories() {
    const all = {};
    categories.forEach(c => { all[c.id] = true; });
    setExpandedCategories(all);
  }

  function collapseAllCategories() {
    setExpandedCategories({});
  }

  // Export Patients to CSV / Excel Spreadsheet Backup
  function handleExportToExcel() {
    if (cards.length === 0) {
      alert('No patient records to export.');
      return;
    }

    const headers = [
      'Patient ID', 'Patient Name', 'Phone', 'Age', 'Gender', 'Blood Group',
      'Email', 'Address', 'Emergency Contact', 'Chief Complaint',
      'Category', 'Status', 'Assigned Doctor', 'Next Visit Date',
      'Interval Days', 'Total Fee (INR)', 'Amount Paid (INR)', 'Balance Due (INR)'
    ];

    const rows = cards.map(c => [
      `"${c.id}"`,
      `"${c.patientName}"`,
      `"${c.patientPhone}"`,
      `"${c.age || ''}"`,
      `"${c.gender || ''}"`,
      `"${c.bloodGroup || ''}"`,
      `"${c.email || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${c.emergencyContact?.name || ''} (${c.emergencyContact?.relation || ''}: ${c.emergencyContact?.phone || ''})"`,
      `"${(c.chiefComplaint || '').replace(/"/g, '""')}"`,
      `"${c.categoryName}"`,
      `"${c.status}"`,
      `"${c.doctorName || ''}"`,
      `"${c.date}"`,
      `"${c.nextAppointmentDays || ''}"`,
      c.totalFee || 0,
      c.amountPaid || 0,
      c.amountDue || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dwarka_Dental_Patients_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error(e);
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(CATS_STORAGE_KEY, JSON.stringify(deduplicateCategories(categories)));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  // Sync patients from MongoDB database API so backend patients are never lost
  useEffect(() => {
    async function fetchBackendPatients() {
      try {
        const res = await api.getPatients().catch(() => null);
        const apiPatients = res?.data?.patients || res?.data || [];
        if (Array.isArray(apiPatients) && apiPatients.length > 0) {
          setCards(prevCards => {
            const existingIds = new Set(prevCards.map(c => c.id || c._id));
            const newCards = [];
            for (const p of apiPatients) {
              const pId = p.id || p._id;
              if (pId && !existingIds.has(pId)) {
                existingIds.add(pId);
                newCards.push({
                  id: pId,
                  patientName: p.name || p.patientName || 'Patient',
                  patientPhone: p.phone || p.patientPhone || '9876543210',
                  age: p.age || 30,
                  gender: p.gender || 'Male',
                  bloodGroup: p.bloodGroup || 'O+',
                  email: p.email || '',
                  address: p.address || 'Dwarka, New Delhi',
                  emergencyContact: p.emergencyContact || { name: 'Guardian', relation: 'Family', phone: p.phone },
                  chiefComplaint: p.chiefComplaint || 'Dental Treatment',
                  allergies: p.allergies || 'None',
                  medicalHistory: p.medicalHistory || 'None',
                  doctorName: p.doctorName || p.assignedDoctorName || 'Dr. Bhagwan Rakh',
                  date: p.date || new Date().toISOString().split('T')[0],
                  categoryName: normalizeCategoryName(p.categoryName || p.treatmentCategoryName || 'Orthodontic'),
                  status: p.status || 'Today',
                  totalFee: p.totalFee || 25000,
                  amountPaid: p.amountPaid || 0,
                  amountDue: p.amountDue || (p.totalFee || 25000),
                  paymentStatus: p.paymentStatus || 'Pending',
                  nextAppointmentDays: p.nextAppointmentDays || 28,
                  paymentHistory: p.paymentHistory || []
                });
              }
            }
            return newCards.length > 0 ? [...prevCards, ...newCards] : prevCards;
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchBackendPatients();
  }, []);

  // Payment Form inside Modal
  const [newPaymentForm, setNewPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    mode: 'UPI',
    notes: ''
  });

  // Comprehensive Registration Form State with Doctor Selection
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: 30,
    gender: 'Male',
    bloodGroup: 'O+',
    email: '',
    address: '',
    emergencyName: '',
    emergencyRelation: 'Father',
    emergencyPhone: '',
    chiefComplaint: '',
    allergies: 'None',
    medicalHistory: 'No prior conditions',
    doctorSelect: 'Dr. Bhagwan Rakh',
    customDoctorName: '',
    categoryName: 'Orthodontic',
    totalFee: 30000,
    initialPayment: 5000,
    nextAppointmentDays: 28,
  });

  const [emergencyForm, setEmergencyForm] = useState({
    patientName: '', phone: '', categoryName: 'Extraction', amount: 2000, notes: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '', code: '', duration: 30, followUpDays: 28
  });

  const [editForm, setEditForm] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '10:00', intervalDays: 28 });

  function handleRegistrationCategoryChange(categoryName) {
    const matchedCat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    const defaultDays = matchedCat ? (matchedCat.defaultFollowUpDays || 28) : (categoryName === 'Orthodontic' ? 28 : (categoryName === 'Root Canal' ? 8 : 14));
    setPatientForm(prev => ({
      ...prev,
      categoryName,
      nextAppointmentDays: defaultDays
    }));
  }

  function getDateAfterDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 28));
    return d.toISOString().split('T')[0];
  }

  function handleResetToDefaults() {
    if (confirm('Reset patient records and categories to clean demo defaults?')) {
      setCards(INITIAL_CARDS);
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(INITIAL_CARDS));
      localStorage.setItem(CATS_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }
  }

  // Full Patient Registration Submit
  async function handleAddPatientSubmit(e) {
    e.preventDefault();
    if (!patientForm.name || !patientForm.phone) return;

    const assignedDoc = patientForm.doctorSelect === 'Other'
      ? (patientForm.customDoctorName.trim() || 'Dr. Bhagwan Rakh')
      : patientForm.doctorSelect;

    const total = Number(patientForm.totalFee) || 0;
    const paid = Number(patientForm.initialPayment) || 0;
    const due = Math.max(0, total - paid);
    const days = Number(patientForm.nextAppointmentDays) || (patientForm.categoryName === 'Orthodontic' ? 28 : (patientForm.categoryName === 'Root Canal' ? 8 : 14));
    const nextDate = getDateAfterDays(days);

    const newCard = {
      id: `apt-${Date.now()}`,
      patientName: patientForm.name,
      patientPhone: patientForm.phone,
      age: Number(patientForm.age) || 30,
      gender: patientForm.gender || 'Male',
      bloodGroup: patientForm.bloodGroup || 'O+',
      email: patientForm.email || '',
      address: patientForm.address || '',
      emergencyContact: {
        name: patientForm.emergencyName || '',
        relation: patientForm.emergencyRelation || 'Father',
        phone: patientForm.emergencyPhone || ''
      },
      chiefComplaint: patientForm.chiefComplaint || 'Dental consultation',
      allergies: patientForm.allergies || 'None',
      medicalHistory: patientForm.medicalHistory || 'None',
      doctorName: assignedDoc,
      date: nextDate,
      categoryName: patientForm.categoryName,
      status: 'Upcoming',
      totalFee: total,
      amountPaid: paid,
      amountDue: due,
      paymentStatus: due === 0 ? 'Paid' : 'Pending',
      nextAppointmentDays: days,
      paymentHistory: paid > 0 ? [
        { id: `pay-${Date.now()}`, receiptNo: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`, date: new Date().toISOString().split('T')[0], mode: 'UPI', amount: paid, notes: 'Initial Registration Deposit' }
      ] : []
    };

    setCards(prev => [newCard, ...prev]);

    const targetCat = categories.find(c => c.name.toLowerCase() === patientForm.categoryName.toLowerCase());
    if (targetCat) {
      setExpandedCategories(prev => ({ ...prev, [targetCat.id]: true }));
    }

    setAddPatientModalOpen(false);
    setRegStep(1);
    setPatientForm({
      name: '', phone: '', age: 30, gender: 'Male', bloodGroup: 'O+', email: '', address: '',
      emergencyName: '', emergencyRelation: 'Father', emergencyPhone: '',
      chiefComplaint: '', allergies: 'None', medicalHistory: 'No prior conditions',
      doctorSelect: 'Dr. Bhagwan Rakh', customDoctorName: '', categoryName: 'Orthodontic', totalFee: 30000, initialPayment: 5000, nextAppointmentDays: 28,
    });

    try {
      await api.addPatient({
        name: newCard.patientName,
        phone: newCard.patientPhone,
        age: newCard.age,
        gender: newCard.gender.toLowerCase(),
        email: newCard.email,
        address: newCard.address,
        emergencyContact: newCard.emergencyContact,
        bloodGroup: newCard.bloodGroup,
        chiefComplaint: newCard.chiefComplaint,
        medicalHistory: newCard.medicalHistory,
      }).catch(() => null);
    } catch (e) {
      console.error(e);
    }
  }

  // Emergency Submit
  function handleEmergencySubmit(e) {
    e.preventDefault();
    const amount = Number(emergencyForm.amount) || 2000;
    const days = emergencyForm.categoryName === 'Root Canal' ? 8 : (emergencyForm.categoryName === 'Orthodontic' ? 28 : 7);
    const newCard = {
      id: `apt-${Date.now()}`,
      patientName: emergencyForm.patientName || 'Emergency Walk-in',
      patientPhone: emergencyForm.phone || '9876543210',
      age: 32,
      gender: 'Male',
      doctorName: 'Dr. Bhagwan Rakh',
      date: new Date().toISOString().split('T')[0],
      categoryName: emergencyForm.categoryName,
      status: 'Today',
      totalFee: amount,
      amountPaid: 0,
      amountDue: amount,
      paymentStatus: 'Pending',
      nextAppointmentDays: days,
      isEmergency: true,
      paymentHistory: []
    };

    setCards(prev => [newCard, ...prev]);
    const targetCat = categories.find(c => c.name.toLowerCase() === emergencyForm.categoryName.toLowerCase());
    if (targetCat) {
      setExpandedCategories(prev => ({ ...prev, [targetCat.id]: true }));
    }

    setEmergencyModalOpen(false);
    setEmergencyForm({ patientName: '', phone: '', categoryName: 'Extraction', amount: 2000, notes: '' });
  }

  // Create Category
  async function handleAddCategorySubmit(e) {
    e.preventDefault();
    if (!categoryForm.name) return;

    const newCat = {
      id: `cat-${Date.now()}`,
      name: categoryForm.name.trim(),
      code: categoryForm.code || categoryForm.name.slice(0, 4).toUpperCase(),
      defaultFollowUpDays: Number(categoryForm.followUpDays) || 28,
    };

    setCategories(prev => deduplicateCategories([...prev, newCat]));
    setExpandedCategories(prev => ({ ...prev, [newCat.id]: true }));
    setAddCategoryModalOpen(false);
    setCategoryForm({ name: '', code: '', duration: 30, followUpDays: 28 });

    try {
      await api.createCategory({
        name: categoryForm.name.trim(),
        code: categoryForm.code || categoryForm.name.slice(0, 4).toUpperCase(),
        defaultDurationMinutes: Number(categoryForm.duration) || 30,
        defaultFollowUpDays: Number(categoryForm.followUpDays) || 28,
      }).catch(() => null);
    } catch (err) {
      console.error(err);
    }
  }

  function handleDeletePatientConfirm() {
    if (!deleteConfirmId) return;
    setCards(prev => prev.filter(c => c.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  }

  function handleEditPatientClick(card) {
    const isStandardDoc = ['Dr. Bhagwan Rakh', 'Dr. H M Sanap'].includes(card.doctorName);
    setEditPatientCard(card);
    setEditForm({
      patientName: card.patientName,
      patientPhone: card.patientPhone,
      age: card.age || 30,
      doctorSelect: isStandardDoc ? card.doctorName : 'Other',
      customDoctorName: isStandardDoc ? '' : card.doctorName,
      categoryName: card.categoryName,
      status: card.status,
      totalFee: card.totalFee || 0,
      amountPaid: card.amountPaid || 0,
      nextAppointmentDays: card.nextAppointmentDays || 28,
      date: card.date,
    });
  }

  async function handleEditPatientSubmit(e) {
    e.preventDefault();
    if (!editPatientCard || !editForm || !editForm.patientName) return;

    const assignedDoc = editForm.doctorSelect === 'Other'
      ? (editForm.customDoctorName.trim() || 'Dr. Bhagwan Rakh')
      : editForm.doctorSelect;

    const total = Number(editForm.totalFee) || 0;
    const paid = Number(editForm.amountPaid) || 0;
    const due = Math.max(0, total - paid);

    const updatedName = editForm.patientName.trim();

    setCards(prev => prev.map(c => c.id === editPatientCard.id ? {
      ...c,
      patientName: updatedName,
      patientPhone: editForm.patientPhone.trim(),
      age: Number(editForm.age),
      doctorName: assignedDoc,
      categoryName: editForm.categoryName,
      status: editForm.status,
      totalFee: total,
      amountPaid: paid,
      amountDue: due,
      paymentStatus: due === 0 ? 'Paid' : 'Pending',
      nextAppointmentDays: Number(editForm.nextAppointmentDays),
      date: editForm.date,
    } : c));

    try {
      if (editPatientCard.id && !editPatientCard.id.startsWith('apt-')) {
        await api.updatePatient(editPatientCard.id, {
          name: updatedName,
          phone: editForm.patientPhone.trim(),
          age: Number(editForm.age),
          assignedDoctorName: assignedDoc,
        }).catch(() => null);
      }
    } catch (err) {
      console.error(err);
    }

    setEditPatientCard(null);
  }

  function handleAddPaymentHistory(e) {
    e.preventDefault();
    if (!paymentHistoryCard || !newPaymentForm.amount) return;

    const payAmt = Number(newPaymentForm.amount);
    const payDate = newPaymentForm.date || new Date().toISOString().split('T')[0];

    const newEntry = {
      id: `pay-${Date.now()}`,
      receiptNo: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: payDate,
      mode: newPaymentForm.mode,
      amount: payAmt,
      notes: newPaymentForm.notes || 'Payment Entry',
    };

    setCards(prev => prev.map(c => {
      if (c.id === paymentHistoryCard.id) {
        const updatedPaid = (c.amountPaid || 0) + payAmt;
        const updatedDue = Math.max(0, (c.totalFee || 0) - updatedPaid);
        const updatedHistory = [...(c.paymentHistory || []), newEntry];
        const updatedCard = {
          ...c,
          amountPaid: updatedPaid,
          amountDue: updatedDue,
          paymentStatus: updatedDue === 0 ? 'Paid' : 'Pending',
          paymentHistory: updatedHistory,
        };
        setPaymentHistoryCard(updatedCard);
        return updatedCard;
      }
      return c;
    }));

    setNewPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', mode: 'UPI', notes: '' });
  }

  function handlePrintReceipt(card) {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Payment Receipt — ${card.patientName}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #0f172a; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .clinic-title { font-size: 24px; font-weight: bold; color: #0284c7; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            .table th { background: #f8fafc; }
            .summary { margin-top: 20px; text-align: right; }
            .total { font-size: 18px; font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-title">Dwarka Dental Clinic</div>
              <div style="font-size: 12px; color: #64748b;">Dwarka, New Delhi · Phone: +91 98765 00000</div>
            </div>
            <div>
              <span class="badge">Official Receipt</span>
              <div style="font-size: 11px; margin-top: 5px;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>
          <h3>Patient & Treatment Payment History</h3>
          <p><strong>Patient Name:</strong> ${card.patientName} | <strong>Phone:</strong> ${card.patientPhone}</p>
          <p><strong>Treatment Category:</strong> ${card.categoryName} | <strong>Doctor:</strong> ${card.doctorName || 'Dr. Bhagwan Rakh'}</p>
          
          <table class="table">
            <thead>
              <tr><th>Receipt #</th><th>Date</th><th>Mode</th><th>Notes</th><th>Amount Paid</th></tr>
            </thead>
            <tbody>
              ${(card.paymentHistory || []).map(p => `
                <tr>
                  <td>${p.receiptNo}</td>
                  <td>${p.date}</td>
                  <td>${p.mode}</td>
                  <td>${p.notes || '-'}</td>
                  <td>₹${p.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <p>Total Treatment Fee: ₹${card.totalFee || 0}</p>
            <p>Total Paid: <strong style="color: #16a34a;">₹${card.amountPaid || 0}</strong></p>
            <p class="total">Remaining Balance Due: ₹${card.amountDue || 0}</p>
          </div>

          <div style="margin-top: 50px; text-align: right;">
            <p>____________________</p>
            <p style="font-size: 12px;">Authorized Signatory</p>
          </div>

          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  function handleSendWhatsApp(card) {
    const text = `Hello ${card.patientName},\n\n` +
      `Here is your Payment Statement from *Dwarka Dental Clinic*:\n` +
      `• Treatment: *${card.categoryName}*\n` +
      `• Total Fee: ₹${card.totalFee || 0}\n` +
      `• Total Paid: ₹${card.amountPaid || 0}\n` +
      `• *Remaining Balance Due:* ₹${card.amountDue || 0}\n` +
      `• Next Scheduled Appointment: *${card.date}*\n\n` +
      `Thank you for trusting us with your dental health! 🦷✨`;

    const url = `https://wa.me/91${card.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleRescheduleSubmit(e) {
    e.preventDefault();
    if (!rescheduleModalCard) return;

    const interval = Number(rescheduleForm.intervalDays) || (rescheduleModalCard.categoryName === 'Orthodontic' ? 28 : (rescheduleModalCard.categoryName === 'Root Canal' ? 8 : 14));
    const targetDate = rescheduleForm.date || getDateAfterDays(interval);

    setCards(prev => prev.map(c => c.id === rescheduleModalCard.id ? {
      ...c,
      date: targetDate,
      nextAppointmentDays: interval,
      status: 'Upcoming'
    } : c));

    setRescheduleModalCard(null);
  }

  // Comprehensive Fuzzy Patient Search Filter
  const filteredCards = cards.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanPhone = (c.patientPhone || '').replace(/\D/g, '');
    const cleanQPhone = q.replace(/\D/g, '');

    const nameMatch = (c.patientName || '').toLowerCase().includes(q);
    const phoneMatch = cleanQPhone ? cleanPhone.includes(cleanQPhone) : (c.patientPhone || '').includes(q);
    const doctorMatch = (c.doctorName || '').toLowerCase().includes(q);
    const catMatch = (c.categoryName || '').toLowerCase().includes(q);
    const complaintMatch = (c.chiefComplaint || '').toLowerCase().includes(q);
    const emergencyMatch = (c.emergencyContact?.name || '').toLowerCase().includes(q) || (c.emergencyContact?.phone || '').includes(q);

    return nameMatch || phoneMatch || doctorMatch || catMatch || complaintMatch || emergencyMatch;
  });

  function sortCards(cardList) {
    return [...cardList].sort((a, b) => {
      if (sortBy === 'DATE_ASC') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'NAME_ASC') return a.patientName.localeCompare(b.patientName);
      if (sortBy === 'DUE_DESC') return (b.amountDue || 0) - (a.amountDue || 0);
      if (sortBy === 'STATUS') return a.status.localeCompare(b.status);
      return 0;
    });
  }

  const uniqueCategories = deduplicateCategories(categories);

  return (
    <div className="space-y-6 animate-fade-in pb-16">

      {/* Top Header Bar & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="text-[var(--color-primary-500)]" size={26} />
            Clinical Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Category-based workflow platform & payment management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setAddPatientModalOpen(true); setRegStep(1); }}
            className="btn bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xs rounded-xl cursor-pointer transition-colors"
          >
            <Plus size={16} />
            Full Register Patient
          </button>

          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="btn bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xs rounded-xl cursor-pointer transition-colors"
          >
            <ShieldAlert size={16} />
            Emergency Visit
          </button>

          <button
            onClick={handleExportToExcel}
            className="btn btn-outline border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 rounded-xl cursor-pointer bg-white"
            title="Export Patient Backup Spreadsheet to Excel/CSV"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" /> Export Excel
          </button>

          <button
            onClick={handleResetToDefaults}
            className="btn btn-outline p-2.5 text-xs border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer bg-white"
            title="Reset Data to Defaults"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{cards.length}</p>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Active In-Treatment</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--color-primary-500)] border border-blue-100 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Appointments</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {cards.filter(c => c.status === 'Today').length}
            </p>
            <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">Scheduled for Today</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed Appointments</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {cards.filter(c => c.status === 'Missed').length}
            </p>
            <span className="text-[11px] text-rose-600 font-medium mt-1 inline-block">Requires Follow-up</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* SEARCH BAR & CONTROL BAR */}
      <div className="card p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        
        {/* Live Patient Search Input */}
        <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 flex-1 min-w-[280px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, phone, doctor, complaint or category…"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button onClick={() => handleSearchChange('')} className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={expandAllCategories}
              className="btn btn-outline btn-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
            >
              Expand All Categories
            </button>
            <button
              onClick={collapseAllCategories}
              className="btn btn-outline btn-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
            >
              Collapse All
            </button>
          </div>

          {/* Automatic Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown size={14} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="form-input text-xs py-1.5 px-3 rounded-lg border-slate-200 cursor-pointer font-medium bg-slate-50 text-slate-800"
            >
              <option value="DATE_ASC">📅 Next Visit (Soonest First)</option>
              <option value="NAME_ASC">🔤 Patient Name (A-Z)</option>
              <option value="DUE_DESC">💰 Amount Due (Highest First)</option>
              <option value="STATUS">⚡ Appointment Status</option>
            </select>
          </div>
        </div>

      </div>

      {/* ACTIVE SEARCH RESULTS BANNER */}
      {searchQuery.trim() && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 font-medium">
          <span>
            🔍 Showing search results for <strong>"{searchQuery}"</strong> ({filteredCards.length} matching patient(s))
          </span>
          <button
            onClick={() => handleSearchChange('')}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* LINE-BY-LINE CATEGORIES LIST */}
      <div className="space-y-4">
        {uniqueCategories.map(category => {
          const categoryCards = sortCards(filteredCards.filter(c => {
            const cCat = normalizeCategoryName(c.categoryName).toLowerCase();
            const catName = normalizeCategoryName(category.name).toLowerCase();
            return cCat === catName || cCat.includes(catName) || catName.includes(cCat);
          }));

          const isExpanded = !!expandedCategories[category.id] || searchQuery.trim().length > 0;
          const theme = CATEGORY_THEMES[category.name] || CATEGORY_THEMES['default'];
          const totalCategoryDue = categoryCards.reduce((acc, curr) => acc + (curr.amountDue || 0), 0);

          if (searchQuery.trim() && categoryCards.length === 0) {
            return null;
          }

          return (
            <div
              key={category.id}
              className={`card overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-xs transition-all border-l-4 ${theme.border}`}
            >
              {/* Category Row Bar */}
              <div
                onClick={() => toggleCategoryExpand(category.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${theme.bgIcon}`}>
                    <Activity size={20} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-slate-900">{category.name}</h3>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                        Interval: {category.name === 'Orthodontic' ? '28 Days' : (category.name === 'Root Canal' ? '8 Days' : `${category.defaultFollowUpDays || 14} Days`)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {categoryCards.length} patient(s) · Total Pending Balance: <span className="font-semibold text-slate-700">₹{totalCategoryDue.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="btn bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Patients' : `View Patients (${categoryCards.length})`}</span>
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                </div>
              </div>

              {/* EXPANDED PATIENT CARDS PANEL */}
              {isExpanded && (
                <div className="p-5 bg-slate-50/70 border-t border-slate-100 animate-fade-in space-y-4">
                  {categoryCards.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                      No patients registered under {category.name}. Click "+ Register Patient" above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryCards.map(card => {
                        const totalFee = card.totalFee || 1;
                        const paid = card.amountPaid || 0;
                        const payPercent = Math.min(100, Math.round((paid / totalFee) * 100));

                        return (
                          <div
                            key={card.id}
                            className="card p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-bold text-xs flex items-center justify-center border border-blue-100 flex-shrink-0">
                                    {card.patientName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                      {card.patientName}
                                      {card.isEmergency && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold">🚨 Urgent</span>}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {card.patientPhone}</p>
                                  </div>
                                </div>

                                {!isAdmin && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditPatientClick(card)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--color-primary-600)] hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Edit Patient Details"
                                    >
                                      <Edit3 size={14} />
                                    </button>

                                    <button
                                      onClick={() => setDeleteConfirmId(card.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Patient Record"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium flex items-center justify-between">
                                <span>Doctor: <strong className="text-slate-800">{card.doctorName || 'Dr. Bhagwan Rakh'}</strong></span>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-600 font-medium flex items-center gap-1">
                                  <CalendarIcon size={13} className="text-slate-400" /> Next: {card.date}
                                </span>
                                <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                                  Every {card.nextAppointmentDays || (card.categoryName === 'Orthodontic' ? 28 : (card.categoryName === 'Root Canal' ? 8 : 14))} days
                                </span>
                              </div>

                              <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    card.status === 'Today' ? 'bg-amber-100 text-amber-800' :
                                    card.status === 'Missed' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {card.status}
                                  </span>

                                  <button
                                    onClick={() => {
                                      setPaymentHistoryCard(card);
                                      setNewPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', mode: 'UPI', notes: '' });
                                    }}
                                    className={`text-[11px] font-bold hover:underline cursor-pointer ${
                                      card.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {card.paymentStatus} (₹{card.amountPaid || 0})
                                  </button>
                                </div>

                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${payPercent === 100 ? 'bg-emerald-500' : 'bg-[var(--color-primary-500)]'}`}
                                    style={{ width: `${payPercent}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                                <div>
                                  <p className="text-[10px] text-slate-500">Total Fee: ₹{card.totalFee || 0}</p>
                                  <p className="text-sm font-black text-slate-900">Due: ₹{card.amountDue}</p>
                                </div>

                                <button
                                  onClick={() => {
                                    setPaymentHistoryCard(card);
                                    setNewPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', mode: 'UPI', notes: '' });
                                  }}
                                  className="text-[11px] font-semibold text-[var(--color-primary-600)] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  History 📄
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => setCallModalCard(card)}
                                className="btn btn-outline btn-xs flex items-center justify-center gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                              >
                                <Phone size={12} /> Call
                              </button>

                              <button
                                onClick={() => {
                                  const days = card.nextAppointmentDays || (card.categoryName === 'Orthodontic' ? 28 : (card.categoryName === 'Root Canal' ? 8 : 14));
                                  setRescheduleModalCard(card);
                                  setRescheduleForm({
                                    date: getDateAfterDays(days),
                                    time: '10:00',
                                    intervalDays: days,
                                  });
                                }}
                                className="btn btn-outline btn-xs flex items-center justify-center gap-1.5 text-xs text-emerald-700 border-slate-200 hover:bg-emerald-50 cursor-pointer"
                              >
                                <CalendarIcon size={12} /> Reschedule
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {searchQuery.trim() && filteredCards.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <Search size={32} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-base text-slate-800">No Patient Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching patient records were found for "<strong>{searchQuery}</strong>". Try searching by full name, phone number, doctor, or treatment complaint.
            </p>
            <button
              onClick={() => handleSearchChange('')}
              className="btn btn-outline btn-sm text-xs font-semibold"
            >
              Clear Search Filter
            </button>
          </div>
        )}

        <button
          onClick={() => setAddCategoryModalOpen(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[var(--color-primary-400)] hover:bg-[var(--color-primary-50)]/30 transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-[var(--color-primary-600)] cursor-pointer bg-white shadow-2xs"
        >
          <Plus size={18} />
          <span className="font-semibold text-sm">Add New Treatment Category</span>
        </button>
      </div>

      {/* 3-STEP GUIDED PATIENT REGISTRATION MODAL WIZARD */}
      <Modal open={addPatientModalOpen} onClose={() => setAddPatientModalOpen(false)} title={`Patient Registration Wizard (Step ${regStep} of 3)`} size="lg">
        <div className="space-y-5">

          {/* Step Progress Tab Bar */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setRegStep(1)}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                regStep === 1 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User size={14} /> Step 1: Personal
            </button>

            <button
              onClick={() => setRegStep(2)}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                regStep === 2 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HeartPulse size={14} /> Step 2: Emergency & Medical
            </button>

            <button
              onClick={() => setRegStep(3)}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                regStep === 3 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <DollarSign size={14} /> Step 3: Treatment & Fee
            </button>
          </div>

          <form onSubmit={handleAddPatientSubmit} className="space-y-4">

            {/* STEP 1: Personal & Demographic & Contact Info */}
            {regStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User size={15} className="text-[var(--color-primary-500)]" /> Personal & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={patientForm.name}
                      onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={patientForm.phone}
                      onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 32"
                      value={patientForm.age}
                      onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={patientForm.gender}
                      onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                      className="form-input text-sm cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={patientForm.bloodGroup}
                      onChange={e => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="patient@gmail.com"
                      value={patientForm.email}
                      onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Residential Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="House No, Sector, Dwarka, New Delhi"
                      value={patientForm.address}
                      onChange={e => setPatientForm({ ...patientForm, address: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (!patientForm.name || !patientForm.phone) {
                        alert('Please fill Patient Name and Mobile Number.');
                        return;
                      }
                      setRegStep(2);
                    }}
                    className="btn bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white btn-sm font-semibold flex items-center gap-1 px-5 cursor-pointer"
                  >
                    Next: Emergency & Medical <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Emergency Contact & Medical Info */}
            {regStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Users size={15} className="text-[var(--color-primary-500)]" /> Emergency Contact & Medical History
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Kumar"
                      value={patientForm.emergencyName}
                      onChange={e => setPatientForm({ ...patientForm, emergencyName: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Relation</label>
                    <select
                      value={patientForm.emergencyRelation}
                      onChange={e => setPatientForm({ ...patientForm, emergencyRelation: e.target.value })}
                      className="form-input text-sm cursor-pointer"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sibling">Sibling</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543299"
                      value={patientForm.emergencyPhone}
                      onChange={e => setPatientForm({ ...patientForm, emergencyPhone: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint / Reason for Visit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toothache, Braces alignment check, Root canal"
                    value={patientForm.chiefComplaint}
                    onChange={e => setPatientForm({ ...patientForm, chiefComplaint: e.target.value })}
                    className="form-input text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies</label>
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Latex, None"
                      value={patientForm.allergies}
                      onChange={e => setPatientForm({ ...patientForm, allergies: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pre-existing Medical Conditions</label>
                    <input
                      type="text"
                      placeholder="e.g. Diabetes, Hypertension, None"
                      value={patientForm.medicalHistory}
                      onChange={e => setPatientForm({ ...patientForm, medicalHistory: e.target.value })}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="btn btn-outline btn-sm font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegStep(3)}
                    className="btn bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white btn-sm font-semibold flex items-center gap-1 px-5 cursor-pointer"
                  >
                    Next: Treatment & Payment <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Treatment Category & Payment Setup */}
            {regStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <DollarSign size={15} className="text-[var(--color-primary-500)]" /> Treatment Category & Payment Setup
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Category *</label>
                    <select
                      value={patientForm.categoryName}
                      onChange={e => handleRegistrationCategoryChange(e.target.value)}
                      className="form-input text-sm cursor-pointer font-bold"
                    >
                      {uniqueCategories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Doctor *</label>
                    <select
                      value={patientForm.doctorSelect}
                      onChange={e => setPatientForm({ ...patientForm, doctorSelect: e.target.value })}
                      className="form-input text-sm cursor-pointer font-medium"
                    >
                      {doctorsList.map(docName => (
                        <option key={docName} value={docName}>{docName}</option>
                      ))}
                      <option value="Other">Other (Specify Name)</option>
                    </select>
                    {patientForm.doctorSelect === 'Other' && (
                      <input
                        type="text"
                        required
                        placeholder="Type Doctor's Full Name"
                        value={patientForm.customDoctorName}
                        onChange={e => setPatientForm({ ...patientForm, customDoctorName: e.target.value })}
                        className="form-input text-xs mt-2 border-violet-300 focus:border-violet-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Next Visit Interval (Days)</label>
                    <input
                      type="number"
                      value={patientForm.nextAppointmentDays}
                      onChange={e => setPatientForm({ ...patientForm, nextAppointmentDays: e.target.value })}
                      className="form-input text-sm font-bold text-violet-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Treatment Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="30000"
                      value={patientForm.totalFee}
                      onChange={e => setPatientForm({ ...patientForm, totalFee: e.target.value })}
                      className="form-input text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Advance Payment (₹)</label>
                    <input
                      type="number"
                      placeholder="5000"
                      value={patientForm.initialPayment}
                      onChange={e => setPatientForm({ ...patientForm, initialPayment: e.target.value })}
                      className="form-input text-sm font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="btn btn-outline btn-sm font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white btn-sm font-bold px-6 shadow-sm cursor-pointer"
                  >
                    Submit & Complete Registration 🎉
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </Modal>

      {/* Detailed Payment History Modal */}
      {paymentHistoryCard && (
        <Modal open={true} onClose={() => setPaymentHistoryCard(null)} title={`Detailed Payment History — ${paymentHistoryCard.patientName}`} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Total Treatment Cost:</p>
                <p className="text-base font-bold text-slate-800">₹{paymentHistoryCard.totalFee || 0}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Total Paid to Date:</p>
                <p className="text-base font-bold text-emerald-600">₹{paymentHistoryCard.amountPaid || 0}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Remaining Balance:</p>
                <p className="text-base font-bold text-rose-600">₹{paymentHistoryCard.amountDue || 0}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handlePrintReceipt(paymentHistoryCard)}
                className="btn btn-outline btn-sm flex items-center gap-1.5 text-xs text-slate-700"
              >
                <Download size={14} /> Download / Print Receipt PDF
              </button>

              <button
                onClick={() => handleSendWhatsApp(paymentHistoryCard)}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-sm flex items-center gap-1.5 text-xs font-semibold"
              >
                <Send size={14} /> Send Directly on WhatsApp
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 text-left">Receipt #</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Mode</th>
                    <th className="p-3 text-left">Notes / Description</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-200">
                  {(paymentHistoryCard.paymentHistory || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentHistoryCard.paymentHistory.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-medium text-slate-700">{p.receiptNo}</td>
                        <td className="p-3">{p.date}</td>
                        <td className="p-3"><span className="badge badge-gray">{p.mode}</span></td>
                        <td className="p-3 text-slate-500">{p.notes}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">₹{p.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isAdmin && (
              <form onSubmit={handleAddPaymentHistory} className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <DollarSign size={14} /> Record Payment by Date:
                </p>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-blue-900 mb-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={newPaymentForm.date}
                      onChange={e => setNewPaymentForm({ ...newPaymentForm, date: e.target.value })}
                      className="form-input text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-blue-900 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={newPaymentForm.amount}
                      onChange={e => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-blue-900 mb-1">Payment Mode</label>
                    <select
                      value={newPaymentForm.mode}
                      onChange={e => setNewPaymentForm({ ...newPaymentForm, mode: e.target.value })}
                      className="form-input text-xs cursor-pointer"
                    >
                      <option value="UPI">UPI (GPay/PhonePe)</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-blue-900 mb-1">Notes / Period</label>
                    <input
                      type="text"
                      placeholder="e.g. Month 2 payment"
                      value={newPaymentForm.notes}
                      onChange={e => setNewPaymentForm({ ...newPaymentForm, notes: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button type="submit" className="btn btn-primary btn-xs font-semibold">
                    + Add Payment & Update Balance
                  </button>
                </div>
              </form>
            )}

          </div>
        </Modal>
      )}

      {/* Edit Patient Details Modal */}
      {editPatientCard && editForm && (
        <Modal open={true} onClose={() => setEditPatientCard(null)} title={`Edit Patient Details — ${editPatientCard.patientName}`} size="md">
          <form onSubmit={handleEditPatientSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.patientName}
                  onChange={e => setEditForm({ ...editForm, patientName: e.target.value })}
                  className="form-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editForm.patientPhone}
                  onChange={e => setEditForm({ ...editForm, patientPhone: e.target.value })}
                  className="form-input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Category</label>
                <select
                  value={editForm.categoryName}
                  onChange={e => {
                    const catName = e.target.value;
                    const defaultDays = catName === 'Orthodontic' ? 28 : (catName === 'Root Canal' ? 8 : 14);
                    setEditForm({ ...editForm, categoryName: catName, nextAppointmentDays: defaultDays, date: getDateAfterDays(defaultDays) });
                  }}
                  className="form-input text-sm cursor-pointer"
                >
                  {uniqueCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Doctor *</label>
                <select
                  value={editForm.doctorSelect}
                  onChange={e => setEditForm({ ...editForm, doctorSelect: e.target.value })}
                  className="form-input text-sm cursor-pointer font-medium"
                >
                  {doctorsList.map(docName => (
                    <option key={docName} value={docName}>{docName}</option>
                  ))}
                  <option value="Other">Other (Specify Name)</option>
                </select>
                {editForm.doctorSelect === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Type Doctor's Full Name"
                    value={editForm.customDoctorName}
                    onChange={e => setEditForm({ ...editForm, customDoctorName: e.target.value })}
                    className="form-input text-xs mt-2 border-violet-300 focus:border-violet-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="form-input text-sm cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Visit Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  className="form-input text-sm cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Fee (₹)</label>
                <input
                  type="number"
                  value={editForm.totalFee}
                  onChange={e => setEditForm({ ...editForm, totalFee: e.target.value })}
                  className="form-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Paid (₹)</label>
                <input
                  type="number"
                  value={editForm.amountPaid}
                  onChange={e => setEditForm({ ...editForm, amountPaid: e.target.value })}
                  className="form-input text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditPatientCard(null)} className="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm font-semibold">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency Visit Modal */}
      <Modal open={emergencyModalOpen} onClose={() => setEmergencyModalOpen(false)} title="🚨 Emergency Patient Registration" size="md">
        <form onSubmit={handleEmergencySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={emergencyForm.patientName}
              onChange={e => setEmergencyForm({ ...emergencyForm, patientName: e.target.value })}
              className="form-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={emergencyForm.phone}
                onChange={e => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                className="form-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Treatment</label>
              <select
                value={emergencyForm.categoryName}
                onChange={e => setEmergencyForm({ ...emergencyForm, categoryName: e.target.value })}
                className="form-input text-sm cursor-pointer"
              >
                {uniqueCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Fee (₹)</label>
            <input
              type="number"
              value={emergencyForm.amount}
              onChange={e => setEmergencyForm({ ...emergencyForm, amount: e.target.value })}
              className="form-input text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEmergencyModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn bg-rose-600 hover:bg-rose-700 text-white btn-sm font-semibold">Register Emergency Patient</button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal open={addCategoryModalOpen} onClose={() => setAddCategoryModalOpen(false)} title="Create New Treatment Category" size="sm">
        <form onSubmit={handleAddCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Teeth Whitening"
              value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="form-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code</label>
              <input
                type="text"
                placeholder="e.g. WHIT"
                value={categoryForm.code}
                onChange={e => setCategoryForm({ ...categoryForm, code: e.target.value })}
                className="form-input text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Days (Interval)</label>
              <input
                type="number"
                value={categoryForm.followUpDays}
                onChange={e => setCategoryForm({ ...categoryForm, followUpDays: e.target.value })}
                className="form-input text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setAddCategoryModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm font-semibold">Create Category</button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      {rescheduleModalCard && (
        <Modal open={true} onClose={() => setRescheduleModalCard(null)} title={`Reschedule — ${rescheduleModalCard.patientName}`} size="sm">
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Appointment Date *</label>
              <input
                type="date"
                required
                value={rescheduleForm.date}
                onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                className="form-input text-sm cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interval in Days (e.g. 28 for Orthodontic, 8 for Root Canal)
              </label>
              <input
                type="number"
                value={rescheduleForm.intervalDays}
                onChange={e => {
                  const val = e.target.value;
                  setRescheduleForm({
                    ...rescheduleForm,
                    intervalDays: val,
                    date: getDateAfterDays(val)
                  });
                }}
                className="form-input text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setRescheduleModalCard(null)} className="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm font-semibold">Confirm Schedule</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Call Modal */}
      {callModalCard && (
        <Modal open={true} onClose={() => setCallModalCard(null)} title={`Call Patient — ${callModalCard.patientName}`} size="sm">
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-[var(--color-primary-600)] flex items-center justify-center mx-auto">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{callModalCard.patientName}</h3>
              <p className="text-sm font-mono text-slate-500 mt-1">{callModalCard.patientPhone}</p>
              <p className="text-xs text-slate-500 mt-2">Category: {callModalCard.categoryName} · Due: ₹{callModalCard.amountDue}</p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <a
                href={`tel:${callModalCard.patientPhone}`}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Phone size={14} /> Direct Call
              </a>
              <button
                onClick={() => handleSendWhatsApp(callModalCard)}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-sm flex items-center gap-1.5"
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Patient Confirmation Modal */}
      <ConfirmModal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeletePatientConfirm}
        title="Delete Patient Record"
        message="Are you sure you want to delete this patient record? This action can be undone by registering them again."
        confirmLabel="Delete Patient"
        variant="danger"
      />

    </div>
  );
}
