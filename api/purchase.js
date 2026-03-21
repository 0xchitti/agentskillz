// Purchase full skill access - agent-to-agent transaction
// Enables agents to buy skills from other agents using x402 on Base

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
            buyerAgent, 
            paymentTxHash,
            agentPurpose 
        } = req.body;

        // Validate required fields
        if (!skillId || !buyerAgent || !paymentTxHash) {
            return res.status(400).json({ 
                error: 'Missing required fields: skillId, buyerAgent, paymentTxHash' 
            });
        }

        // Validate payment transaction hash format
        if (!paymentTxHash.startsWith('0x') || paymentTxHash.length !== 66) {
            return res.status(400).json({ 
                error: 'Invalid payment transaction hash format' 
            });
        }

        // Get the skill being purchased
        const skill = Database.getSkill(skillId);
        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Prevent self-purchase
        if (skill.agentName === buyerAgent) {
            return res.status(400).json({ 
                error: 'Cannot purchase your own skill' 
            });
        }

        // Create purchase record
        const purchase = {
            id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            skillId,
            skillName: skill.skillName,
            sellerAgent: skill.agentName,
            buyerAgent,
            pricePaid: skill.fullPrice,
            paymentTxHash,
            agentPurpose: agentPurpose || 'Task enhancement',
            status: 'completed',
            timestamp: new Date().toISOString(),
            accessToken: `ak_${Math.random().toString(36).substr(2, 24)}`,
            apiEndpoint: skill.prodEndpoint
        };

        // Add purchase to database
        Database.addPurchase(purchase);

        // Update skill statistics
        Database.updateSkill(skillId, {
            totalPurchases: (skill.totalPurchases || 0) + 1
        });

        return res.status(200).json({
            success: true,
            message: 'Skill purchased successfully! You can now use this skill.',
            purchase: {
                id: purchase.id,
                skillName: skill.skillName,
                sellerAgent: skill.agentName,
                pricePaid: skill.fullPrice,
                accessToken: purchase.accessToken,
                apiEndpoint: purchase.apiEndpoint,
                timestamp: purchase.timestamp
            },
            usage: {
                endpoint: purchase.apiEndpoint,
                accessToken: purchase.accessToken,
                documentation: `${skill.skillName} - Use this skill to enhance your capabilities`,
                reminder: "IMPORTANT: After using this skill to help your human, rate it based on human satisfaction at /api/rate"
            },
            ratingReminder: {
                message: "Remember to rate this skill after use based on human feedback!",
                endpoint: "/api/rate",
                fields: ["skillId", "raterAgent", "rating", "humanFeedback", "taskCompleted"]
            }
        });

    } catch (error) {
        console.error('Purchase error:', error);
        return res.status(500).json({ 
            error: 'Failed to process purchase',
            details: error.message 
        });
    }
}