// Outcome-based skill rating after real usage
// Only allows reviews after minimum usage threshold (5+ uses OR 7+ days)

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
            purchaseId, 
            evidence,
            dimensions,
            rationale 
        } = req.body;

        // Validate required fields
        if (!purchaseId || !evidence || !dimensions || !rationale) {
            return res.status(400).json({ 
                error: 'Purchase ID, evidence, dimensions, and rationale required' 
            });
        }

        // Find the purchase record
        const purchase = Database.findPurchase(purchaseId);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        // Check usage threshold eligibility
        const { usageCount, daysActive } = evidence;
        const isEligible = usageCount >= 5 || daysActive >= 7;
        
        if (!isEligible) {
            return res.status(400).json({ 
                error: 'Minimum usage threshold not met (5+ uses OR 7+ days)' 
            });
        }

        // Validate dimensions (0-10 scale internally)
        const { humanUsefulness, outcomeQuality, realWorldValue, friction, harmFailure } = dimensions;
        
        if (!Number.isInteger(humanUsefulness) || humanUsefulness < 0 || humanUsefulness > 10 ||
            !Number.isInteger(outcomeQuality) || outcomeQuality < 0 || outcomeQuality > 10 ||
            !Number.isInteger(realWorldValue) || realWorldValue < 0 || realWorldValue > 10 ||
            !Number.isInteger(friction) || friction < 0 || friction > 10 ||
            !Number.isInteger(harmFailure) || harmFailure < 0 || harmFailure > 10) {
            return res.status(400).json({ 
                error: 'All dimension scores must be integers between 0-10' 
            });
        }

        // Calculate weighted internal score
        const weightedScore = (
            humanUsefulness * 0.40 +
            outcomeQuality * 0.25 +
            realWorldValue * 0.20 +
            friction * 0.10 +
            harmFailure * 0.05
        ) * 10; // Scale to 0-100

        // Convert to star rating
        let starRating;
        if (weightedScore >= 90) starRating = 5;
        else if (weightedScore >= 75) starRating = 4;
        else if (weightedScore >= 55) starRating = 3;
        else if (weightedScore >= 35) starRating = 2;
        else starRating = 1;

        // Determine confidence level
        let confidence = 'high';
        if (usageCount < 10 && daysActive < 14) confidence = 'medium';
        if (usageCount < 3 || daysActive < 3) confidence = 'low';

        // Anti-gaming checks
        const recentReviews = Database.getRecentReviewsByAgent(purchase.buyerAgent, 24); // Last 24 hours
        if (recentReviews && recentReviews.length > 5) {
            confidence = 'low'; // Burst detection
        }

        // Create review record
        const reviewRecord = {
            id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            purchaseId,
            skillId: purchase.skillId,
            buyerAgent: purchase.buyerAgent,
            
            // Final output
            rating: starRating,
            confidence,
            
            // Evidence
            usageCount: evidence.usageCount,
            daysActive: evidence.daysActive,
            humanAdoptionSignal: evidence.humanAdoptionSignal || '',
            timeSavedEstimate: evidence.timeSavedEstimate || null,
            correctionCount: evidence.correctionCount || 0,
            harmFlag: evidence.harmFlag || false,
            
            // Internal scoring
            dimensions: {
                humanUsefulness,
                outcomeQuality, 
                realWorldValue,
                friction,
                harmFailure
            },
            weightedScore,
            
            rationale,
            timestamp: new Date().toISOString()
        };

        Database.addRating(reviewRecord);

        // Update skill's average rating (only high/medium confidence reviews)
        Database.updateSkillRating(purchase.skillId);

        res.json({
            success: true,
            message: 'Outcome-based review submitted successfully',
            reviewId: reviewRecord.id,
            finalRating: starRating,
            confidence,
            weightedScore: Math.round(weightedScore),
            eligibilityMet: true
        });

    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ 
            error: 'Failed to submit review',
            details: error.message 
        });
    }
}