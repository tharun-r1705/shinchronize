const axios = require('axios');

/**
 * Validate a single URL by making a HEAD request
 * @param {string} url - The URL to validate
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<{valid: boolean, statusCode: number|null, finalUrl: string, error: string|null}>}
 */
async function validateUrl(url, timeout = 3000) {
    try {
        // Handle relative URLs or malformed URLs
        if (!url || typeof url !== 'string') {
            return { valid: false, statusCode: null, finalUrl: url, error: 'Invalid URL format' };
        }

        // Ensure URL has protocol
        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }

        // Make HEAD request (fast, no body download)
        const response = await axios.head(targetUrl, {
            timeout,
            maxRedirects: 3,
            validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx
        });

        const isValid = response.status >= 200 && response.status < 400;

        return {
            valid: isValid,
            statusCode: response.status,
            finalUrl: response.request.res.responseUrl || targetUrl,
            error: isValid ? null : `HTTP ${response.status}`
        };
    } catch (error) {
        // Check if it's a timeout
        if (error.code === 'ECONNABORTED') {
            return { valid: false, statusCode: null, finalUrl: url, error: 'Request timeout' };
        }

        // Check if it's a network error
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return { valid: false, statusCode: null, finalUrl: url, error: 'Host not found' };
        }

        // If HEAD fails, try GET with range header (some servers don't support HEAD)
        try {
            let targetUrl = url.trim();
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = `https://${targetUrl}`;
            }

            const getResponse = await axios.get(targetUrl, {
                timeout,
                maxRedirects: 3,
                headers: { 'Range': 'bytes=0-0' },
                validateStatus: (status) => status < 500
            });

            const isValid = getResponse.status >= 200 && getResponse.status < 400;
            return {
                valid: isValid,
                statusCode: getResponse.status,
                finalUrl: getResponse.request.res.responseUrl || targetUrl,
                error: isValid ? null : `HTTP ${getResponse.status}`
            };
        } catch (retryError) {
            return {
                valid: false,
                statusCode: error.response?.status || null,
                finalUrl: url,
                error: error.message || 'Connection failed'
            };
        }
    }
}

/**
 * Validate all resources in a milestone
 * @param {Array} resources - Array of resource objects with {title, url, type}
 * @returns {Promise<{valid: Array, invalid: Array, results: Array}>}
 */
async function validateMilestoneResources(resources) {
    if (!resources || !Array.isArray(resources) || resources.length === 0) {
        return { valid: [], invalid: [], results: [] };
    }

    // Validate all URLs in parallel
    const validationPromises = resources.map(async (resource, index) => {
        const result = await validateUrl(resource.url);
        return {
            index,
            resource,
            ...result
        };
    });

    const results = await Promise.all(validationPromises);

    const valid = results.filter(r => r.valid);
    const invalid = results.filter(r => !r.valid);

    return { valid, invalid, results };
}

/**
 * Validate and log resource access
 * @param {string} url - Resource URL being accessed
 * @returns {Promise<boolean>} - Whether the URL is valid
 */
async function validateAndLogAccess(url) {
    const result = await validateUrl(url, 5000); // Longer timeout for actual access
    return result.valid;
}

module.exports = {
    validateUrl,
    validateMilestoneResources,
    validateAndLogAccess
};
