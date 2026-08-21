const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    type: { type: String, enum: ['appointment_reminder', 'follow_up', 'payment', 'system'], required: true },
    channel: { type: String, enum: ['in_app', 'whatsapp', 'email', 'sms'], required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' },
    sentAt: Date,
    readAt: Date,
    errorMessage: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipientUserId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
