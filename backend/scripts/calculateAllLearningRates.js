/**
 * Script to calculate learning rates for all students
 * Run this to populate learning metrics for existing students
 * 
 * Usage: node scripts/calculateAllLearningRates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const { calculateLearningRate, saveLearningRate } = require('../services/learningRateService');

async function calculateAllLearningRates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shinchronize';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all students
    const students = await Student.find({}).select('_id name email learningMetrics');
    console.log(`Found ${students.length} students`);

    let calculated = 0;
    let skipped = 0;
    let errors = 0;

    for (const student of students) {
      try {
        console.log(`\nProcessing: ${student.name || student.email} (${student._id})`);
        
        // Calculate learning rate
        const metrics = await calculateLearningRate(student._id);
        
        if (metrics.learningRate !== null) {
          // Save the metrics
          await saveLearningRate(student._id, metrics);
          console.log(`  ✓ Learning Rate: ${metrics.learningRate} (${metrics.learningCategory})`);
          calculated++;
        } else {
          console.log(`  ⚠ Insufficient data: ${metrics.message}`);
          // Still save the "not_determined" status
          await saveLearningRate(student._id, metrics);
          skipped++;
        }
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
        errors++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total students: ${students.length}`);
    console.log(`Successfully calculated: ${calculated}`);
    console.log(`Insufficient data: ${skipped}`);
    console.log(`Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

calculateAllLearningRates();
