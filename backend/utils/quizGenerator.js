const groqClient = require('./groqClient');

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const generateQuizQuestions = async (context) => {
    if (!groqClient.isAvailable()) {
        throw new Error('Groq AI is not configured. Please set GROQ_API_KEY or GROQ_API_KEY_BACKUP.');
    }

    // Handle both string and object input for backward compatibility
    const topic = typeof context === 'string' ? context : (context.title || 'General');
    const skills = Array.isArray(context.skills) && context.skills.length > 0 ? context.skills.join(', ') : topic;
    const description = context.description ? `Context: ${context.description}` : '';

    const prompt = `Generate 20 multiple-choice questions for a student learning these topics: "${skills}".
${description}

CRITICAL INSTRUCTIONS:
1. Cover ALL the provided topics/skills (${skills}). Do not focus on just one.
2. Difficulty Distribution:
   - 30% Easy (Basic concepts, definitions)
   - 50% Medium (Application, simple scenarios, common patterns)
   - 20% Hard (Edge cases, performance, deep internals, tricky debugging)
3. Question Style:
   - Avoid repetitive "What is X?" questions.
   - Include code snippet analysis where applicable.
   - Use scenario-based questions (e.g., "Which method would you use to...").
4. JSON FORMAT ONLY:
   - Return strictly valid JSON.
   - NO COMMENTS inside the JSON.
   - Use double quotes for all keys.
   - **CODE SNIPPETS**: If the question asks "What is the output...", "What does this code do...", or refers to "the following code", you **MUST** include the \`codeSnippet\` field.

Return ONLY a raw JSON array (no markdown) with this structure:
[
  {
    "id": 1,
    "question": "What is the output of the following code?",
    "codeSnippet": "const a = 10;\nconsole.log(a * 2);", // REQUIRED if question implies code
    "options": ["10", "20", "undefined", "Error"],
    "correct": 1
  }
]`;

    try {
        const completion = await groqClient.chat.completions.create({
            model: MODEL,
            temperature: 0.5,
            max_tokens: 3000,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert technical interviewer and educator. You generate high-quality, diverse, and accurate quiz questions. You output ONLY valid minified JSON without comments.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const content = completion.choices[0]?.message?.content?.trim();
        if (!content) {
            throw new Error('Received empty response from AI.');
        }

        // Remove markdown code blocks if present
        let cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Robust JSON extraction
        const start = cleanContent.indexOf('[');
        const end = cleanContent.lastIndexOf(']');

        if (start === -1 || end === -1 || start > end) {
            throw new Error('AI response does not contain a valid JSON array.');
        }

        let jsonString = cleanContent.substring(start, end + 1);
        
        // Parse with multiple fallback strategies
        let questions;
        try {
            questions = JSON.parse(jsonString);
        } catch (firstError) {
            console.log('First parse failed, attempting fixes...');
            try {
                // Strategy 1: Replace literal newlines/tabs in string values with escaped versions
                // This regex matches content within quoted strings and escapes problematic characters
                jsonString = jsonString.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
                    return match
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t');
                });
                
                questions = JSON.parse(jsonString);
            } catch (secondError) {
                console.log('Second parse failed, trying aggressive cleanup...');
                try {
                    // Strategy 2: More aggressive - remove all actual control chars
                    jsonString = jsonString.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, ' ');
                    questions = JSON.parse(jsonString);
                } catch (thirdError) {
                    console.error('All parse attempts failed.');
                    console.error('Raw JSON (first 800 chars):', jsonString.substring(0, 800));
                    throw new Error(`JSON parse failed: ${thirdError.message}`);
                }
            }
        }

        if (!Array.isArray(questions)) {
            throw new Error('AI response was not a JSON array.');
        }

        // Validate and Cleanup Questions
        questions = questions.filter(q => {
            // 1. Basic structure check
            if (!q.question || !q.options || q.correct === undefined) return false;

            // 2. Check for missing code snippets
            const needsCode = /output|code|snippet|following/i.test(q.question);
            const hasCode = !!q.codeSnippet;

            if (needsCode && !hasCode) {
                console.warn(`Filtering question due to missing code snippet: "${q.question}"`);
                return false;
            }
            return true;
        });

        // 3. Fallback: If we filtered too many, we might need to be less strict or retry (omitted for now to avoid complexity)
        if (questions.length < 5) {
            console.warn("Too many questions filtered. Returning what we have.");
        }

        console.log(`Returning ${questions.length} valid questions.`);
        return questions.slice(0, 20);
    } catch (error) {
        console.error('Error generating quiz questions:', error);
        throw new Error('Failed to generate quiz questions: ' + error.message);
    }
};

module.exports = { generateQuizQuestions };
