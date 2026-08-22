/**
 * Redux store — modular configuration.
 * JWT token is stored alongside session in localStorage and sent via Authorization header.
 */
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../services/apiSlice';
import patientsReducer, { setPatientsList } from '../features/patients/patientsSlice';
import appointmentsReducer, { setAppointmentsList } from '../features/appointments/appointmentsSlice';

import '../features/patients/patientsApi';
import '../features/appointments/appointmentsApi';

const SESSION_KEY = 'ddc:session';

// ─── Session Rehydration ──────────────────────────────────────────────────────
function loadSessionFromStorage() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session?.user && session?.role) {
      return { user: session.user, role: session.role, token: session.token || null, isAuthenticated: true, isLoading: false, error: null };
    }
  } catch (_) {}
  return null;
}

const savedSession = loadSessionFromStorage();

// ─── Auth Slice ───────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: savedSession || { user: null, role: null, token: null, isAuthenticated: false, isLoading: false, error: null },
  reducers: {
    loginStart(state) { state.isLoading = true; state.error = null; },
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure(state, action) { state.isLoading = false; state.error = action.payload; },
    logout(state) {
      state.user = null; state.role = null; state.token = null;
      state.isAuthenticated = false; state.isLoading = false; state.error = null;
    },
  },
});

// ─── UI Slice ──────────────────────────────────────────────────────────────────
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarCollapsed: false, sidebarMobileOpen: false, toasts: [], activeModal: null, modalData: null },
  reducers: {
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    toggleMobileSidebar(state) { state.sidebarMobileOpen = !state.sidebarMobileOpen; },
    closeMobileSidebar(state) { state.sidebarMobileOpen = false; },
    addToast(state, action) { state.toasts.push({ id: Date.now(), ...action.payload }); },
    removeToast(state, action) { state.toasts = state.toasts.filter((t) => t.id !== action.payload); },
    openModal(state, action) { state.activeModal = action.payload.modal; state.modalData = action.payload.data || null; },
    closeModal(state) { state.activeModal = null; state.modalData = null; },
  },
});

// ─── Notification Slice ────────────────────────────────────────────────────────
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: [] },
  reducers: {
    setNotifications(state, action) { state.list = action.payload; },
    markAsRead(state, action) { const n = state.list.find((x) => x.id === action.payload); if (n) n.read = true; },
    markAllAsRead(state) { state.list.forEach((n) => { n.read = true; }); },
  },
});

// ─── Store ────────────────────────────────────────────────────────────────────
const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    patients: patientsReducer,
    appointments: appointmentsReducer,
    notifications: notificationSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

// ─── Action Exports ───────────────────────────────────────────────────────────
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export const { toggleSidebar, toggleMobileSidebar, closeMobileSidebar, addToast, removeToast, openModal, closeModal } = uiSlice.actions;
export const { setNotifications, markAsRead, markAllAsRead } = notificationSlice.actions;

// ─── Authenticated fetch helper (used by thunks) ─────────────────────────────
function authFetch(endpoint, options = {}) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const token = raw ? JSON.parse(raw)?.token : null;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`/api${endpoint}`, { ...options, headers });
  } catch {
    return fetch(`/api${endpoint}`, options);
  }
}

// ─── Compat Thunks ─────────────────────────────────────────────────────────────
export const fetchPatientsList = (params = {}) => async (dispatch) => {
  try {
    const q = new URLSearchParams(params).toString();
    const res = await authFetch(`/patients${q ? '?' + q : ''}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data?.data ?? json.data ?? []);
    dispatch(setPatientsList(Array.isArray(list) ? list : []));
  } catch (err) {
    console.error('fetchPatientsList thunk failed:', err);
    dispatch(setPatientsList([]));
  }
};

export const fetchAppointmentsList = (params = {}) => async (dispatch) => {
  try {
    const q = new URLSearchParams(params).toString();
    const res = await authFetch(`/appointments${q ? '?' + q : ''}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data?.data ?? json.data ?? []);
    dispatch(setAppointmentsList(Array.isArray(list) ? list : []));
  } catch (err) {
    console.error('fetchAppointmentsList thunk failed:', err);
    dispatch(setAppointmentsList([]));
  }
};

export const savePatientThunk = (patientData) => async (dispatch) => {
  const res = await authFetch('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to register patient.');
  dispatch(fetchPatientsList());
  dispatch(apiSlice.util.invalidateTags(['Patient']));
  return json;
};

export const bookAppointmentThunk = (aptData) => async (dispatch) => {
  const res = await authFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(aptData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to book appointment.');
  dispatch(fetchAppointmentsList());
  dispatch(apiSlice.util.invalidateTags(['Appointment']));
  return json;
};

export const updateAppointmentStatusThunk = (id, status, nextDate, nextTime, notes) => async (dispatch) => {
  const res = await authFetch(`/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, nextDate, nextTime, notes }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update appointment.');
  dispatch(fetchAppointmentsList());
  dispatch(apiSlice.util.invalidateTags(['Appointment', 'Patient']));
  return json;
};

// Legacy no-op shims (keep so existing imports don't break)
export const addPatient = () => ({});
export const updatePatient = () => ({});
export const addAppointment = () => ({});
export const updateAppointment = () => ({});
export const setPatients = () => ({});
export const setAppointments = () => ({});
export const setSearchQuery = () => ({});
export const setFilterStatus = () => ({});

export default store;
