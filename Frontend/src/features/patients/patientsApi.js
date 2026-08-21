/**
 * patientsApi.js — RTK Query endpoints for the patients domain.
 * Injected into the shared apiSlice so the cache is unified.
 */
import { apiSlice } from '../../services/apiSlice';

export const patientsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /api/patients */
    getPatients: builder.query({
      query: () => '/patients',
      transformResponse: (res) => res.data,
      providesTags: ['Patient'],
    }),

    /** POST /api/patients */
    addPatient: builder.mutation({
      query: (body) => ({ url: '/patients', method: 'POST', body }),
      transformResponse: (res) => res.data,
      invalidatesTags: ['Patient'],
    }),

    /** PUT /api/patients/:id */
    updatePatient: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/patients/${id}`, method: 'PUT', body }),
      transformResponse: (res) => res.data,
      invalidatesTags: ['Patient'],
    }),

    /** DELETE /api/patients/:id */
    deletePatient: builder.mutation({
      query: (id) => ({ url: `/patients/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Patient'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPatientsQuery,
  useAddPatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
} = patientsApi;
