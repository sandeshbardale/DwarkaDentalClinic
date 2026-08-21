import { createSlice } from '@reduxjs/toolkit';

/**
 * patientsSlice — combines server data list + client-side UI state.
 *
 * The `list` array is populated by the fetchPatientsList() compat thunk in store.js.
 * When pages are incrementally migrated to RTK Query (useGetPatientsQuery),
 * the list field can be removed and components should read from the query cache.
 */
const patientsSlice = createSlice({
  name: 'patients',
  initialState: {
    list: [],           // populated by fetchPatientsList compat thunk
    selectedPatient: null,
    searchQuery: '',
    filterStatus: 'all',
    isLoading: false,
  },
  reducers: {
    setPatientsList(state, action) {
      state.list = Array.isArray(action.payload) ? action.payload : [];
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
    setPatientsLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setPatientsList,
  setSelectedPatient,
  setSearchQuery,
  setFilterStatus,
  setPatientsLoading,
} = patientsSlice.actions;

export default patientsSlice.reducer;
