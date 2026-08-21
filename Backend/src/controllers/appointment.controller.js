const appointmentService = require('../services/appointment.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/appointments
 */
const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getAllAppointments();
  return new ApiResponse(200, appointments, 'Appointments fetched').send(res);
});

/**
 * POST /api/appointments
 */
const bookAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment(req.body);
  return new ApiResponse(201, { appointment }, 'Appointment booked').send(res);
});

/**
 * PUT /api/appointments/:id/status
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const result = await appointmentService.updateAppointmentStatus(req.params.id, req.body);
  return new ApiResponse(200, result, 'Appointment status updated').send(res);
});

/**
 * DELETE /api/appointments/:id — Admin only.
 * TODO: replace x-user-role check with authMiddleware once auth is implemented.
 */
const softDeleteAppointment = asyncHandler(async (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') throw ApiError.forbidden('Admin-only action.');
  await appointmentService.softDeleteAppointment(req.params.id);
  return new ApiResponse(200, null, 'Appointment soft-deleted').send(res);
});

module.exports = { getAppointments, bookAppointment, updateAppointmentStatus, softDeleteAppointment };
