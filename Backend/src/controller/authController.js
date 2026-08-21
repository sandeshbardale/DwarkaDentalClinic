const { User } = require('../database');

const demoUsers = [
  { id: 'demo-admin', name: 'Administrator', email: 'admin@dwarkadental.com', password: 'admin123', role: 'admin' },
  { id: 'demo-doctor', name: 'Dr. Neha Sharma', email: 'doctor@dwarkadental.com', password: 'doctor123', role: 'doctor', specialization: 'General Dentistry' },
  { id: 'demo-receptionist', name: 'Priya Patel', email: 'receptionist@dwarkadental.com', password: 'recep123', role: 'receptionist' },
];

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Allows the documented demo accounts to work when the local server is
    // running without the optional MongoDB Atlas connection.
    if (!req.app.locals.databaseAvailable) {
      const demoUser = demoUsers.find((candidate) =>
        candidate.email === normalizedEmail && candidate.password === password,
      );

      if (!demoUser) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const { password: _password, ...userResponse } = demoUser;
      return res.json({ success: true, user: userResponse, role: demoUser.role, demoMode: true });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Please contact admin.' });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      specialization: user.specialization,
    };

    return res.json({
      success: true,
      user: userResponse,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

module.exports = {
  login,
};
