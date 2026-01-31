const Groq = require('groq-sdk');
const { validateUrl } = require('../utils/linkValidator');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Official documentation URLs for various technologies
 */
const OFFICIAL_DOCS = {
    'python': 'https://docs.python.org/3/',
    'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'react': 'https://react.dev',
    'node': 'https://nodejs.org/docs/',
    'nodejs': 'https://nodejs.org/docs/',
    'mongodb': 'https://docs.mongodb.com/',
    'express': 'https://expressjs.com/',
    'typescript': 'https://www.typescriptlang.org/docs/',
    'vue': 'https://vuejs.org/guide/',
    'angular': 'https://angular.io/docs',
    'django': 'https://docs.djangoproject.com/',
    'flask': 'https://flask.palletsprojects.com/',
    'java': 'https://docs.oracle.com/en/java/',
    'c++': 'https://en.cppreference.com/w/',
    'c': 'https://en.cppreference.com/w/c',
    'sql': 'https://www.w3schools.com/sql/',
    'html': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    'css': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    'git': 'https://git-scm.com/doc',
    'docker': 'https://docs.docker.com/',
    'kubernetes': 'https://kubernetes.io/docs/',
    'aws': 'https://docs.aws.amazon.com/'
};

/**
 * Find an alternative resource using AI
 * @param {Object} resource - The resource object {title, url, type}
 * @param {Object} context - Context about the milestone {title, skills, description}
 * @returns {Promise<{url: string, title: string, source: string}>}
 */
async function findAlternativeResource(resource, context) {
    try {
        // Check if we have official docs for any of the skills
        const skills = context.skills || [];
        for (const skill of skills) {
            const skillLower = skill.toLowerCase();
            if (OFFICIAL_DOCS[skillLower]) {
                const officialUrl = OFFICIAL_DOCS[skillLower];
                const validation = await validateUrl(officialUrl);
                if (validation.valid) {
                    return {
                        url: officialUrl,
                        title: `${skill} Official Documentation`,
                        source: 'official_docs'
                    };
                }
            }
        }

        // Use AI to suggest an alternative
        const prompt = `You are a helpful assistant that finds educational resources.

A learning resource link is broken or invalid. Find an alternative working resource.

Original Resource:
- Title: ${resource.title}
- URL: ${resource.url}
- Type: ${resource.type}

Context:
- Milestone: ${context.title}
- Skills: ${skills.join(', ')}
- Description: ${context.description || 'N/A'}

Please suggest ONE alternative resource. Prioritize:
1. Official documentation (e.g., MDN, official language docs)
2. FreeCodeCamp
3. YouTube tutorials from verified channels
4. W3Schools or similar educational sites

Respond in JSON format only:
{
  "url": "working URL here",
  "title": "resource title",
  "reasoning": "brief explanation"
}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', // Faster model for resource suggestions
            temperature: 0.3,
            max_tokens: 300
        });

        const responseText = completion.choices[0]?.message?.content?.trim();
        
        // Try to parse JSON from response
        let suggestion;
        try {
            // Extract JSON if wrapped in markdown code blocks
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            suggestion = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', responseText);
            throw new Error('AI response parsing failed');
        }

        // Validate the suggested URL before returning
        const validation = await validateUrl(suggestion.url);
        if (validation.valid) {
            return {
                url: validation.finalUrl,
                title: suggestion.title || resource.title,
                source: 'ai_suggested'
            };
        } else {
            throw new Error('AI suggested URL is also invalid');
        }
    } catch (error) {
        console.error('Failed to find alternative resource:', error);
        
        // Fallback: return a general FreeCodeCamp link
        const fallbackUrl = 'https://www.freecodecamp.org/news/search/?query=' + encodeURIComponent(context.title);
        return {
            url: fallbackUrl,
            title: `Search: ${context.title}`,
            source: 'fallback'
        };
    }
}

/**
 * Replace invalid resources in a list
 * @param {Array} resources - Array of resources
 * @param {Object} context - Milestone context
 * @returns {Promise<{resources: Array, replacements: Array}>}
 */
async function replaceInvalidResources(resources, context) {
    const { validateMilestoneResources } = require('../utils/linkValidator');
    
    // First, validate all resources
    const validation = await validateMilestoneResources(resources);
    
    if (validation.invalid.length === 0) {
        return {
            resources,
            replacements: []
        };
    }

    // Replace invalid resources
    const replacements = [];
    const updatedResources = [...resources];

    for (const invalidResult of validation.invalid) {
        try {
            const alternative = await findAlternativeResource(invalidResult.resource, context);
            
            // Update the resource
            updatedResources[invalidResult.index] = {
                ...invalidResult.resource,
                url: alternative.url,
                title: alternative.title
            };

            replacements.push({
                index: invalidResult.index,
                oldUrl: invalidResult.resource.url,
                newUrl: alternative.url,
                reason: invalidResult.error,
                source: alternative.source
            });
        } catch (error) {
            console.error(`Failed to replace resource at index ${invalidResult.index}:`, error);
            // Keep the original resource if replacement fails
        }
    }

    return {
        resources: updatedResources,
        replacements
    };
}

module.exports = {
    findAlternativeResource,
    replaceInvalidResources,
    OFFICIAL_DOCS
};
