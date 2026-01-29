const Groq = require('groq-sdk');

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

/**
 * Generate a realistic company skill profile using AI
 */
async function generateCompanyProfile(companyName) {
    if (!groqClient) {
        return null;
    }

    const prompt = `You are a tech recruitment expert with knowledge of real companies worldwide.

CRITICAL: First, determine if "${companyName}" is a REAL, EXISTING company. If it's gibberish, random text, or a fake/non-existent company, respond with exactly: {"exists": false}

If it IS a real company, generate a detailed, realistic technical profile including their typical tech stack, industry, company type, salary range in INR (be realistic for 2024-2026), and primary location.

Return JSON ONLY (no markdown, no extra text):

For FAKE/NON-EXISTENT companies:
{"exists": false}

For REAL companies:
{
  "exists": true,
  "companyName": "${companyName}",
  "industry": "e.g. Fintech, E-commerce, SaaS, Cloud Services, etc.",
  "type": "faang" | "startup" | "enterprise" | "other",
  "logoUrl": "",
  "location": "Primary city/cities in India or globally",
  "avgSalaryRange": {
    "min": 000000,
    "max": 000000
  },
  "requiredSkills": [
    { "skillName": "Skill 1", "importance": "must-have", "proficiencyLevel": 1-5 },
    { "skillName": "Skill 2", "importance": "preferred", "proficiencyLevel": 1-5 }
  ]
}

Rules:
1. Only generate profiles for REAL, existing companies you're confident about.
2. Be highly accurate to the company's actual tech stack.
3. Proficiency level: 1 (novice) to 5 (expert).
4. Salary should be annual (PA) in INR, realistic for Indian market 2024-2026.
5. Include 5-10 relevant skills for the company.
6. If uncertain whether company exists, return {"exists": false}.`;

    try {
        const completion = await groqClient.chat.completions.create({
            model: MODEL,
            temperature: 0.6,
            max_tokens: 1024,
            messages: [
                {
                    role: 'system',
                    content: 'You are a career consultant specialized in tech industries. Respond with valid JSON only.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const content = completion?.choices?.[0]?.message?.content?.trim();
        if (!content) return null;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                return null;
            }
        }

        // Check if company exists
        if (!parsed.exists) {
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Company generation error:', error.message);
        return null;
    }
}

module.exports = {
    generateCompanyProfile
};
