import { configureStore, createSlice } from '@reduxjs/toolkit';

// ─── Auth Slice ──────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// ─── UI Slice ─────────────────────────────────────────────────────────────────
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    toasts: [],
    activeModal: null,
    modalData: null,
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleMobileSidebar(state) {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },
    closeMobileSidebar(state) {
      state.sidebarMobileOpen = false;
    },
    addToast(state, action) {
      const toast = { id: Date.now(), ...action.payload };
      state.toasts.push(toast);
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    openModal(state, action) {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

// ─── Patient Slice ────────────────────────────────────────────────────────────
const patientSlice = createSlice({
  name: 'patients',
  initialState: {
    list: [],
    selectedPatient: null,
    searchQuery: '',
    filterStatus: 'all',
    isLoading: false,
  },
  reducers: {
    setPatients(state, action) {
      state.list = action.payload;
    },
    setSelectedPatient(state, action) {
      state.selectedPatient = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setFilterStatus(state, action) {
      state.filterStatus = action.payload;
    },
    addPatient(state, action) {
      state.list.unshift(action.payload);
    },
    updatePatient(state, action) {
      const idx = state.list.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
  },
});

// ─── Appointment Slice ────────────────────────────────────────────────────────
const appointmentSlice = createSlice({
  name: 'appointments',
  initialState: {
    list: [],
    filterDate: '',
    filterDoctor: 'all',
    filterStatus: 'all',
    isLoading: false,
  },
  reducers: {
    setAppointments(state, action) {
      state.list = action.payload;
    },
    addAppointment(state, action) {
      state.list.push(action.payload);
    },
    updateAppointment(state, action) {
      const idx = state.list.findIndex(a => a.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
    setFilterDate(state, action) {
      state.filterDate = action.payload;
    },
    setFilterDoctor(state, action) {
      state.filterDoctor = action.payload;
    },
    setAppointmentFilterStatus(state, action) {
      state.filterStatus = action.payload;
    },
  },
});

// ─── Notification Slice ───────────────────────────────────────────────────────
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
  },
  reducers: {
    setNotifications(state, action) {
      state.list = action.payload;
    },
    markAsRead(state, action) {
      const ntf = state.list.find(n => n.id === action.payload);
      if (ntf) ntf.read = true;
    },
    markAllAsRead(state) {
      state.list.forEach(n => { n.read = true; });
    },
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export const { toggleSidebar, toggleMobileSidebar, closeMobileSidebar, addToast, removeToast, openModal, closeModal } = uiSlice.actions;
export const { setPatients, setSelectedPatient, setSearchQuery, setFilterStatus, addPatient, updatePatient } = patientSlice.actions;
export const { setAppointments, addAppointment, updateAppointment, setFilterDate, setFilterDoctor, setAppointmentFilterStatus } = appointmentSlice.actions;
export const { setNotifications, markAsRead, markAllAsRead } = notificationSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    patients: patientSlice.reducer,
    appointments: appointmentSlice.reducer,
    notifications: notificationSlice.reducer,
  },
});

export default store;
