/**
 * Seed Market Data - Bootstrap Only
 * 
 * This file seeds initial market data for development and testing purposes.
 * It only runs when SEED_DEMO_DATA=true in the environment variables.
 * 
 * For production and ongoing data refreshes, the market data is automatically
 * updated by the daily cron job in backend/jobs/marketDataRefresher.js which
 * runs at 2:00 AM IST and fetches real-time data from Adzuna API.
 * 
 * This seed data provides a baseline when the database is first initialized,
 * but should not be relied upon for accurate, up-to-date market intelligence.
 */

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
        companyName: 'Amazon',
        industry: 'Cloud/E-commerce',
        type: 'faang',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        requiredSkills: [
            { skillName: 'Java', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'AWS', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Python', importance: 'preferred', proficiencyLevel: 4 },
            { skillName: 'NoSQL', importance: 'preferred', proficiencyLevel: 3 }
        ],
        avgSalaryRange: { min: 2800000, max: 6500000 },
        location: 'Bangalore, Seattle'
    },
    {
        companyName: 'Netflix',
        industry: 'Entertainment/SaaS',
        type: 'faang',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        requiredSkills: [
            { skillName: 'Java', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Microservices', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'React', importance: 'preferred', proficiencyLevel: 4 },
            { skillName: 'Spring Boot', importance: 'must-have', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 4500000, max: 9500000 },
        location: 'Remote, Los Gatos'
    },
    {
        companyName: 'Meta',
        industry: 'Social Media',
        type: 'faang',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
        requiredSkills: [
            { skillName: 'React', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'PHP/Hack', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Python', importance: 'preferred', proficiencyLevel: 4 },
            { skillName: 'PyTorch', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 3500000, max: 8500000 },
        location: 'Hyderabad, Menlo Park'
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
        companyName: 'Adobe',
        industry: 'Software/Creative',
        type: 'enterprise',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png',
        requiredSkills: [
            { skillName: 'C++', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Java', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'AWS', importance: 'preferred', proficiencyLevel: 3 }
        ],
        avgSalaryRange: { min: 2000000, max: 5500000 },
        location: 'Noida, San Jose'
    },
    {
        companyName: 'Salesforce',
        industry: 'CRM/SaaS',
        type: 'enterprise',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
        requiredSkills: [
            { skillName: 'Java', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Apex', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'JavaScript', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 2200000, max: 6000000 },
        location: 'Hyderabad, San Francisco'
    },
    {
        companyName: 'Uber',
        industry: 'Mobility/Tech',
        type: 'enterprise',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Uber_logo_2018.svg',
        requiredSkills: [
            { skillName: 'Go', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Java', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'Python', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 3500000, max: 7500000 },
        location: 'Bangalore, Amsterdam'
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
    },
    {
        companyName: 'Swiggy',
        industry: 'Logistics/Tech',
        type: 'enterprise',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg',
        requiredSkills: [
            { skillName: 'Golang', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Java', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'React', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 1800000, max: 5000000 },
        location: 'Bangalore'
    },
    {
        companyName: 'Cred',
        industry: 'Fintech',
        type: 'startup',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Logo_of_CRED.png/220px-Logo_of_CRED.png',
        requiredSkills: [
            { skillName: 'Mobile Dev', importance: 'must-have', proficiencyLevel: 5 },
            { skillName: 'Node.js', importance: 'must-have', proficiencyLevel: 4 },
            { skillName: 'React', importance: 'preferred', proficiencyLevel: 4 }
        ],
        avgSalaryRange: { min: 2500000, max: 6000000 },
        location: 'Bangalore'
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
