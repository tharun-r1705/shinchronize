const Groq = require('groq-sdk');

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

/**
 * Determine the student's primary domain from their skills
 */
const detectPrimaryDomain = (skills = [], skillRadar = {}) => {
    const domainKeywords = {
        'AI & Machine Learning': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning', 'neural network', 'tensorflow', 'pytorch', 'nlp', 'computer vision'],
        'Web Development': ['react', 'angular', 'vue', 'javascript', 'typescript', 'html', 'css', 'node', 'express', 'frontend', 'backend', 'web', 'nextjs', 'tailwind'],
        'Mobile Development': ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'mobile'],
        'Data Science': ['data science', 'pandas', 'numpy', 'data analysis', 'statistics', 'visualization', 'tableau', 'power bi', 'excel'],
        'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'ci/cd', 'jenkins', 'terraform', 'cloud'],
        'Cybersecurity': ['security', 'cybersecurity', 'penetration', 'ethical hacking', 'cryptography', 'network security'],
        'Blockchain': ['blockchain', 'solidity', 'web3', 'ethereum', 'smart contract', 'crypto'],
        'Database': ['sql', 'mysql', 'postgresql', 'mongodb', 'database', 'redis', 'cassandra'],
        'DSA & Programming': ['dsa', 'data structures', 'algorithms', 'competitive programming', 'leetcode', 'python', 'java', 'c++', 'c'],
    };

    const allSkills = [
        ...skills.map(s => s.toLowerCase()),
        ...Object.keys(skillRadar).map(s => s.toLowerCase())
    ];

    const domainScores = {};

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
        domainScores[domain] = 0;
        for (const skill of allSkills) {
            for (const keyword of keywords) {
                if (skill.includes(keyword) || keyword.includes(skill)) {
                    domainScores[domain]++;
                }
            }
        }
    }

    const sorted = Object.entries(domainScores).sort((a, b) => b[1] - a[1]);

    if (sorted[0] && sorted[0][1] > 0) {
        return sorted[0][0];
    }

    return 'Technology & Software';
};

/**
 * Generate a domain insight (fact or interview question)
 */
async function generateDomainInsight(skills = [], skillRadar = {}) {
    const domain = detectPrimaryDomain(skills, skillRadar);

    // Randomly decide: fact or interview question
    const type = Math.random() < 0.5 ? 'fact' : 'interview';

    if (!groqClient) {
        // Fallback content when AI is not available
        return {
            domain,
            type,
            content: type === 'fact'
                ? {
                    title: 'Did You Know?',
                    text: `The ${domain} field is one of the fastest-growing areas in tech, with new innovations emerging every day.`
                }
                : {
                    title: 'Interview Question',
                    question: `What excites you most about working in ${domain}?`,
                    hint: 'Focus on a specific project or technology you\'ve worked with and explain how it sparked your interest.',
                    answer: `A strong answer highlights a specific technology or project within ${domain} that personally inspired you. Discuss how you discovered it, what problem it solved, and how it shaped your career goals. Show genuine enthusiasm and connect it to your future aspirations in the field.`
                }
        };
    }

    const prompt = type === 'fact'
        ? `You are a tech educator. Generate ONE fascinating, lesser-known fact about "${domain}" that would intrigue a computer science student preparing for job interviews.

Return JSON:
{
  "title": "Did You Know?",
  "text": "The fact in 1-2 sentences, max 150 characters"
}

Rules: Be specific, avoid generic statements, make it memorable. No markdown.`
        : `You are a senior tech interviewer. Generate ONE tricky interview question for "${domain}" that tests deeper understanding, along with a hint on how to approach it and a comprehensive answer.

Return JSON:
{
  "title": "Interview Question",
  "question": "The interview question (max 100 chars)",
  "hint": "A brief hint on how to approach answering (max 150 chars)",
  "answer": "A detailed, well-structured answer that demonstrates how a strong candidate would respond (max 500 chars)"
}

Rules: Make it thought-provoking but fair. Focus on concepts, not trivia. The answer should be educational and comprehensive. No markdown.`;

    try {
        const completion = await groqClient.chat.completions.create({
            model: MODEL,
            temperature: 0.7,
            max_tokens: 256,
            messages: [
                {
                    role: 'system',
                    content: 'You are a knowledgeable tech mentor. Always respond with valid JSON only, no markdown or extra text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const content = completion?.choices?.[0]?.message?.content?.trim();
        if (!content) {
            throw new Error('Empty response');
        }

        // Extract JSON
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error('Invalid JSON');
            }
        }

        return {
            domain,
            type,
            content: parsed,
        };
    } catch (error) {
        console.error('Domain insight generation error:', error.message);
        // Return fallback
        return {
            domain,
            type,
            content: type === 'fact'
                ? {
                    title: 'Did You Know?',
                    text: `${domain} professionals are among the most sought-after in the tech industry today.`
                }
                : {
                    title: 'Interview Question',
                    question: `Explain a challenging problem you solved in ${domain}.`,
                    hint: 'Use the STAR method: Situation, Task, Action, Result.',
                    answer: `Using the STAR method: Start by describing the Situation (context and constraints), then explain the Task (your specific responsibility). Detail the Action you took (technical approach, tools used, problem-solving steps), and conclude with the Result (measurable outcomes, lessons learned). Be specific about technologies and quantify impact where possible.`
                }
        };
    }
}

module.exports = {
    generateDomainInsight,
    detectPrimaryDomain,
};
