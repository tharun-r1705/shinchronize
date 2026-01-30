const cron = require('node-cron');
const { aggregateMarketData, getAggregationStats } = require('../services/marketDataAggregator');

/**
 * Market Data Refresher - Daily Cron Job
 * Runs at 2:00 AM IST daily to refresh skill market data
 * 
 * Cron Schedule: '0 2 * * *'
 * - Minute: 0
 * - Hour: 2 (2 AM)
 * - Day of Month: * (every day)
 * - Month: * (every month)
 * - Day of Week: * (every day of week)
 */

let isRunning = false;
let lastRunResult = null;

/**
 * Execute the market data refresh job
 */
async function runRefreshJob() {
    if (isRunning) {
        console.log('⏭️ Market refresh already in progress, skipping...');
        return;
    }

    isRunning = true;
    const startTime = new Date();
    
    console.log('\n' + '='.repeat(60));
    console.log('🔄 MARKET DATA REFRESH JOB STARTED');
    console.log(`⏰ Time: ${startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log('='.repeat(60) + '\n');

    try {
        // Get stats before refresh
        const statsBefore = await getAggregationStats();
        if (statsBefore) {
            console.log(`📊 Current state: ${statsBefore.totalSkills} skills tracked`);
            console.log(`📅 Last updated: ${statsBefore.lastUpdated ? statsBefore.lastUpdated.toLocaleString('en-IN') : 'Never'}`);
            console.log(`${statsBefore.isStale ? '⚠️ Data is stale (>24h old)' : '✅ Data is fresh'}\n`);
        }

        // Run the aggregation
        const result = await aggregateMarketData();
        
        // Get stats after refresh
        const statsAfter = await getAggregationStats();
        
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);

        // Store result for status endpoint
        lastRunResult = {
            timestamp: endTime,
            duration,
            ...result,
            totalSkills: statsAfter ? statsAfter.totalSkills : 0
        };

        console.log('\n' + '='.repeat(60));
        console.log('✅ MARKET DATA REFRESH JOB COMPLETED');
        console.log(`⏱️ Duration: ${duration} seconds`);
        console.log(`📊 Total skills: ${lastRunResult.totalSkills}`);
        console.log(`✅ Success: ${result.success}`);
        console.log(`⚠️ Skipped: ${result.skipped}`);
        console.log(`❌ Failed: ${result.failed}`);
        
        if (result.errors.length > 0) {
            console.log(`\n❌ Errors encountered:`);
            result.errors.forEach(err => {
                console.log(`   - ${err.skill}: ${err.error}`);
            });
        }
        
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);
        
        lastRunResult = {
            timestamp: endTime,
            duration,
            error: error.message,
            success: 0,
            failed: 0,
            skipped: 0
        };

        console.error('\n' + '='.repeat(60));
        console.error('❌ MARKET DATA REFRESH JOB FAILED');
        console.error(`⏱️ Duration: ${duration} seconds`);
        console.error(`💥 Error: ${error.message}`);
        console.error('='.repeat(60) + '\n');
    } finally {
        isRunning = false;
    }
}

/**
 * Initialize and start the cron job
 */
function initializeMarketRefreshCron() {
    console.log('🚀 Initializing market data refresh cron job...');
    console.log('⏰ Schedule: Daily at 2:00 AM IST');
    
    // Schedule the job for 2:00 AM IST daily
    const job = cron.schedule('0 2 * * *', async () => {
        await runRefreshJob();
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    });

    console.log('✅ Market data refresh cron job initialized');
    console.log('📅 Next run: Tomorrow at 2:00 AM IST');
    
    // Optional: Run once on startup if data is stale (uncomment if desired)
    // setTimeout(async () => {
    //     const stats = await getAggregationStats();
    //     if (stats && stats.isStale) {
    //         console.log('⚠️ Market data is stale, running immediate refresh...');
    //         await runRefreshJob();
    //     }
    // }, 5000); // Wait 5 seconds after startup

    return job;
}

/**
 * Get the status of the last refresh job
 * Useful for monitoring and health checks
 */
function getLastRunStatus() {
    if (!lastRunResult) {
        return {
            status: 'never_run',
            message: 'Market refresh job has not run yet'
        };
    }

    const hoursSinceRun = Math.round((Date.now() - lastRunResult.timestamp) / (1000 * 60 * 60));
    
    return {
        status: lastRunResult.error ? 'failed' : 'success',
        lastRun: lastRunResult.timestamp,
        hoursSinceRun,
        duration: lastRunResult.duration,
        success: lastRunResult.success,
        failed: lastRunResult.failed,
        skipped: lastRunResult.skipped,
        totalSkills: lastRunResult.totalSkills,
        error: lastRunResult.error,
        errors: lastRunResult.errors
    };
}

/**
 * Manually trigger a refresh (for admin/testing purposes)
 * Should be exposed via an admin-only API endpoint
 */
async function triggerManualRefresh() {
    console.log('🔧 Manual refresh triggered');
    return await runRefreshJob();
}

module.exports = {
    initializeMarketRefreshCron,
    getLastRunStatus,
    triggerManualRefresh,
    runRefreshJob
};
