const { Patient, Appointment } = require('../database');
const { calculateNextAppointmentDate } = require('../utils/scheduler');

async function getPatients(req, res) {
  try {
    const patients = await Patient.findAll({
      where: { isDeleted: false },
      order: [['registeredAt', 'DESC']],
    });

    const parsedPatients = patients.map(p => {
      const pJson = p.toJSON();
      try {
        pJson.emergencyContact = pJson.emergencyContact ? JSON.parse(pJson.emergencyContact) : null;
      } catch (e) {
        pJson.emergencyContact = null;
      }
      return pJson;
    });

    return res.json(parsedPatients);
  } catch (error) {
    console.error('Fetch patients error:', error);
    return res.status(500).json({ error: 'Failed to fetch patients.' });
  }
}

async function addPatient(req, res) {
  try {
    const {
      name, age, dob, gender, phone, email, address,
      emergencyContact, bloodGroup, assignedDoctorId,
      chiefComplaint, allergies, medicalHistory,
      // Appointment fields from registration
      appointmentDate, appointmentTime, appointmentType, notes
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone number are required.' });
    }

    // Auto-generate ID and Patient Number
    const id = `PAT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const randNum = Math.floor(Math.random() * 9000) + 1000;
    const patientId = `DWK-2026-${randNum}`;

    const registeredAt = new Date().toISOString().split('T')[0];

    const emergencyStr = emergencyContact ? JSON.stringify(emergencyContact) : null;

    const patient = await Patient.create({
      id,
      patientId,
      name,
      age: age ? parseInt(age) : null,
      dob,
      gender,
      phone,
      email,
      address,
      emergencyContact: emergencyStr,
      bloodGroup,
      registeredAt,
      assignedDoctorId,
      status: 'new',
      chiefComplaint,
      allergies: allergies || 'None',
      medicalHistory: medicalHistory || 'No significant medical history',
      totalVisits: 0,
    });

    let initialApt = null;
    if (appointmentDate && appointmentTime && assignedDoctorId) {
      const aptId = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Look up doctor name
      const { User } = require('../database');
      const doc = await User.findByPk(assignedDoctorId);
      const doctorName = doc ? doc.name : 'Dr. General Dentist';

      initialApt = await Appointment.create({
        id: aptId,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: assignedDoctorId,
        doctorName: doctorName,
        date: appointmentDate,
        time: appointmentTime,
        type: appointmentType || 'Consultation',
        reason: chiefComplaint || '',
        status: 'scheduled',
        notes: notes || '',
      });
    }

    const patientJson = patient.toJSON();
    patientJson.emergencyContact = emergencyContact;

    return res.status(201).json({
      success: true,
      patient: patientJson,
      appointment: initialApt,
    });
  } catch (error) {
    console.error('Add patient error:', error);
    return res.status(500).json({ error: 'Failed to register patient.' });
  }
}

async function updatePatient(req, res) {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);
    if (!patient || patient.isDeleted) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const fieldsToUpdate = req.body;
    if (fieldsToUpdate.emergencyContact) {
      fieldsToUpdate.emergencyContact = JSON.stringify(fieldsToUpdate.emergencyContact);
    }

    await patient.update(fieldsToUpdate);

    const updated = patient.toJSON();
    try {
      updated.emergencyContact = updated.emergencyContact ? JSON.parse(updated.emergencyContact) : null;
    } catch (e) {
      updated.emergencyContact = null;
    }

    return res.json({ success: true, patient: updated });
  } catch (error) {
    console.error('Update patient error:', error);
    return res.status(500).json({ error: 'Failed to update patient details.' });
  }
}

async function softDeletePatient(req, res) {
  try {
    const { id } = req.params;
    
    // Authorization check is usually in router middleware, but let's verify here too
    const role = req.headers['x-user-role'];
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin-only action.' });
    }

    const patient = await Patient.findByPk(id);
    if (!patient || patient.isDeleted) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    await patient.update({ isDeleted: true });
    return res.json({ success: true, message: 'Patient record soft deleted successfully.' });
  } catch (error) {
    console.error('Delete patient error:', error);
    return res.status(500).json({ error: 'Failed to delete patient.' });
  }
}

module.exports = {
  getPatients,
  addPatient,
  updatePatient,
  softDeletePatient,
};
