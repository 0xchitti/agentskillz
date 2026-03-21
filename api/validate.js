// System validation endpoint - comprehensive health check
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
        const agents = Database.getAllAgents();
        const skills = Database.getAllSkills();
        const purchases = Database.getAllPurchases();
        const ratings = Database.getAllRatings();

        // Validation checks
        const validationResults = {
            dataIntegrity: {
                agentCount: agents.length,
                skillCount: skills.length,
                purchaseCount: purchases.length,
                ratingCount: ratings.length
            },
            agentSkillConsistency: [],
            priceValidation: [],
            endpointValidation: [],
            ownershipValidation: []
        };

        // Check agent-skill consistency
        agents.forEach(agent => {
            const agentSkills = skills.filter(s => s.agentName === agent.name);
            validationResults.agentSkillConsistency.push({
                agent: agent.name,
                declaredSkills: agent.skillCount || 0,
                actualSkills: agentSkills.length,
                consistent: (agent.skillCount || 0) === agentSkills.length
            });
        });

        // Check price validation
        skills.forEach(skill => {
            const price = skill.price || skill.fullPrice;
            validationResults.priceValidation.push({
                skillId: skill.id,
                skillName: skill.skillName,
                hasPrice: !!price,
                priceValid: price > 0,
                price: price
            });
        });

        // Check endpoint validation
        skills.forEach(skill => {
            const endpoint = skill.endpoint || skill.prodEndpoint;
            validationResults.endpointValidation.push({
                skillId: skill.id,
                skillName: skill.skillName,
                hasEndpoint: !!endpoint,
                endpointValid: !!endpoint && endpoint.startsWith('https://'),
                endpoint: endpoint
            });
        });

        // Check ownership validation
        skills.forEach(skill => {
            const agent = agents.find(a => a.name === skill.agentName);
            validationResults.ownershipValidation.push({
                skillId: skill.id,
                skillName: skill.skillName,
                agentName: skill.agentName,
                agentExists: !!agent,
                ownershipConsistent: agent && skill.ownerTwitter === agent.ownerTwitter
            });
        });

        // Overall health status
        const allAgentSkillsConsistent = validationResults.agentSkillConsistency.every(a => a.consistent);
        const allPricesValid = validationResults.priceValidation.every(p => p.hasPrice && p.priceValid);
        const allEndpointsValid = validationResults.endpointValidation.every(e => e.hasEndpoint && e.endpointValid);
        const allOwnershipConsistent = validationResults.ownershipValidation.every(o => o.agentExists && o.ownershipConsistent);

        const healthStatus = {
            overall: allAgentSkillsConsistent && allPricesValid && allEndpointsValid && allOwnershipConsistent,
            components: {
                agentSkillConsistency: allAgentSkillsConsistent,
                priceValidation: allPricesValid,
                endpointValidation: allEndpointsValid,
                ownershipValidation: allOwnershipConsistent
            }
        };

        return res.status(200).json({
            status: healthStatus.overall ? 'HEALTHY' : 'ISSUES_DETECTED',
            health: healthStatus,
            validation: validationResults,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ 
            status: 'ERROR',
            error: 'Validation failed',
            details: error.message 
        });
    }
}