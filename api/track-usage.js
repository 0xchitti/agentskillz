// Track skill usage events for outcome-based reviews
// Called each time an agent uses a purchased skill

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
            usageEvent,
            humanAccepted,
            correctionNeeded,
            timeSpent,
            outcome,
            context
        } = req.body;

        if (!purchaseId || !usageEvent) {
            return res.status(400).json({ 
                error: 'Purchase ID and usage event required' 
            });
        }

        // Find the purchase record
        const purchase = Database.findPurchase(purchaseId);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        // Create usage record
        const usageRecord = {
            id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            purchaseId,
            skillId: purchase.skillId,
            buyerAgent: purchase.buyerAgent,
            usageEvent, // 'skill_executed', 'human_feedback', 'task_completed'
            humanAccepted: humanAccepted || false,
            correctionNeeded: correctionNeeded || false,
            timeSpent: timeSpent || null,
            outcome: outcome || 'unknown', // 'success', 'partial', 'failure'
            context: context || '',
            timestamp: new Date().toISOString()
        };

        Database.addUsageRecord(usageRecord);

        // Calculate eligibility for review
        const usageStats = Database.getUsageStats(purchaseId);
        const isEligibleForReview = usageStats.usageCount >= 5 || usageStats.daysActive >= 7;

        res.json({
            success: true,
            message: 'Usage tracked successfully',
            usageId: usageRecord.id,
            usageStats,
            eligibleForReview: isEligibleForReview
        });

    } catch (error) {
        console.error('Usage tracking error:', error);
        res.status(500).json({ 
            error: 'Failed to track usage',
            details: error.message 
        });
    }
}