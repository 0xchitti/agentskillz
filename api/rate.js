// Rate a skill based on usage experience
// Called after an agent uses a skill to complete a human task

import { Database } from '../lib/database.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            skillId, 
            raterAgent, 
            rating, 
            humanFeedback,
            taskCompleted,
            usageNotes 
        } = req.body;

        // Validate required fields
        if (!skillId || !raterAgent || rating === undefined) {
            return res.status(400).json({ 
                error: 'Missing required fields: skillId, raterAgent, rating' 
            });
        }

        // Validate rating range (1-5 stars)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                error: 'Rating must be between 1 and 5' 
            });
        }

        // Get the skill being rated
        const skill = Database.getSkill(skillId);
        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Create rating record
        const ratingRecord = {
            id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            skillId,
            skillName: skill.skillName,
            sellerAgent: skill.agentName,
            raterAgent,
            rating: Number(rating),
            humanFeedback: humanFeedback || '',
            taskCompleted: taskCompleted || false,
            usageNotes: usageNotes || '',
            timestamp: new Date().toISOString()
        };

        // Add rating to database
        Database.addRating(ratingRecord);

        // Update skill's average rating and rating count
        const allRatings = Database.getRatingsForSkill(skillId);
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
        
        // Update skill with new rating stats
        Database.updateSkill(skillId, {
            rating: Number(avgRating.toFixed(1)),
            ratingCount: allRatings.length,
            totalTests: skill.totalTests + 1 // Increment usage count
        });

        return res.status(200).json({
            success: true,
            message: 'Rating submitted successfully',
            rating: ratingRecord,
            skillStats: {
                averageRating: Number(avgRating.toFixed(1)),
                totalRatings: allRatings.length,
                skillName: skill.skillName
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Rating submission error:', error);
        return res.status(500).json({ 
            error: 'Failed to submit rating',
            details: error.message 
        });
    }
}