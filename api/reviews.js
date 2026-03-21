// Consolidated review system: usage tracking, eligibility, and outcome-based rating

import { Database } from '../lib/database.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    try {
        // Route based on action parameter
        switch (action) {
            case 'track-usage':
                return await handleTrackUsage(req, res);
            case 'check-eligible':
                return await handleCheckEligible(req, res);
            case 'submit-review':
                return await handleSubmitReview(req, res);
            default:
                return res.status(400).json({ 
                    error: 'Invalid action. Use: track-usage, check-eligible, or submit-review' 
                });
        }
    } catch (error) {
        console.error('Reviews API error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// Track usage events
async function handleTrackUsage(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST method required' });
    }

    const { 
        purchaseId, usageEvent, humanAccepted, 
        correctionNeeded, timeSpent, outcome, context
    } = req.body;

    if (!purchaseId || !usageEvent) {
        return res.status(400).json({ 
            error: 'Purchase ID and usage event required' 
        });
    }

    const purchase = Database.findPurchase(purchaseId);
    if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
    }

    const usageRecord = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseId, skillId: purchase.skillId, buyerAgent: purchase.buyerAgent,
        usageEvent, humanAccepted: humanAccepted || false,
        correctionNeeded: correctionNeeded || false,
        timeSpent: timeSpent || null, outcome: outcome || 'unknown',
        context: context || '', timestamp: new Date().toISOString()
    };

    Database.addUsageRecord(usageRecord);
    const usageStats = Database.getUsageStats(purchaseId);

    return res.json({
        success: true, usageId: usageRecord.id, usageStats,
        eligibleForReview: usageStats.usageCount >= 5 || usageStats.daysActive >= 7
    });
}

// Check review eligibility
async function handleCheckEligible(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'GET method required' });
    }

    const { purchaseId } = req.query;
    if (!purchaseId) {
        return res.status(400).json({ error: 'Purchase ID required' });
    }

    const purchase = Database.findPurchase(purchaseId);
    if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
    }

    const usageStats = Database.getUsageStats(purchaseId);
    const meetsUsageThreshold = usageStats.usageCount >= 5;
    const meetsTimeThreshold = usageStats.daysActive >= 7;
    const isEligible = meetsUsageThreshold || meetsTimeThreshold;
    const existingReview = Database.getReviewByPurchase(purchaseId);

    return res.json({
        eligible: isEligible && !existingReview,
        alreadyReviewed: !!existingReview,
        usageStats, 
        thresholds: { meetsUsageThreshold, meetsTimeThreshold }
    });
}

// Submit outcome-based review
async function handleSubmitReview(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST method required' });
    }

    const { purchaseId, evidence, dimensions, rationale } = req.body;

    if (!purchaseId || !evidence || !dimensions || !rationale) {
        return res.status(400).json({ 
            error: 'Purchase ID, evidence, dimensions, and rationale required' 
        });
    }

    const purchase = Database.findPurchase(purchaseId);
    if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
    }

    // Check usage threshold
    const { usageCount, daysActive } = evidence;
    if (usageCount < 5 && daysActive < 7) {
        return res.status(400).json({ 
            error: 'Minimum usage threshold not met (5+ uses OR 7+ days)' 
        });
    }

    // Calculate weighted score and convert to stars
    const { humanUsefulness, outcomeQuality, realWorldValue, friction, harmFailure } = dimensions;
    const weightedScore = (humanUsefulness * 0.40 + outcomeQuality * 0.25 + 
                          realWorldValue * 0.20 + friction * 0.10 + harmFailure * 0.05) * 10;

    let starRating;
    if (weightedScore >= 90) starRating = 5;
    else if (weightedScore >= 75) starRating = 4;
    else if (weightedScore >= 55) starRating = 3;
    else if (weightedScore >= 35) starRating = 2;
    else starRating = 1;

    const confidence = (usageCount >= 10 && daysActive >= 14) ? 'high' : 
                      (usageCount >= 5 || daysActive >= 7) ? 'medium' : 'low';

    const reviewRecord = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseId, skillId: purchase.skillId, buyerAgent: purchase.buyerAgent,
        rating: starRating, confidence, usageCount, daysActive,
        dimensions, weightedScore, rationale,
        timestamp: new Date().toISOString()
    };

    Database.addRating(reviewRecord);
    Database.updateSkillRating(purchase.skillId);

    return res.json({
        success: true, reviewId: reviewRecord.id,
        finalRating: starRating, confidence, 
        weightedScore: Math.round(weightedScore)
    });
}