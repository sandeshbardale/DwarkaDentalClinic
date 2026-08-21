/**
 * appointmentsApi.js — RTK Query endpoints for the appointments domain.
 */
import { apiSlice } from '../../services/apiSlice';

export const appointmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /api/appointments */
    getAppointments: builder.query({
      query: () => '/appointments',
      transformResponse: (res) => res.data,
      providesTags: ['Appointment'],
    }),

    /** POST /api/appointments */
    bookAppointment: builder.mutation({
      query: (body) => ({ url: '/appointments', method: 'POST', body }),
      transformResponse: (res) => res.data,
      invalidatesTags: ['Appointment', 'Patient'],
    }),

    /** PUT /api/appointments/:id/status */
    updateAppointmentStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/appointments/${id}/status`, method: 'PUT', body }),
      transformResponse: (res) => res.data,
      invalidatesTags: ['Appointment', 'Patient'],
    }),

    /** DELETE /api/appointments/:id */
    deleteAppointment: builder.mutation({
      query: (id) => ({ url: `/appointments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Appointment'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAppointmentsQuery,
  useBookAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
} = appointmentsApi;
