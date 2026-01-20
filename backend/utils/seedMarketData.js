const mongoose = require('mongoose');
const SkillMarketData = require('../models/SkillMarketData');
const CompanySkillProfile = require('../models/CompanySkillProfile');

const skillsData = [
    {
        skillName: 'React',
        category: 'Frontend',
        demandScore: 92,
        jobCount: 1250000,
        avgSalary: 1200000,
        yoyGrowth: 12,
        trend: 'stable',
        predictedGrowth6m: 5,
        relatedSkills: ['TypeScript', 'Next.js', 'Redux', 'Tailwind CSS']
    },
    {
        skillName: 'Python',
        category: 'AI/ML',
        demandScore: 95,
        jobCount: 1540000,
        avgSalary: 1400000,
        yoyGrowth: 18,
        trend: 'rising',
        predictedGrowth6m: 15,
        relatedSkills: ['PyTorch', 'TensorFlow', 'Pandas', 'FastAPI']
    },
    {
        skillName: 'TypeScript',
        category: 'Frontend',
        demandScore: 88,
        jobCount: 850000,
        avgSalary: 1300000,
        yoyGrowth: 25,
        trend: 'rising',
        predictedGrowth6m: 12,
        relatedSkills: ['React', 'Node.js', 'Angular']
    },
    {
        skillName: 'Go',
        category: 'Backend',
        demandScore: 78,
        jobCount: 320000,
        avgSalary: 1500000,
        yoyGrowth: 35,
        trend: 'rising',
        predictedGrowth6m: 20,
        relatedSkills: ['Kubernetes', 'Docker', 'GRPC', 'Cloud Native']
    },
    {
        skillName: 'AWS',
        category: 'Cloud',
        demandScore: 90,
        jobCount: 980000,
        avgSalary: 1600000,
        yoyGrowth: 15,
        trend: 'stable',
        predictedGrowth6m: 8,
        relatedSkills: ['Terraform', 'Lambda', 'S3', 'EC2']
    },
    {
        skillName: 'Rust',
        category: 'Backend',
        demandScore: 65,
        jobCount: 120000,
        avgSalary: 1700000,
        yoyGrowth: 50,
        trend: 'rising',
        predictedGrowth6m: 35,
        relatedSkills: ['WASM', 'Systems Programming', 'Solana']
    },
    {
        skillName: 'Node.js',
        category: 'Backend',
        demandScore: 85,
        jobCount: 920000,
        avgSalary: 1100000,
        yoyGrowth: 5,
        trend: 'stable',
        predictedGrowth6m: 2,
        relatedSkills: ['Express', 'TypeScript', 'MongoDB']
    },
    {
        skillName: 'Kubernetes',
        category: 'DevOps',
        demandScore: 82,
        jobCount: 450000,
        avgSalary: 1800000,
        yoyGrowth: 28,
        trend: 'rising',
        predictedGrowth6m: 18,
        relatedSkills: ['Docker', 'Helm', 'Terraform', 'AWS']
    }
];

const companyData = [
    {
        companyName: 'Google',
        industry: 'Technology',
        type: 'faang',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        requiredSkills: [
            { skillName: 'Python', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Go', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'C++', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Kubernetes', importance: 'preferred', proficiencyLevel: 3 }
        ],
        avgSalaryRange: { min: 3000000, max: 8000000 },
        location: 'Bangalore, Mountain View'
    },
    {
        companyName: 'Microsoft',
        industry: 'Technology',
        type: 'faang',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        requiredSkills: [
            { skillName: 'TypeScript', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Azure', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Python', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 2500000, max: 7000000 },
        location: 'Hyderabad, Redmond'
    },
    {
        companyName: 'Stripe',
        industry: 'Fintech',
        type: 'startup',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
        requiredSkills: [
            { skillName: 'Ruby', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'React', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'TypeScript', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 4000000, max: 9000000 },
        location: 'Remote, San Francisco'
    },
    {
        companyName: 'Zomato',
        industry: 'FoodTech',
        type: 'enterprise',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png',
        requiredSkills: [
            { skillName: 'React Native', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Node.js', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'AWS', importance: 'preferred', proficiencyLevel: 3 }
        ],
        avgSalaryRange: { min: 1500000, max: 4500000 },
        location: 'Gurugram'
    }
];

const seedMarketData = async () => {
    try {
        // Check if mongo is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping seed: Mongo not connected');
            return;
        }

        console.log('🌱 Seeding Skill Market Data...');

        await SkillMarketData.deleteMany({});
        await SkillMarketData.insertMany(skillsData);

        await CompanySkillProfile.deleteMany({});
        await CompanySkillProfile.insertMany(companyData);

        console.log('✅ Skill Market Data Seeded Successfully');
    } catch (error) {
        console.error('❌ Error seeding market data:', error);
    }
};

module.exports = seedMarketData;
