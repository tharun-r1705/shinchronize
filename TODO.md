# AI Profile Data Integration - TODO

## Completed Tasks
- [x] Modified `buildStudentSnapshot` function in `backend/services/agentService.js` to include profile data (skills, projects, experience, certifications) in the STUDENT_SNAPSHOT_JSON
- [x] Updated system prompt in `buildSystemPrompt` to instruct AI to use profile data from snapshot for questions about skills, background, projects, internships, or experience

## Summary
The AI assistant now has direct access to the user's profile data (skills, projects, experience, certifications) in its context via the STUDENT_SNAPSHOT_JSON. When users ask questions like "What’s your current level and background? List the skills/tools you already know and any projects or internships you’ve done.", the AI will use this data directly without needing to call additional tools, making responses faster and more accurate.

## Testing
- Test the AI assistant with queries about skills, projects, and experience
- Verify that the profile data is correctly included in the snapshot
- Ensure the AI responds appropriately to profile-related questions
