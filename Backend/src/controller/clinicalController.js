const { ClinicalRecord, Patient, User } = require('../database');

async function getClinicalRecordsByPatient(req, res) {
  try {
    const { patientId } = req.params;
    const records = await ClinicalRecord.findAll({
      where: { patientId, isDeleted: false },
      order: [['visitDate', 'DESC']],
    });

    const parsedRecords = records.map(r => {
      const rJson = r.toJSON();
      try {
        rJson.prescription = rJson.prescription ? JSON.parse(rJson.prescription) : [];
      } catch (e) {
        rJson.prescription = [];
      }
      return rJson;
    });

    return res.json(parsedRecords);
  } catch (error) {
    console.error('Fetch clinical records error:', error);
    return res.status(500).json({ error: 'Failed to fetch clinical records.' });
  }
}

async function addClinicalRecord(req, res) {
  try {
    const {
      patientId, appointmentId, doctorId, chiefComplaint,
      diagnosis, treatment, clinicalNotes, followUpDate,
      followUpInstructions, prescription
    } = req.body;

    if (!patientId || !doctorId || !diagnosis || !treatment) {
      return res.status(400).json({ error: 'Patient ID, Doctor ID, Diagnosis, and Treatment are required.' });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient || patient.isDeleted) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const doctor = await User.findByPk(doctorId);
    const doctorName = doctor ? doctor.name : 'Dr. Dentist';

    const recordId = `CLN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const visitDate = new Date().toISOString().split('T')[0];

    const prescriptionStr = prescription ? JSON.stringify(prescription) : null;

    const record = await ClinicalRecord.create({
      id: recordId,
      patientId,
      appointmentId: appointmentId || null,
      doctorId,
      doctorName,
      visitDate,
      chiefComplaint: chiefComplaint || patient.chiefComplaint || '',
      diagnosis,
      treatment,
      clinicalNotes: clinicalNotes || '',
      followUpDate: followUpDate || null,
      followUpInstructions: followUpInstructions || '',
      prescription: prescriptionStr,
      status: 'completed',
    });

    // Update the patient's record summary (last visit, next follow up, status, increment visits)
    await patient.update({
      lastVisit: visitDate,
      nextFollowUp: followUpDate || patient.nextFollowUp || null,
      status: followUpDate ? 'follow-up' : 'completed',
      chiefComplaint: chiefComplaint || patient.chiefComplaint,
      totalVisits: (patient.totalVisits || 0) + 1,
    });

    // If an appointmentId was passed, mark that appointment as completed
    if (appointmentId) {
      const { Appointment } = require('../database');
      const apt = await Appointment.findByPk(appointmentId);
      if (apt) {
        await apt.update({ status: 'completed' });
      }
    }

    const recordJson = record.toJSON();
    recordJson.prescription = prescription || [];

    return res.status(201).json({
      success: true,
      record: recordJson,
    });
  } catch (error) {
    console.error('Add clinical record error:', error);
    return res.status(500).json({ error: 'Failed to create clinical record.' });
  }
}

module.exports = {
  getClinicalRecordsByPatient,
  addClinicalRecord,
};
