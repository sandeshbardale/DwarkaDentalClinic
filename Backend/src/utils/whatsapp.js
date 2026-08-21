const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const LOG_FILE = path.join(__dirname, '..', '..', 'reminders.log');

/**
 * Sends a WhatsApp reminder using Twilio. Fallbacks to writing to reminders.log if credentials aren't set.
 * @param {object} params
 * @param {string} params.phone - Patient's phone number
 * @param {string} params.patientName - Patient's name
 * @param {string} params.date - Appointment date (YYYY-MM-DD)
 * @param {string} params.time - Appointment time (HH:MM)
 * @param {string} params.doctorName - Doctor's name
 * @returns {Promise<{success: boolean, simulated: boolean, messageId?: string}>}
 */
async function sendWhatsAppReminder({ phone, patientName, date, time, doctorName }) {
  // Format message: "Tumcha appointment udya aahe" (Your appointment is tomorrow)
  const message = `Namaskar ${patientName}, Dwarka Dental Clinic kadun reminder: Tumcha appointment udya (${date}) vel ${time} la ${doctorName} sobat fix aahe. Dhanyawad!`;
  
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+14155238886'; // Default Twilio sandbox number

  const hasCredentials = sid && token;

  if (hasCredentials) {
    try {
      const client = twilio(sid, token);
      
      // Clean phone number (ensure + prefix, default to Indian code if length is 10)
      let cleanedPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanedPhone.length === 10) {
        cleanedPhone = `+91${cleanedPhone}`;
      } else if (!cleanedPhone.startsWith('+')) {
        cleanedPhone = `+${cleanedPhone}`;
      }

      const response = await client.messages.create({
        from: `whatsapp:${twilioPhone}`,
        to: `whatsapp:${cleanedPhone}`,
        body: message,
      });

      // Log sent reminder to file
      const logEntry = `[${new Date().toISOString()}] REAL SENT TO ${cleanedPhone}: "${message}" (Twilio Msg SID: ${response.sid})\n`;
      fs.appendFileSync(LOG_FILE, logEntry);

      return { success: true, simulated: false, messageId: response.sid };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      const logEntry = `[${new Date().toISOString()}] TWILIO ERROR for ${phone}: "${error.message}"\n`;
      fs.appendFileSync(LOG_FILE, logEntry);
      // Fallback to simulated on error
      return { success: false, simulated: true, error: error.message };
    }
  } else {
    // Simulated sending
    const logEntry = `[${new Date().toISOString()}] SIMULATED REMINDER TO ${phone}: "${message}" (Twilio config missing)\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
    return { success: true, simulated: true };
  }
}

module.exports = {
  sendWhatsAppReminder,
};
