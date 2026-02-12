/**
 * Migration script to backfill taskNumber/ticketNumber for existing records.
 *
 * Usage:
 *   node backend/scripts/migrateTaskNumbers.js
 *
 * This assigns sequential numbers (ordered by createdAt) to any
 * BugReport or SupportTicket that doesn't already have one.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Counter = require('../models/Counter');
const BugReport = require('../models/BugReport');
const SupportTicket = require('../models/SupportTicket');

async function migrate() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sign-company-dashboard';
  if (!mongoUri) {
    console.error('MONGODB_URI not set in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // --- Bug Reports ---
  const reports = await BugReport.find({ $or: [{ taskNumber: null }, { taskNumber: { $exists: false } }] })
    .sort({ createdAt: 1 })
    .select('_id type');

  console.log(`Found ${reports.length} bug reports without taskNumber`);

  for (const report of reports) {
    const seq = await Counter.getNextSequence('bugReport');
    const prefix = report.type === 'feature' ? 'FR' : 'BUG';
    const taskNumber = `${prefix}-${String(seq).padStart(3, '0')}`;
    await BugReport.updateOne({ _id: report._id }, { $set: { taskNumber } });
    console.log(`  Assigned ${taskNumber} to bug report ${report._id}`);
  }

  // --- Support Tickets ---
  const tickets = await SupportTicket.find({ $or: [{ ticketNumber: null }, { ticketNumber: { $exists: false } }] })
    .sort({ createdAt: 1 })
    .select('_id');

  console.log(`Found ${tickets.length} support tickets without ticketNumber`);

  for (const ticket of tickets) {
    const seq = await Counter.getNextSequence('supportTicket');
    const ticketNumber = `TKT-${String(seq).padStart(3, '0')}`;
    await SupportTicket.updateOne({ _id: ticket._id }, { $set: { ticketNumber } });
    console.log(`  Assigned ${ticketNumber} to support ticket ${ticket._id}`);
  }

  console.log('Migration complete!');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
