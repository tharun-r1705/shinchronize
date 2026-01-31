/**
 * Script to seed learning rates for demo/testing purposes
 * This assigns random learning metrics to all students
 * 
 * Usage: node scripts/seedLearningRates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

// Random learning rate generator
function generateRandomLearningMetrics() {
  // Generate a random learning rate (0-100)
  const learningRate = Math.floor(Math.random() * 101);
  
  // Determine category based on score
  let learningCategory;
  if (learningRate >= 70) {
    learningCategory = 'fast';
  } else if (learningRate >= 40) {
    learningCategory = 'steady';
  } else {
    learningCategory = 'developing';
  }
  
  // Generate random components (roughly averaging to the learningRate)
  const variance = 20;
  const generateComponent = () => {
    const base = learningRate;
    const deviation = Math.floor(Math.random() * variance * 2) - variance;
    return Math.max(0, Math.min(100, base + deviation));
  };
  
  // Random trend
  const trends = ['accelerating', 'steady', 'slowing'];
  const trend = trends[Math.floor(Math.random() * trends.length)];
  
  return {
    learningRate,
    learningCategory,
    components: {
      readinessVelocity: generateComponent(),
      milestoneSpeed: generateComponent(),
      quizPerformance: generateComponent(),
      codingGrowth: generateComponent(),
      skillAcquisition: generateComponent(),
      projectVelocity: generateComponent(),
    },
    calculatedAt: new Date(),
    dataPointsUsed: Math.floor(Math.random() * 5) + 2,
    trend,
    history: [{
      learningRate,
      category: learningCategory,
      calculatedAt: new Date()
    }]
  };
}

async function seedLearningRates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shinchronize';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students`);

    let updated = 0;
    const distribution = { fast: 0, steady: 0, developing: 0 };

    for (const student of students) {
      try {
        const metrics = generateRandomLearningMetrics();
        
        // Use findByIdAndUpdate to bypass validation issues with existing data
        await Student.findByIdAndUpdate(
          student._id,
          { $set: { learningMetrics: metrics } },
          { runValidators: false }
        );
        
        distribution[metrics.learningCategory]++;
        updated++;
        console.log(`✓ ${student.name || student.email}: ${metrics.learningCategory} (${metrics.learningRate})`);
      } catch (error) {
        console.error(`✗ Error updating ${student.name || student.email}: ${error.message}`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total updated: ${updated}`);
    console.log(`Fast learners: ${distribution.fast}`);
    console.log(`Steady learners: ${distribution.steady}`);
    console.log(`Developing: ${distribution.developing}`);

    await mongoose.disconnect();
    console.log('\nDone! Students now have learning rate tags.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

seedLearningRates();
