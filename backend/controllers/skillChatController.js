const skillMarketService = require('../services/skillMarketService');
const groqClient = require('../utils/groqClient');

/**
 * Chat with AI about trending skills shown in dashboard
 * Provides real-time answers about skill demand, trends, etc.
 * No conversation history is maintained
 */
const chatAboutSkills = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Message is required',
                response: 'Please provide a valid question about trending skills.'
            });
        }

        // Get current market data for context
        const [allSkills, trends] = await Promise.all([
            skillMarketService.getSkillDemandData(),
            skillMarketService.getTrendPredictions()
        ]);

        // Build context for the AI
        const skillContext = {
            topSkills: allSkills.slice(0, 10).map(s => ({
                name: s.skillName,
                demand: s.demandScore,
                trend: s.trend,
                growth: s.predictedGrowth6m,
                category: s.category,
                salary: s.avgSalary
            })),
            rising: trends.rising.map(s => ({
                name: s.skillName,
                demand: s.demandScore,
                growth: s.predictedGrowth6m,
                category: s.category
            })),
            stable: trends.stable.map(s => ({
                name: s.skillName,
                demand: s.demandScore,
                category: s.category
            }))
        };

        // Create AI prompt
        const systemPrompt = `You are a helpful assistant that answers questions about trending tech skills in the job market.

Current Market Data:
- Top Skills by Demand: ${JSON.stringify(skillContext.topSkills, null, 2)}
- Rising/Hot Skills: ${JSON.stringify(skillContext.rising, null, 2)}
- Stable Skills: ${JSON.stringify(skillContext.stable, null, 2)}

Guidelines:
- Answer ONLY questions about the skills shown in the data above
- Be concise and specific - keep responses under 3-4 sentences
- Use the exact demand scores, growth percentages, and categories from the data
- If asked about a skill not in the data, say "I can only provide information about the trending skills currently tracked in the dashboard."
- Focus on factual information: demand scores, growth rates, categories, trends
- Don't make up information or speculate beyond the provided data
- Format percentages with % symbol (e.g., "95% demand score")
`;

        const userMessage = message.trim();

        const buildFallbackResponse = () => {
            const normalized = userMessage.toLowerCase();
            const combined = [...skillContext.topSkills, ...skillContext.rising, ...skillContext.stable];
            const uniqueSkills = Array.from(
                new Map(combined.map((skill) => [String(skill.name).toLowerCase(), skill])).values()
            );

            const matched = uniqueSkills.find((skill) =>
                normalized.includes(String(skill.name).toLowerCase())
            );

            if (!matched) {
                return 'I can only provide information about the trending skills currently tracked in the dashboard.';
            }

            const trendLabel = matched.trend || (skillContext.rising.some((s) => s.name === matched.name) ? 'rising' : 'stable');
            const demandText = typeof matched.demand === 'number' ? `${matched.demand}% demand score` : 'a strong demand score';
            const growthText = typeof matched.growth === 'number' ? ` with ${matched.growth}% 6‑month growth` : '';
            const categoryText = matched.category ? ` in ${matched.category}` : '';

            return `${matched.name} is ${trendLabel}${categoryText}, showing ${demandText}${growthText}.`;
        };

        if (!groqClient.isAvailable()) {
            return res.json({
                response: buildFallbackResponse(),
                fallback: true,
                timestamp: new Date().toISOString()
            });
        }

        try {
            const completion = await groqClient.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.3,
                max_tokens: 300,
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
            });

            const aiResponse = completion.choices[0]?.message?.content?.trim();
            if (!aiResponse) {
                throw new Error('No response from AI');
            }

            return res.json({
                response: aiResponse,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Skill Chat] Groq error, using fallback:', error.message || error);
            return res.json({
                response: buildFallbackResponse(),
                fallback: true,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('[Skill Chat] Error:', error);
        res.status(500).json({
            error: 'Failed to process question',
            response: 'Sorry, I encountered an error processing your question. Please try again.'
        });
    }
};

module.exports = {
    chatAboutSkills
};
