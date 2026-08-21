/**
 * RTK Query API root slice.
 *
 * All feature-specific endpoint definitions are injected via apiSlice.injectEndpoints()
 * inside their respective feature files (e.g. patientsApi.js, appointmentsApi.js).
 * This keeps feature code co-located without polluting this central file.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Attach x-user-role so the backend admin-only guards work.
      // TODO: replace with a proper Authorization: Bearer <token> header when JWT auth is added.
      try {
        const raw = localStorage.getItem('persist:auth');
        if (raw) {
          const auth = JSON.parse(raw);
          if (auth.role) headers.set('x-user-role', auth.role);
        }
      } catch (_) {}
      return headers;
    },
  }),
  tagTypes: ['Patient', 'Appointment', 'Payment', 'ClinicalRecord', 'AiReport'],
  // Endpoints injected by feature files below
  endpoints: () => ({}),
});
