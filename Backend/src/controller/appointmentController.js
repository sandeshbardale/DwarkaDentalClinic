const { Appointment, Patient, User } = require('../database');
const { calculateNextAppointmentDate } = require('../utils/scheduler');

async function getAppointments(req, res) {
  try {
    const appointments = await Appointment.findAll({
      where: { isDeleted: false },
      order: [['date', 'DESC'], ['time', 'ASC']],
    });
    return res.json(appointments);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
}

async function bookAppointment(req, res) {
  try {
    const { patientId, doctorId, date, time, type, reason, notes, isEmergency } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ error: 'Patient, Doctor, Date, and Time are required.' });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient || patient.isDeleted) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const doctor = await User.findByPk(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const aptId = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Emergency rules: high priority, immediate status, custom notes
    const actualStatus = isEmergency ? 'confirmed' : 'scheduled';
    const actualNotes = isEmergency
      ? `[EMERGENCY VISIT - HIGH PRIORITY] ${notes || ''}`
      : notes || '';
    const actualType = isEmergency ? 'Emergency' : type || 'Consultation';

    const appointment = await Appointment.create({
      id: aptId,
      patientId,
      patientName: patient.name,
      doctorId,
      doctorName: doctor.name,
      date: isEmergency ? new Date().toISOString().split('T')[0] : date,
      time,
      type: actualType,
      reason: reason || (isEmergency ? 'Emergency treatment required' : ''),
      status: actualStatus,
      notes: actualNotes,
    });

    // Update patient status to active or follow-up
    await patient.update({
      status: isEmergency ? 'active' : patient.status === 'new' ? 'new' : 'active',
      assignedDoctorId: doctorId,
    });

    return res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    return res.status(500).json({ error: 'Failed to book appointment.' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, nextDate, nextTime, notes } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment || appointment.isDeleted) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const oldStatus = appointment.status;
    const updateData = { status };
    if (notes !== undefined) updateData.notes = notes;
    await appointment.update(updateData);

    let followUpApt = null;

    // ✔ Patient aala (Visited) -> Mark as Visited/Completed -> Next visit auto calculate
    if (status === 'completed' && oldStatus !== 'completed') {
      const patient = await Patient.findByPk(appointment.patientId);
      if (patient) {
        const nextVisits = (patient.totalVisits || 0) + 1;
        const nextVisitDate = calculateNextAppointmentDate(appointment.date, appointment.type);

        await patient.update({
          lastVisit: appointment.date,
          nextFollowUp: nextVisitDate || null,
          totalVisits: nextVisits,
          status: 'follow-up',
        });

        // Auto schedule follow-up appointment
        if (nextVisitDate) {
          const followUpId = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          followUpApt = await Appointment.create({
            id: followUpId,
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            date: nextVisitDate,
            time: appointment.time, // Carry over time
            type: appointment.type,
            reason: `Auto-scheduled follow-up for ${appointment.type}`,
            status: 'scheduled',
            notes: `Next visit auto calculated based on ${appointment.type} workflow.`,
          });
        }
      }
    }

    // ✔ Patient nahi aala (Reschedule) -> New date set
    if (status === 'rescheduled' || (status === 'scheduled' && nextDate && nextTime)) {
      await appointment.update({
        date: nextDate || appointment.date,
        time: nextTime || appointment.time,
        status: 'scheduled',
        notes: `${appointment.notes || ''} [Rescheduled on ${new Date().toISOString().split('T')[0]}]`,
      });

      const patient = await Patient.findByPk(appointment.patientId);
      if (patient) {
        await patient.update({
          nextFollowUp: nextDate || appointment.date,
        });
      }
    }

    return res.json({
      success: true,
      appointment,
      followUpAppointment: followUpApt,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ error: 'Failed to update appointment.' });
  }
}

async function softDeleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const role = req.headers['x-user-role'];
    
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin-only action.' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment || appointment.isDeleted) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    await appointment.update({ isDeleted: true });
    return res.json({ success: true, message: 'Appointment soft deleted successfully.' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return res.status(500).json({ error: 'Failed to delete appointment.' });
  }
}

module.exports = {
  getAppointments,
  bookAppointment,
  updateAppointmentStatus,
  softDeleteAppointment,
};
