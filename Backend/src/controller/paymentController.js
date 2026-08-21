const { Payment, Patient } = require('../database');
const { sequelize } = require('../database');

async function getPayments(req, res) {
  try {
    const payments = await Payment.findAll({
      where: { isDeleted: false },
      order: [['date', 'DESC']],
    });
    return res.json(payments);
  } catch (error) {
    console.error('Fetch payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments.' });
  }
}

async function addPayment(req, res) {
  try {
    const { appointmentId, patientId, amount, mode, notes, date } = req.body;

    if (!patientId || amount === undefined || !mode) {
      return res.status(400).json({ error: 'Patient ID, amount, and payment mode are required.' });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient || patient.isDeleted) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const payId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const actualDate = date || new Date().toISOString().split('T')[0];

    const payment = await Payment.create({
      id: payId,
      appointmentId: appointmentId || null,
      patientId,
      patientName: patient.name,
      amount: parseFloat(amount),
      date: actualDate,
      mode,
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Add payment error:', error);
    return res.status(500).json({ error: 'Failed to record payment.' });
  }
}

async function softDeletePayment(req, res) {
  try {
    const { id } = req.params;
    const role = req.headers['x-user-role'];

    // Admin-only verification
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin-only action.' });
    }

    const payment = await Payment.findByPk(id);
    if (!payment || payment.isDeleted) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    // Soft delete: hide only, do not destroy
    await payment.update({ isDeleted: true });

    return res.json({
      success: true,
      message: 'Payment record deleted successfully (soft deleted).',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    return res.status(500).json({ error: 'Failed to delete payment record.' });
  }
}

async function getRevenueSummary(req, res) {
  try {
    // Total sum of all non-deleted payments
    const totalPaidResult = await Payment.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      where: { isDeleted: false },
    });

    const totalPaid = totalPaidResult ? parseFloat(totalPaidResult.getDataValue('total') || 0) : 0;

    // Sum of payments grouped by mode
    const byMode = await Payment.findAll({
      attributes: [
        'mode',
        [sequelize.fn('SUM', sequelize.col('amount')), 'value'],
      ],
      where: { isDeleted: false },
      group: ['mode'],
    });

    return res.json({
      totalPaid,
      byMode: byMode.map(m => ({
        mode: m.mode,
        value: parseFloat(m.getDataValue('value') || 0),
      })),
    });
  } catch (error) {
    console.error('Revenue summary error:', error);
    return res.status(500).json({ error: 'Failed to compile revenue summary.' });
  }
}

module.exports = {
  getPayments,
  addPayment,
  softDeletePayment,
  getRevenueSummary,
};
