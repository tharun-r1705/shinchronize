const Student = require('../models/Student');
const Recruiter = require('../models/Recruiter');
const Admin = require('../models/Admin');
const { calculateReadinessScore } = require('./readinessScore');

const defaultPassword = 'EvolvEd@123';

const upsertStudents = async () => {
  const students = [
    {
      name: 'Vikram Kumar',
      email: 'vikram.kumar@evolved.ai',
      college: 'MIT',
      branch: 'Computer Science',
      year: '3rd Year',
      streakDays: 120,
      badges: ['30-Day Streak', 'Fast Learner', '100 Days Consistency'],
      skillRadar: {
        DSA: 75,
        'Web Dev': 85,
        'AI/ML': 60,
        Cloud: 70,
        Database: 80,
        'System Design': 65,
      },
      projects: [
        {
          title: 'ML Price Predictor',
          githubLink: 'https://github.com/vikram/ml-price-predictor',
          description: 'Machine learning project predicting prices using scikit-learn.',
          tags: ['Python', 'ML', 'scikit-learn'],
          status: 'verified',
          verified: true,
        },
      ],
      codingLogs: [
        {
          platform: 'leetcode',
          activity: 'Solved 5 medium problems',
          minutesSpent: 120,
          problemsSolved: 5,
        },
        {
          platform: 'codeforces',
          activity: 'Participated in contest',
          minutesSpent: 150,
          problemsSolved: 4,
        },
      ],
      certifications: [
        {
          name: 'Coursera AI Specialization',
          provider: 'Coursera',
          status: 'pending',
        },
      ],
      events: [
        {
          name: 'Hackathon Alpha',
          description: '48-hour hackathon focused on fintech solutions.',
          pointsAwarded: 50,
        },
      ],
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@evolved.ai',
      college: 'IIT Delhi',
      branch: 'Electronics',
      year: '4th Year',
      streakDays: 150,
      badges: ['Fast Learner', 'AI Trailblazer'],
      skillRadar: {
        DSA: 82,
        'Web Dev': 78,
        'AI/ML': 90,
        Cloud: 75,
        Database: 80,
        'System Design': 72,
      },
      projects: [
        {
          title: 'E-commerce Recommendation Engine',
          githubLink: 'https://github.com/priya/reco-engine',
          description: 'Recommendation engine leveraging collaborative filtering.',
          tags: ['Python', 'RecSys', 'AI'],
          status: 'verified',
          verified: true,
        },
        {
          title: 'Real-time Sentiment Analyzer',
          githubLink: 'https://github.com/priya/sentiment-analyzer',
          description: 'Real-time sentiment analysis using streaming data.',
          tags: ['Node.js', 'WebSockets'],
          status: 'pending',
        },
      ],
      codingLogs: [
        {
          platform: 'leetcode',
          activity: 'Daily challenge streak maintained',
          minutesSpent: 90,
          problemsSolved: 3,
        },
      ],
      certifications: [
        {
          name: 'AWS Cloud Practitioner',
          provider: 'AWS',
          status: 'verified',
          verified: true,
        },
      ],
      events: [
        {
          name: 'Women in Tech Summit',
          description: 'Presented on responsible AI.',
          pointsAwarded: 40,
        },
      ],
    },
  ];

  for (const studentData of students) {
    const existing = await Student.findOne({ email: studentData.email }).select('+password');
    if (existing) {
      continue;
    }

    const student = new Student({ ...studentData, password: defaultPassword });
    await student.save();

    const { total, breakdown } = calculateReadinessScore(student);
    student.readinessScore = total;
    student.readinessHistory.push({ score: total });
    student.markModified('skillRadar');
    await student.save();

    console.log(`Seeded student ${student.email} (score ${total})`, breakdown);
  }
};

const upsertRecruiters = async () => {
  const recruiters = [
    {
      name: 'John Recruiter',
      email: 'john@talenthunt.com',
      company: 'Talent Hunt Inc',
      role: 'Senior Talent Acquisition',
      savedCandidates: [],
    },
    {
      name: 'Sara Hiring',
      email: 'sara@hirenow.ai',
      company: 'HireNow AI',
      role: 'Hiring Manager',
      savedCandidates: [],
    },
  ];

  for (const recruiterData of recruiters) {
    const existing = await Recruiter.findOne({ email: recruiterData.email });
    if (existing) continue;

    const recruiter = new Recruiter({ ...recruiterData, password: defaultPassword });
    await recruiter.save();
    console.log(`Seeded recruiter ${recruiter.email}`);
  }
};

const upsertAdmins = async () => {
  const admins = [
    {
      name: 'Anita Verifier',
      email: 'anita@evolved.ai',
    },
    {
      name: 'Carlos Admin',
      email: 'carlos@evolved.ai',
    },
  ];

  for (const adminData of admins) {
    const existing = await Admin.findOne({ email: adminData.email });
    if (existing) continue;

    const admin = new Admin({ ...adminData, password: defaultPassword });
    await admin.save();
    console.log(`Seeded admin ${admin.email}`);
  }
};

const seedDemoData = async () => {
  try {
    const [studentCount, recruiterCount, adminCount] = await Promise.all([
      Student.estimatedDocumentCount(),
      Recruiter.estimatedDocumentCount(),
      Admin.estimatedDocumentCount(),
    ]);

    if (studentCount === 0) {
      await upsertStudents();
    } else {
      console.log(`ℹ️ Skipping student demo seed (found ${studentCount} existing records)`);
    }

    if (recruiterCount === 0) {
      await upsertRecruiters();
    } else {
      console.log(`ℹ️ Skipping recruiter demo seed (found ${recruiterCount} existing records)`);
    }

    if (adminCount === 0) {
      await upsertAdmins();
    } else {
      console.log(`ℹ️ Skipping admin demo seed (found ${adminCount} existing records)`);
    }

    console.log('✅ Demo data seeding complete (default password: EvolvEd@123)');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error.message);
  }
};

module.exports = seedDemoData;
