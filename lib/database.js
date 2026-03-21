// In-memory database with persistent JSON fallback
// For production, this would be replaced with proper database (Supabase, etc.)

import { PERSISTENT_AGENTS, PERSISTENT_SKILLS, addFriendAgentData } from './persistent-data.js';

let AGENTS_CACHE = null;
let SKILLS_CACHE = null;
let RATINGS_CACHE = [];
let PURCHASES_CACHE = [];
let USAGE_CACHE = [];

// Database operations
export class Database {
    // Initialize cache if needed
    static initializeCache() {
        if (AGENTS_CACHE === null) {
            // Add friend's data if they registered
            addFriendAgentData();
            AGENTS_CACHE = [...PERSISTENT_AGENTS];
        }
        if (SKILLS_CACHE === null) {
            SKILLS_CACHE = [...PERSISTENT_SKILLS];
        }
    }

    // Agents operations
    static getAgents() {
        this.initializeCache();
        return [...AGENTS_CACHE]; // Return copy to prevent mutation
    }

    static addAgent(agent) {
        this.initializeCache();
        AGENTS_CACHE.push(agent);
        console.log(`Agent added: ${agent.name} (${agent.id})`);
        return agent;
    }

    static findAgent(agentId) {
        this.initializeCache();
        return AGENTS_CACHE.find(agent => agent.id === agentId);
    }

    // Skills operations
    static getSkills() {
        this.initializeCache();
        return [...SKILLS_CACHE]; // Return copy to prevent mutation
    }

    static addSkill(skill) {
        this.initializeCache();
        SKILLS_CACHE.push(skill);

        // Update agent skill count
        this.updateAgentSkillCount(skill.agentId);

        console.log(`Skill added: ${skill.skillName} (${skill.id})`);
        return skill;
    }

    static findSkill(skillId) {
        this.initializeCache();
        return SKILLS_CACHE.find(skill => skill.id === skillId);
    }

    static getSkillsByAgent(agentId) {
        this.initializeCache();
        return SKILLS_CACHE.filter(skill => skill.agentId === agentId);
    }

    static updateAgentSkillCount(agentId) {
        this.initializeCache();
        const agentIndex = AGENTS_CACHE.findIndex(agent => agent.id === agentId);

        if (agentIndex !== -1) {
            const skillCount = this.getSkillsByAgent(agentId).length;
            AGENTS_CACHE[agentIndex].skillCount = skillCount;
            console.log(`Updated agent ${agentId} skill count: ${skillCount}`);
        }
    }

    // Statistics
    static getStats() {
        this.initializeCache();
        const agents = AGENTS_CACHE;
        const skills = SKILLS_CACHE;
        
        // Calculate total money made from purchases
        const totalMoney = PURCHASES_CACHE.reduce((sum, purchase) => {
            return sum + (purchase.pricePaid || 0);
        }, 0);
        
        return {
            totalAgents: agents.length,
            totalSkills: skills.length,
            totalTests: skills.reduce((sum, skill) => sum + (skill.totalTests || 0), 0),
            totalPurchases: PURCHASES_CACHE.length,
            totalMoney: totalMoney,
            averageRating: skills.length > 0 
                ? skills.reduce((sum, skill) => sum + (skill.rating || 0), 0) / skills.length
                : 0
        };
    }

    // Debug/Admin operations
    static reset() {
        AGENTS_CACHE = [...DEFAULT_AGENTS];
        SKILLS_CACHE = [...DEFAULT_SKILLS];
        console.log('Database reset to defaults');
    }

    // Rating management
    static addRating(rating) {
        RATINGS_CACHE.push(rating);
        return rating;
    }

    static getRatingsForSkill(skillId) {
        return RATINGS_CACHE.filter(rating => rating.skillId === skillId);
    }

    static getAllRatings() {
        return RATINGS_CACHE;
    }

    // Purchase management
    static addPurchase(purchase) {
        PURCHASES_CACHE.push(purchase);
        return purchase;
    }

    static getPurchasesForAgent(agentName) {
        return PURCHASES_CACHE.filter(purchase => purchase.buyerAgent === agentName);
    }

    static getPurchasesForSkill(skillId) {
        return PURCHASES_CACHE.filter(purchase => purchase.skillId === skillId);
    }

    static getAllPurchases() {
        return PURCHASES_CACHE;
    }

    // NEW: Usage tracking methods
    static addUsageRecord(usage) {
        USAGE_CACHE.push(usage);
        return usage;
    }

    static getUsageStats(purchaseId) {
        const usageRecords = USAGE_CACHE.filter(u => u.purchaseId === purchaseId);
        if (usageRecords.length === 0) return { usageCount: 0, daysActive: 0 };

        const usageCount = usageRecords.length;
        const dates = usageRecords.map(u => new Date(u.timestamp));
        const firstUsed = new Date(Math.min(...dates));
        const lastUsed = new Date(Math.max(...dates));
        const daysActive = Math.ceil((lastUsed - firstUsed) / (1000 * 60 * 60 * 24)) + 1;

        const humanAccepted = usageRecords.filter(u => u.humanAccepted).length;
        const correctionNeeded = usageRecords.filter(u => u.correctionNeeded).length;

        return {
            usageCount,
            daysActive,
            humanAcceptanceRate: usageCount > 0 ? humanAccepted / usageCount : 0,
            correctionRate: usageCount > 0 ? correctionNeeded / usageCount : 0,
            firstUsed: firstUsed.toISOString(),
            lastUsed: lastUsed.toISOString()
        };
    }

    static getRecentReviewsByAgent(agentId, hours = 24) {
        const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
        return RATINGS_CACHE.filter(r => 
            r.buyerAgent === agentId && 
            new Date(r.timestamp) > cutoff
        );
    }

    static getReviewByPurchase(purchaseId) {
        return RATINGS_CACHE.find(r => r.purchaseId === purchaseId);
    }

    static findPurchase(purchaseId) {
        return PURCHASES_CACHE.find(p => p.id === purchaseId);
    }

    static getDebugInfo() {
        this.initializeCache();
        return {
            agentCount: AGENTS_CACHE.length,
            skillCount: SKILLS_CACHE.length,
            ratingCount: RATINGS_CACHE.length,
            lastAgentAdded: AGENTS_CACHE[AGENTS_CACHE.length - 1]?.name,
            lastSkillAdded: SKILLS_CACHE[SKILLS_CACHE.length - 1]?.skillName,
            cacheInitialized: {
                agents: AGENTS_CACHE !== null,
                skills: SKILLS_CACHE !== null
            }
        };
    }
}

export default Database;