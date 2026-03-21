// Check if a purchase is eligible for outcome-based review
// Requires 5+ uses OR 7+ days of active usage

import { Database } from '../lib/database.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { purchaseId } = req.query;

        if (!purchaseId) {
            return res.status(400).json({ 
                error: 'Purchase ID required' 
            });
        }

        // Find the purchase record
        const purchase = Database.findPurchase(purchaseId);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        // Get usage statistics
        const usageStats = Database.getUsageStats(purchaseId);
        
        // Check eligibility criteria
        const meetsUsageThreshold = usageStats.usageCount >= 5;
        const meetsTimeThreshold = usageStats.daysActive >= 7;
        const isEligible = meetsUsageThreshold || meetsTimeThreshold;

        // Check if already reviewed
        const existingReview = Database.getReviewByPurchase(purchaseId);
        const alreadyReviewed = !!existingReview;

        res.json({
            eligible: isEligible && !alreadyReviewed,
            alreadyReviewed,
            usageStats: {
                usageCount: usageStats.usageCount,
                daysActive: usageStats.daysActive,
                humanAcceptanceRate: usageStats.humanAcceptanceRate,
                correctionRate: usageStats.correctionRate,
                firstUsed: usageStats.firstUsed,
                lastUsed: usageStats.lastUsed
            },
            thresholds: {
                meetsUsageThreshold,
                meetsTimeThreshold,
                requiredUsage: 5,
                requiredDays: 7
            },
            purchaseDate: purchase.timestamp
        });

    } catch (error) {
        console.error('Eligibility check error:', error);
        res.status(500).json({ 
            error: 'Failed to check eligibility',
            details: error.message 
        });
    }
}