/**
 * Redux store — modular configuration.
 *
 * Server state (data fetching, caching) → RTK Query via apiSlice (src/services/apiSlice.js)
 * Client state (auth, UI, feature data) → individual slices below
 */
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../services/apiSlice';
import patientsReducer, { setPatientsList } from '../features/patients/patientsSlice';
import appointmentsReducer, { setAppointmentsList } from '../features/appointments/appointmentsSlice';

// Import feature API definitions so their endpoints are registered when the store loads
import '../features/patients/patientsApi';
import '../features/appointments/appointmentsApi';

// ─── Session Rehydration ──────────────────────────────────────────────────────
// Restore auth state from localStorage so page refresh doesn't log the user out.
function loadSessionFromStorage() {
  try {
    const raw = localStorage.getItem('ddc:session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.user && session.role) {
      return { user: session.user, role: session.role, isAuthenticated: true, isLoading: false, error: null };
    }
  } catch (_) {}
  return null;
}

const savedSession = loadSessionFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState: savedSession || {
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

// ─── UI Slice ──────────────────────────────────────────────────────────────────
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
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    toggleMobileSidebar(state) { state.sidebarMobileOpen = !state.sidebarMobileOpen; },
    closeMobileSidebar(state) { state.sidebarMobileOpen = false; },
    addToast(state, action) {
      state.toasts.push({ id: Date.now(), ...action.payload });
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
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

// ─── Notification Slice ────────────────────────────────────────────────────────
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: [] },
  reducers: {
    setNotifications(state, action) { state.list = action.payload; },
    markAsRead(state, action) {
      const n = state.list.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },
    markAllAsRead(state) {
      state.list.forEach((n) => { n.read = true; });
    },
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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// ─── Action Exports ───────────────────────────────────────────────────────────
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export const {
  toggleSidebar, toggleMobileSidebar, closeMobileSidebar,
  addToast, removeToast, openModal, closeModal,
} = uiSlice.actions;
export const { setNotifications, markAsRead, markAllAsRead } = notificationSlice.actions;

// ─── Compat Thunks ─────────────────────────────────────────────────────────────
// These thunks fetch data from the backend and populate the slice list fields.
// The API now returns JSON arrays directly (no wrapper), so we use the response as-is.
// Pages can be incrementally migrated to RTK Query hooks (useGetPatientsQuery etc.)
// once this compat layer is no longer needed.

export const fetchPatientsList = () => async (dispatch) => {
  try {
    const res = await fetch('/api/patients');
    const json = await res.json();
    // json is either a plain array or { success, message, data }
    const list = Array.isArray(json) ? json : (json.data ?? []);
    dispatch(setPatientsList(list));
  } catch (err) {
    console.error('fetchPatientsList thunk failed:', err);
    dispatch(setPatientsList([]));
  }
};

export const fetchAppointmentsList = () => async (dispatch) => {
  try {
    const res = await fetch('/api/appointments');
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data ?? []);
    dispatch(setAppointmentsList(list));
  } catch (err) {
    console.error('fetchAppointmentsList thunk failed:', err);
    dispatch(setAppointmentsList([]));
  }
};

export const savePatientThunk = (patientData) => async (dispatch) => {
  const res = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to register patient.');
  // Refresh the list after creation
  dispatch(fetchPatientsList());
  dispatch(apiSlice.util.invalidateTags(['Patient']));
  return json;
};

export const bookAppointmentThunk = (aptData) => async (dispatch) => {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aptData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to book appointment.');
  dispatch(fetchAppointmentsList());
  dispatch(apiSlice.util.invalidateTags(['Appointment']));
  return json;
};

export const updateAppointmentStatusThunk =
  (id, status, nextDate, nextTime, notes) => async (dispatch) => {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, nextDate, nextTime, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update appointment.');
    dispatch(fetchAppointmentsList());
    dispatch(apiSlice.util.invalidateTags(['Appointment', 'Patient']));
    return json;
  };

// Legacy no-op action creators (kept so existing imports don't break)
export const addPatient = () => ({});
export const updatePatient = () => ({});
export const addAppointment = () => ({});
export const updateAppointment = () => ({});
export const setPatients = () => ({});
export const setAppointments = () => ({});
export const setSearchQuery = (q) => setPatientsList; // no-op shim
export const setFilterStatus = (s) => ({}); // no-op shim

export default store;
