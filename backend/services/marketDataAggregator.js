const axios = require('axios');
const SkillMarketData = require('../models/SkillMarketData');

/**
 * Market Data Aggregator Service
 * Integrates with Adzuna API to fetch real-time job market data
 * and updates the SkillMarketData collection with fresh insights
 */

// Skills to track - mapped to search queries
const TRACKED_SKILLS = [
    // Frontend
    { skillName: 'React', category: 'Frontend', searchTerms: ['react', 'reactjs', 'react.js'] },
    { skillName: 'Angular', category: 'Frontend', searchTerms: ['angular', 'angularjs'] },
    { skillName: 'Vue.js', category: 'Frontend', searchTerms: ['vue', 'vuejs', 'vue.js'] },
    { skillName: 'TypeScript', category: 'Frontend', searchTerms: ['typescript'] },
    { skillName: 'Next.js', category: 'Frontend', searchTerms: ['nextjs', 'next.js'] },
    
    // Backend
    { skillName: 'Node.js', category: 'Backend', searchTerms: ['nodejs', 'node.js', 'node js'] },
    { skillName: 'Python', category: 'Backend', searchTerms: ['python', 'django', 'flask'] },
    { skillName: 'Java', category: 'Backend', searchTerms: ['java', 'spring boot', 'spring'] },
    { skillName: 'Go', category: 'Backend', searchTerms: ['golang', 'go programming'] },
    { skillName: 'Rust', category: 'Backend', searchTerms: ['rust programming'] },
    
    // Cloud & DevOps
    { skillName: 'AWS', category: 'Cloud', searchTerms: ['aws', 'amazon web services'] },
    { skillName: 'Docker', category: 'DevOps', searchTerms: ['docker', 'containerization'] },
    { skillName: 'Kubernetes', category: 'DevOps', searchTerms: ['kubernetes', 'k8s'] },
    { skillName: 'CI/CD', category: 'DevOps', searchTerms: ['ci/cd', 'jenkins', 'github actions'] },
    
    // Data & AI/ML
    { skillName: 'Machine Learning', category: 'AI/ML', searchTerms: ['machine learning', 'ml engineer'] },
    { skillName: 'Data Science', category: 'Data', searchTerms: ['data science', 'data scientist'] },
    { skillName: 'MongoDB', category: 'Data', searchTerms: ['mongodb', 'nosql'] },
    { skillName: 'PostgreSQL', category: 'Data', searchTerms: ['postgresql', 'postgres'] },
    
    // Mobile
    { skillName: 'React Native', category: 'Mobile', searchTerms: ['react native'] },
    { skillName: 'Flutter', category: 'Mobile', searchTerms: ['flutter', 'dart'] },
];

/**
 * Fetch job data from Adzuna API for a specific skill
 * @param {string} searchQuery - The skill to search for
 * @returns {Promise<Object>} Job count and salary data
 */
async function fetchAdzunaData(searchQuery) {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;
    
    if (!appId || !apiKey) {
        console.warn('⚠️ Adzuna API credentials not found. Using fallback data.');
        return null;
    }

    try {
        // Adzuna API endpoint for India job search
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1`;
        
        const response = await axios.get(url, {
            params: {
                app_id: appId,
                app_key: apiKey,
                what: searchQuery,
                results_per_page: 50 // Get up to 50 results
            },
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        
        return {
            jobCount: data.count || 0,
            avgSalary: calculateAverageSalary(data.results || []),
            timestamp: new Date()
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error(`⏱️ Adzuna API timeout for "${searchQuery}"`);
        } else if (error.response) {
            console.error(`❌ Adzuna API error for "${searchQuery}": ${error.response.status} - ${error.response.statusText}`);
        } else {
            console.error(`❌ Network error fetching Adzuna data for "${searchQuery}":`, error.message);
        }
        return null;
    }
}

/**
 * Calculate average salary from job results
 * @param {Array} jobs - Array of job listings
 * @returns {number} Average salary in INR
 */
function calculateAverageSalary(jobs) {
    if (!jobs || jobs.length === 0) return 0;
    
    const salaries = jobs
        .filter(job => job.salary_min && job.salary_max)
        .map(job => (job.salary_min + job.salary_max) / 2);
    
    if (salaries.length === 0) return 0;
    
    const avgSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
    return Math.round(avgSalary);
}

/**
 * Calculate demand score based on job count
 * Uses logarithmic scaling to normalize scores between 0-100
 * @param {number} jobCount - Number of job postings
 * @returns {number} Demand score (0-100)
 */
function calculateDemandScore(jobCount) {
    if (jobCount === 0) return 0;
    if (jobCount >= 10000) return 100;
    
    // Logarithmic scale: score = 20 * log10(jobCount)
    // 10 jobs = 20, 100 jobs = 40, 1000 jobs = 60, 10000 jobs = 80
    const score = 20 * Math.log10(jobCount);
    return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Determine trend based on historical data comparison
 * @param {number} currentJobCount - Current job count
 * @param {number} previousJobCount - Previous job count
 * @returns {string} Trend ('rising', 'stable', 'declining')
 */
function determineTrend(currentJobCount, previousJobCount) {
    if (!previousJobCount || previousJobCount === 0) return 'stable';
    
    const changePercent = ((currentJobCount - previousJobCount) / previousJobCount) * 100;
    
    if (changePercent >= 10) return 'rising';
    if (changePercent <= -10) return 'declining';
    return 'stable';
}

/**
 * Calculate year-over-year growth percentage
 * @param {number} currentJobCount - Current job count
 * @param {number} previousJobCount - Previous job count from ~1 year ago
 * @returns {number} Growth percentage
 */
function calculateYoYGrowth(currentJobCount, previousJobCount) {
    if (!previousJobCount || previousJobCount === 0) return 0;
    return Math.round(((currentJobCount - previousJobCount) / previousJobCount) * 100);
}

/**
 * Predict 6-month growth based on current trend
 * Simple linear projection with market volatility factor
 * @param {number} yoyGrowth - Year-over-year growth percentage
 * @param {string} trend - Current trend direction
 * @returns {number} Predicted 6-month growth percentage
 */
function predict6MonthGrowth(yoyGrowth, trend) {
    // Project YoY growth to 6 months (half the annual growth)
    let projection = Math.round(yoyGrowth / 2);
    
    // Adjust based on trend
    if (trend === 'rising') {
        projection = Math.round(projection * 1.2); // 20% boost for rising trends
    } else if (trend === 'declining') {
        projection = Math.round(projection * 0.8); // 20% reduction for declining trends
    }
    
    return projection;
}

/**
 * Aggregate market data for all tracked skills
 * Fetches fresh data from Adzuna and updates the database
 * @returns {Promise<Object>} Summary of update results
 */
async function aggregateMarketData() {
    console.log('🔄 Starting market data aggregation...');
    console.log(`📊 Tracking ${TRACKED_SKILLS.length} skills`);
    
    const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    for (const skill of TRACKED_SKILLS) {
        try {
            console.log(`\n🔍 Processing: ${skill.skillName}`);
            
            // Fetch current data from Adzuna (try multiple search terms)
            let adzunaData = null;
            for (const searchTerm of skill.searchTerms) {
                adzunaData = await fetchAdzunaData(searchTerm);
                if (adzunaData && adzunaData.jobCount > 0) {
                    break; // Use first successful search term
                }
                // Small delay between API calls to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (!adzunaData) {
                console.log(`⚠️ No data available for ${skill.skillName}, skipping...`);
                results.skipped++;
                continue;
            }

            // Get previous data for comparison
            const existingSkill = await SkillMarketData.findOne({ skillName: skill.skillName });
            const previousJobCount = existingSkill ? existingSkill.jobCount : 0;

            // Calculate metrics
            const jobCount = adzunaData.jobCount;
            const demandScore = calculateDemandScore(jobCount);
            const trend = determineTrend(jobCount, previousJobCount);
            const yoyGrowth = calculateYoYGrowth(jobCount, previousJobCount);
            const predictedGrowth6m = predict6MonthGrowth(yoyGrowth, trend);

            // Update or create skill entry
            await SkillMarketData.findOneAndUpdate(
                { skillName: skill.skillName },
                {
                    $set: {
                        category: skill.category,
                        demandScore,
                        jobCount,
                        avgSalary: adzunaData.avgSalary,
                        trend,
                        yoyGrowth,
                        predictedGrowth6m,
                        lastUpdated: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            console.log(`✅ ${skill.skillName}: ${jobCount} jobs, ${demandScore}% demand, ${trend} trend`);
            results.success++;

        } catch (error) {
            console.error(`❌ Error processing ${skill.skillName}:`, error.message);
            results.failed++;
            results.errors.push({
                skill: skill.skillName,
                error: error.message
            });
        }
    }

    console.log('\n✨ Market data aggregation complete!');
    console.log(`✅ Success: ${results.success}`);
    console.log(`⚠️ Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);

    return results;
}

/**
 * Get aggregation statistics
 * @returns {Promise<Object>} Stats about last update
 */
async function getAggregationStats() {
    try {
        const totalSkills = await SkillMarketData.countDocuments();
        const mostRecent = await SkillMarketData.findOne().sort({ lastUpdated: -1 });
        
        return {
            totalSkills,
            lastUpdated: mostRecent ? mostRecent.lastUpdated : null,
            isStale: mostRecent ? (Date.now() - mostRecent.lastUpdated) > 86400000 : true // >24 hours
        };
    } catch (error) {
        console.error('Error getting aggregation stats:', error);
        return null;
    }
}

module.exports = {
    aggregateMarketData,
    getAggregationStats,
    fetchAdzunaData,
    calculateDemandScore
};
