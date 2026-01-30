const groqClient = require('./groqClient');

/**
 * Generate AI-powered justifications for skill market trends
 * @param {Object} trendData - Market trend data for skills
 * @returns {Promise<Object>} AI-generated insights and justifications
 */
async function generateMarketInsights(trendData) {
  if (!trendData || !Array.isArray(trendData) || trendData.length === 0) {
    return {
      overview: 'Insufficient market data available for analysis.',
      trends: [],
      emergingSkills: [],
      recommendations: []
    };
  }

  // Check if Groq is available
  if (!groqClient.isAvailable()) {
    console.warn('[Market Insights] Groq API not available, returning basic insights');
    return generateBasicInsights(trendData);
  }

  try {
    const prompt = `You are a tech career advisor analyzing skill market trends. Based on the following skill trend data, provide actionable insights for students preparing for tech placements.

Skill Trend Data:
${JSON.stringify(trendData, null, 2)}

Provide a JSON response with the following exact structure:
{
  "overview": "A 2-3 sentence summary of the overall market trends",
  "trends": [
    {
      "skillName": "skill name from the data",
      "category": "category from the data",
      "demandScore": number from the data,
      "insight": "2-3 sentence explanation of WHY this skill is trending and its market value"
    }
  ],
  "emergingSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4"
  ]
}

Important:
- Include 5-8 skills in the "trends" array
- For each trend, provide specific insights about WHY it's valuable (e.g., "Rising demand in cloud infrastructure", "Critical for AI/ML development")
- emergingSkills should list 3-5 rapidly growing technologies
- recommendations should be practical and actionable for students
- Use exact field names: "skillName", "category", "demandScore", "insight"

Return ONLY valid JSON, no markdown or code blocks.`;

    const completion = await groqClient.getChatCompletion([
      {
        role: 'system',
        content: 'You are a tech career advisor providing market insights. Always respond with valid JSON only matching the exact structure requested.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.7,
      max_tokens: 2000,
      model: 'llama-3.3-70b-versatile'
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    // Parse JSON response
    const insights = JSON.parse(content);

    // Validate and ensure correct structure
    const validatedInsights = {
      overview: insights.overview || 'Market analysis shows strong demand for modern development skills.',
      trends: Array.isArray(insights.trends) ? insights.trends.map(t => ({
        skillName: t.skillName || t.skill || 'Unknown',
        category: t.category || 'General',
        demandScore: t.demandScore || 0,
        insight: t.insight || t.recommendation || 'High demand in the market'
      })) : [],
      emergingSkills: Array.isArray(insights.emergingSkills) ? insights.emergingSkills : [],
      recommendations: Array.isArray(insights.recommendations) ? insights.recommendations : [],
      generatedAt: new Date().toISOString(),
      model: completion.model
    };

    return validatedInsights;

  } catch (error) {
    console.error('[Market Insights] Error generating AI insights:', error.message);
    return generateBasicInsights(trendData);
  }
}

/**
 * Generate basic insights without AI (fallback)
 */
function generateBasicInsights(trendData) {
  // Sort by demand or growth
  const sorted = [...trendData].sort((a, b) => {
    const scoreA = (a.demand || 0) + (a.growth || 0);
    const scoreB = (b.demand || 0) + (b.growth || 0);
    return scoreB - scoreA;
  });

  const topSkills = sorted.slice(0, 8);
  const emerging = sorted.filter(s => (s.growth || 0) > 15).slice(0, 5);

  return {
    overview: `Analysis of ${trendData.length} skills shows strong demand for technical and emerging technologies. The market favors candidates with modern development skills and cloud-native expertise.`,
    trends: topSkills.map(skill => ({
      skillName: skill.name || skill.skillName || 'Unknown',
      category: skill.category || 'General',
      demandScore: skill.demand || skill.demandScore || 0,
      insight: `High market demand with ${skill.demand || 0}% industry adoption. ${
        skill.growth > 20 ? 'Experiencing rapid growth - great opportunity for early adopters.' :
        skill.growth > 10 ? 'Steady growth trajectory with consistent demand.' :
        'Stable and established skill with strong market presence.'
      }`
    })),
    emergingSkills: emerging.length > 0 
      ? emerging.map(s => s.name || s.skillName) 
      : ['Rust', 'WebAssembly', 'Deno', 'Tauri', 'SolidJS'],
    recommendations: [
      'Build projects showcasing top trending skills to demonstrate practical expertise',
      'Obtain relevant certifications from recognized platforms like AWS, Google Cloud, or Microsoft',
      'Contribute to open-source projects in high-demand areas to build your portfolio',
      'Stay updated with emerging technologies and frameworks through tech blogs and conferences',
      'Network with professionals in high-growth tech domains via LinkedIn and tech communities'
    ],
    generatedAt: new Date().toISOString(),
    fallback: true
  };
}

module.exports = {
  generateMarketInsights
};
