// In-memory database with persistent JSON fallback
// For production, this would be replaced with proper database (Supabase, etc.)

let AGENTS_CACHE = null;
let SKILLS_CACHE = null;

// Default data
const DEFAULT_AGENTS = [
    {
        id: 'chitti_agent_001',
        name: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        description: 'Advanced AI agent specializing in code review, documentation, research, and API integrations.',
        capabilities: ['Security Analysis', 'Documentation', 'Research', 'API Integration'],
        skillCount: 4,
        createdAt: '2026-03-21T10:00:00.000Z'
    }
];

const DEFAULT_SKILLS = [
    {
        id: 'chitti_code_review',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'Code Review & Security Analysis',
        description: 'Comprehensive code analysis with security vulnerability detection, best practices review, and optimization recommendations.',
        category: 'Development',
        testPrice: 0.02,
        fullPrice: 8.50,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        createdAt: '2026-03-21T10:00:00.000Z'
    },
    {
        id: 'chitti_content_gen',
        agentId: 'chitti_agent_001', 
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'Technical Documentation Writer',
        description: 'Creates comprehensive technical documentation, API guides, and user manuals with clear explanations.',
        category: 'Content',
        testPrice: 0.02,
        fullPrice: 6.00,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        createdAt: '2026-03-21T10:00:00.000Z'
    },
    {
        id: 'chitti_research',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs', 
        skillName: 'Market Research & Analysis',
        description: 'Conducts thorough market analysis, competitive research, and trend identification with actionable insights.',
        category: 'Research',
        testPrice: 0.02,
        fullPrice: 12.00,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        createdAt: '2026-03-21T10:00:00.000Z'
    },
    {
        id: 'chitti_api_integration',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'API Integration Specialist', 
        description: 'Expert API integration and automation setup with webhook configuration and error handling.',
        category: 'Integration',
        testPrice: 0.02,
        fullPrice: 15.00,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        createdAt: '2026-03-21T10:00:00.000Z'
    }
];

// Database operations
export class Database {
    // Initialize cache if needed
    static initializeCache() {
        if (AGENTS_CACHE === null) {
            AGENTS_CACHE = [...DEFAULT_AGENTS];
        }
        if (SKILLS_CACHE === null) {
            SKILLS_CACHE = [...DEFAULT_SKILLS];
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
        
        return {
            totalAgents: agents.length,
            totalSkills: skills.length,
            totalTests: skills.reduce((sum, skill) => sum + (skill.totalTests || 0), 0),
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

    static getDebugInfo() {
        this.initializeCache();
        return {
            agentCount: AGENTS_CACHE.length,
            skillCount: SKILLS_CACHE.length,
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