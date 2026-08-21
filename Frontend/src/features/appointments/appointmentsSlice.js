import { createSlice } from '@reduxjs/toolkit';

/**
 * appointmentsSlice — combines server data list + client-side UI state.
 *
 * The `list` array is populated by the fetchAppointmentsList() compat thunk in store.js.
 * When pages are incrementally migrated to RTK Query (useGetAppointmentsQuery),
 * the list field can be removed and components should read from the query cache.
 */
const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: {
    list: [],           // populated by fetchAppointmentsList compat thunk
    filterDate: '',
    filterDoctor: 'all',
    filterStatus: 'all',
    isLoading: false,
  },
  reducers: {
    setAppointmentsList(state, action) {
      state.list = Array.isArray(action.payload) ? action.payload : [];
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
    setAppointmentsLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setAppointmentsList,
  setFilterDate,
  setFilterDoctor,
  setAppointmentFilterStatus,
  setAppointmentsLoading,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
