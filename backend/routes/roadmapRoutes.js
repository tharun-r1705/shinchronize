/**
 * Roadmap Routes
 * API endpoints for managing student roadmaps
 */

const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const Student = require('../models/Student');
const { authenticate } = require('../utils/authMiddleware');

const normalizeProjectMilestones = (roadmap) => {
    if (!roadmap || !roadmap.milestones) return;
    roadmap.milestones.forEach((milestone) => {
        if (milestone.category !== 'project') return;

        const hasSubmission = Boolean(milestone.projectSubmission?.githubLink);
        if (!hasSubmission) {
            milestone.status = milestone.status === 'completed' ? 'not-started' : milestone.status;
            milestone.completedAt = undefined;
            if (milestone.projectSubmission && !milestone.projectSubmission.githubLink) {
                milestone.projectSubmission = undefined;
            }
        }
    });
};


// Get student's active roadmap
router.get('/', authenticate(['student']), async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({
            student: req.user.id,
            isActive: true
        });


        if (!roadmap) {
            return res.json({
                success: true,
                roadmap: null,
                message: 'No active roadmap found. Ask Zenith AI to create one for you!'
            });
        }

        normalizeProjectMilestones(roadmap);
        res.json({ success: true, roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all roadmaps (including inactive)
router.get('/all', authenticate(['student']), async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({ student: req.user.id })
            .sort({ createdAt: -1 });


        roadmaps.forEach(normalizeProjectMilestones);
        res.json({ success: true, roadmaps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get specific roadmap by ID
router.get('/:id', authenticate(['student']), async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({
            _id: req.params.id,
            student: req.user.id
        });


        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: 'Roadmap not found'
            });
        }

        normalizeProjectMilestones(roadmap);
        res.json({ success: true, roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update milestone status (manual update from UI)
router.patch('/milestone/:milestoneId', authenticate(['student']), async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { status } = req.body;

        const validStatuses = ['not-started', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const roadmap = await Roadmap.findOne({
            student: req.user.id,
            isActive: true,
            'milestones.id': milestoneId
        });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: 'Roadmap or milestone not found'
            });
        }

        // Update the milestone status
        const milestone = roadmap.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            // Prevent manual completion of project milestones
            if (milestone.category === 'project' && status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Project milestones can only be completed by submitting a GitHub repository link'
                });
            }

            // Check if completing this milestone requires passing a quiz
            if (status === 'completed' && milestone.requiresQuiz && milestone.quizStatus !== 'passed') {
                return res.status(400).json({
                    success: false,
                    message: `You must pass the skill test with >75% to complete this milestone. Your last score: ${milestone.lastQuizScore || 0}%`,
                    quizRequired: true
                });
            }

            milestone.status = status;

            // Handle completion
            if (status === 'completed' && !milestone.completedAt) {
                milestone.completedAt = new Date();

                // Automatically add milestone skills to student's profile if any
                if (milestone.skills && milestone.skills.length > 0) {
                    const student = await Student.findById(req.user.id);
                    if (student) {
                        let skillsAdded = false;
                        milestone.skills.forEach(skill => {
                            if (!student.skills.includes(skill)) {
                                student.skills.push(skill);
                                skillsAdded = true;
                            }
                        });
                        if (skillsAdded) {
                            await student.save();
                        }
                    }
                }
            }
            // Handle restart/reset
            else if (status === 'in-progress' || status === 'not-started') {
                milestone.completedAt = undefined;
                milestone.quizStatus = 'none';
                milestone.lastQuizScore = 0;
                milestone.quizQuestions = []; // Force fresh generation on next attempt
            }
            await roadmap.save();
        }


        res.json({ success: true, roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit quiz results for a milestone
router.post('/milestone/:milestoneId/quiz', authenticate(['student']), async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { score } = req.body; // Score as a percentage (0-100)

        if (typeof score !== 'number' || score < 0 || score > 100) {
            return res.status(400).json({ success: false, message: 'Invalid score' });
        }

        const roadmap = await Roadmap.findOne({
            student: req.user.id,
            isActive: true,
            'milestones.id': milestoneId
        });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap or milestone not found' });
        }

        const milestone = roadmap.milestones.find(m => m.id === milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: 'Milestone not found' });
        }

        // Update quiz status
        milestone.lastQuizScore = score;
        milestone.quizAttempts.push({ score, calculatedAt: new Date() });

        if (score >= 75) {
            milestone.quizStatus = 'passed';

            // Auto-complete if they passed, even if skip start
            if (milestone.status !== 'completed') {
                milestone.status = 'completed';
                milestone.completedAt = new Date();

                // Automatically add milestone skills to student's profile if any
                if (milestone.skills && milestone.skills.length > 0) {
                    const student = await Student.findById(req.user.id);
                    if (student) {
                        let skillsAdded = false;
                        milestone.skills.forEach(skill => {
                            if (!student.skills.includes(skill)) {
                                student.skills.push(skill);
                                skillsAdded = true;
                            }
                        });
                        if (skillsAdded) {
                            await student.save();
                        }
                    }
                }
            }
        } else {
            milestone.quizStatus = 'failed';
        }

        await roadmap.save();

        res.json({
            success: true,
            passed: score >= 75,
            score,
            roadmap,
            message: score >= 75
                ? 'Congratulations! You passed the skill test and completed this milestone.'
                : 'You did not pass the skill test this time. Review the materials and try again!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit project for a milestone
router.post('/milestone/:milestoneId/project', authenticate(['student']), async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { githubLink } = req.body;

        if (!githubLink) {
            return res.status(400).json({ success: false, message: 'GitHub link is required' });
        }

        const roadmap = await Roadmap.findOne({
            student: req.user.id,
            isActive: true,
            'milestones.id': milestoneId
        });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap or milestone not found' });
        }

        const milestone = roadmap.milestones.find(m => m.id === milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: 'Milestone not found' });
        }

        // Update project submission
        milestone.projectSubmission = {
            githubLink: githubLink,
            submittedAt: new Date(),
            status: 'verified' // Auto-verify for now
        };

        // Mark milestone as completed
        milestone.status = 'completed';
        milestone.completedAt = new Date();

        // Add skills to student profile
        if (milestone.skills && milestone.skills.length > 0) {
            const student = await Student.findById(req.user.id);
            if (student) {
                let skillsAdded = false;
                milestone.skills.forEach(skill => {
                    if (!student.skills.includes(skill)) {
                        student.skills.push(skill);
                        skillsAdded = true;
                    }
                });
                if (skillsAdded) {
                    await student.save();
                }
            }
        }

        await roadmap.save();

        res.json({ success: true, roadmap, message: 'Project submitted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reset project submission for a milestone
router.delete('/milestone/:milestoneId/project', authenticate(['student']), async (req, res) => {
    try {
        const { milestoneId } = req.params;

        const roadmap = await Roadmap.findOne({
            student: req.user.id,
            isActive: true,
            'milestones.id': milestoneId
        });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap or milestone not found' });
        }

        const milestone = roadmap.milestones.find(m => m.id === milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: 'Milestone not found' });
        }

        // Clear project submission (both new and old formats)
        milestone.projectSubmission = undefined;
        milestone.selectedProject = undefined;
        milestone.status = 'not-started';
        milestone.completedAt = undefined;

        await roadmap.save();

        res.json({ success: true, roadmap, message: 'Project reset successfully. You can now submit a new project.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Generate or fetch quiz for a milestone
router.get('/milestone/:milestoneId/quiz', authenticate(['student']), async (req, res) => {
    try {
        const { milestoneId } = req.params;

        const roadmap = await Roadmap.findOne({
            student: req.user.id,
            isActive: true,
            'milestones.id': milestoneId
        });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap or milestone not found' });
        }

        const milestone = roadmap.milestones.find(m => m.id === milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: 'Milestone not found' });
        }

        // Return existing questions if valid and sufficient
        if (milestone.quizQuestions && milestone.quizQuestions.length >= 5 && !req.query.refresh) {
            return res.json({ success: true, questions: milestone.quizQuestions });
        }

        // Generate new questions
        const context = {
            title: milestone.title,
            skills: milestone.skills || [],
            description: milestone.description
        };
        const { generateQuizQuestions } = require('../utils/quizGenerator');

        console.log(`Generating quiz for context: ${JSON.stringify(context)}`);
        const questions = await generateQuizQuestions(context);

        // Save to milestone - using Mongoose parent document save
        // We need to locate the subdocument in the array and update it
        const milestoneIndex = roadmap.milestones.findIndex(m => m.id === milestoneId);
        if (milestoneIndex !== -1) {
            roadmap.milestones[milestoneIndex].quizQuestions = questions;
            await roadmap.save();
        }

        res.json({ success: true, questions });
    } catch (error) {
        console.error('Quiz route error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// Delete roadmap
router.delete('/:id', authenticate(['student']), async (req, res) => {
    try {
        const result = await Roadmap.findOneAndDelete({
            _id: req.params.id,
            student: req.user.id
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Roadmap not found'
            });
        }

        res.json({ success: true, message: 'Roadmap deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Set a roadmap as active
router.patch('/:id/activate', authenticate(['student']), async (req, res) => {
    try {
        // Deactivate all other roadmaps
        await Roadmap.updateMany(
            { student: req.user.id },
            { isActive: false }
        );

        // Activate the specified roadmap
        const roadmap = await Roadmap.findOneAndUpdate(
            { _id: req.params.id, student: req.user.id },
            { isActive: true },
            { new: true }
        );

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: 'Roadmap not found'
            });
        }

        res.json({ success: true, roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
