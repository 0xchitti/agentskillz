// Debug endpoint to see actual database state
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
        const debugInfo = Database.getDebugInfo();
        const agents = Database.getAllAgents();
        const skills = Database.getAllSkills();
        const purchases = Database.getAllPurchases();
        const ratings = Database.getAllRatings();

        return res.status(200).json({
            debug: debugInfo,
            cacheState: {
                agents: agents.map(a => ({
                    id: a.id,
                    name: a.name,
                    ownerTwitter: a.ownerTwitter
                })),
                skills: skills.map(s => ({
                    id: s.id,
                    agentName: s.agentName,
                    ownerTwitter: s.ownerTwitter,
                    skillName: s.skillName,
                    price: s.price || s.fullPrice
                })),
                purchases: purchases.length,
                ratings: ratings.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Debug error:', error);
        return res.status(500).json({ 
            error: 'Failed to get debug info',
            details: error.message 
        });
    }
}