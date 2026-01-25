/**
 * Roadmap Routes
 * API endpoints for managing student roadmaps
 */

const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const { authenticate } = require('../utils/authMiddleware');

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
            milestone.status = status;
            if (status === 'completed' && !milestone.completedAt) {
                milestone.completedAt = new Date();
            }
            await roadmap.save();
        }
        
        res.json({ success: true, roadmap });
    } catch (error) {
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
