// ONE-TIME USE ONLY: Create admin user endpoint
// DELETE THIS FILE after using it once!

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Secret key to prevent abuse - change this!
const SECRET_KEY = 'create-admin-now-2024';

router.post('/create-admin-once', async (req, res) => {
  try {
    // Check secret key
    if (req.body.secret !== SECRET_KEY) {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@signcompany.com' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists. Delete this endpoint now!' });
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@signcompany.com',
      password: 'admin123',
      role: 'admin',
      phone: '555-0123',
      company: 'Sign Company Dashboard',
      address: '123 Admin St',
      isActive: true
    });

    res.json({
      success: true,
      message: 'Admin user created successfully!',
      credentials: {
        email: 'admin@signcompany.com',
        password: 'admin123'
      },
      warning: 'DELETE the createAdminOnce.js file and remove this route NOW!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
