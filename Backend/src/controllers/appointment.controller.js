const appointmentService = require('../services/appointment.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/appointments — list with filter/sort/pagination */
const getAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAllAppointments(req.query);
  return new ApiResponse(200, result, 'Appointments fetched').send(res);
});

/** GET /api/appointments/patient/:patientId */
const getByPatient = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getAppointmentsByPatient(req.params.patientId);
  return new ApiResponse(200, appointments, 'Appointments fetched').send(res);
});

/** POST /api/appointments — book appointment */
const bookAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment(req.body, req.user);
  return new ApiResponse(201, appointment, 'Appointment booked successfully').send(res);
});

/** PUT /api/appointments/:id/status — update status */
const updateStatus = asyncHandler(async (req, res) => {
  const result = await appointmentService.updateAppointmentStatus(req.params.id, req.body, req.user);
  return new ApiResponse(200, result, 'Appointment updated').send(res);
});

/** DELETE /api/appointments/:id — soft-delete (Admin only) */
const softDelete = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw ApiError.forbidden('Admin-only action.');
  await appointmentService.softDeleteAppointment(req.params.id);
  return new ApiResponse(200, null, 'Appointment deleted').send(res);
});

module.exports = { getAppointments, getByPatient, bookAppointment, updateStatus, softDelete };
