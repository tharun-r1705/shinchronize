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

    const prompt = `You are a tech recruitment expert. Generate a detailed, realistic technical profile for the company "${companyName}". 
Include their typical tech stack, industry, company type, salary range in INR (be realistic for 2024-2025), and primary location.

Return JSON ONLY:
{
  "companyName": "${companyName}",
  "industry": "e.g. Fintech, E-commerce, SaaS",
  "type": "faang" | "startup" | "enterprise" | "other",
  "logoUrl": "A public logo URL if you know it, otherwise leave empty",
  "location": "Primary city/cities",
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
1. Be highly accurate to the company's actual stack if known.
2. Proficiency level is 1 (novice) to 5 (expert).
3. Salary should be annual (PA) in INR.
4. If it is a major company, use realistic high-tier salaries.
5. No markdown, no extra text.`;

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

        return parsed;
    } catch (error) {
        console.error('Company generation error:', error.message);
        return null;
    }
}

module.exports = {
    generateCompanyProfile
};
