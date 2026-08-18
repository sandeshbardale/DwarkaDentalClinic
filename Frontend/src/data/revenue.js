/**
 * Mock revenue data for admin analytics.
 */

export const MOCK_REVENUE = {
  summary: {
    daily: 18400,
    weekly: 92500,
    monthly: 247800,
    yearly: 2184000,
    pendingPayments: 34200,
    refunds: 5600,
  },

  monthly: [
    { month: 'Jan', revenue: 185000, target: 180000, treatments: 142 },
    { month: 'Feb', revenue: 172000, target: 180000, treatments: 131 },
    { month: 'Mar', revenue: 198000, target: 190000, treatments: 158 },
    { month: 'Apr', revenue: 210000, target: 190000, treatments: 169 },
    { month: 'May', revenue: 195000, target: 200000, treatments: 152 },
    { month: 'Jun', revenue: 223000, target: 200000, treatments: 178 },
    { month: 'Jul', revenue: 240000, target: 220000, treatments: 195 },
    { month: 'Aug', revenue: 247800, target: 230000, treatments: 201 },
  ],

  byTreatment: [
    { name: 'Root Canal', value: 68400, color: '#0b6ba7' },
    { name: 'Implants', value: 52000, color: '#0d9c8e' },
    { name: 'Orthodontics', value: 44600, color: '#f59e0b' },
    { name: 'Extractions', value: 28800, color: '#ef4444' },
    { name: 'Cleaning & Scaling', value: 22400, color: '#8b5cf6' },
    { name: 'Fillings', value: 18200, color: '#10b981' },
    { name: 'Dentures', value: 13400, color: '#64748b' },
  ],

  recentTransactions: [
    { id: 'TXN-001', date: '2024-08-18', patientName: 'Sneha Kulkarni', treatment: 'Root Canal', amount: 12000, status: 'paid', method: 'UPI' },
    { id: 'TXN-002', date: '2024-08-18', patientName: 'Lakshmi Nair', treatment: 'Implant Consultation', amount: 900, status: 'paid', method: 'Card' },
    { id: 'TXN-003', date: '2024-08-18', patientName: 'Divya Nanda', treatment: 'Cavity Filling', amount: 3200, status: 'pending', method: 'Cash' },
    { id: 'TXN-004', date: '2024-08-17', patientName: 'Manish Tiwari', treatment: 'Dental Implant', amount: 28000, status: 'partial', method: 'Card' },
    { id: 'TXN-005', date: '2024-08-17', patientName: 'Sunita Agarwal', treatment: 'Root Canal', amount: 10500, status: 'paid', method: 'UPI' },
    { id: 'TXN-006', date: '2024-08-16', patientName: 'Ramesh Chandra', treatment: 'Denture Fitting', amount: 15000, status: 'pending', method: 'Cash' },
    { id: 'TXN-007', date: '2024-08-16', patientName: 'Aarav Patil', treatment: 'Orthodontic Consultation', amount: 600, status: 'paid', method: 'UPI' },
    { id: 'TXN-008', date: '2024-08-15', patientName: 'Preethi Rajan', treatment: 'Teeth Whitening', amount: 8000, status: 'paid', method: 'Card' },
    { id: 'TXN-009', date: '2024-08-15', patientName: 'Anita Joshi', treatment: 'Orthodontic Consultation', amount: 600, status: 'refunded', method: 'UPI' },
    { id: 'TXN-010', date: '2024-08-14', patientName: 'Gaurav Singh', treatment: 'Root Canal Follow-up', amount: 600, status: 'paid', method: 'Cash' },
  ],
};
