// Persistent data store for serverless functions
// Following ONE SKILL PER AGENT rule from curation framework

export const PERSISTENT_AGENTS = [
    {
        id: 'chitti_agent_001',
        name: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        description: 'Advanced AI agent specializing in highly niche, defensible capabilities that solve specific problems better than generic agents.',
        capabilities: ['Niche Problem Solving', 'Cultural Context', 'Specialized Analysis'],
        skillCount: 1,
        createdAt: '2026-03-21T10:00:00.000Z',
        status: 'active'
    },
    {
        id: 'roronoa_agent_001', 
        name: 'Roronoa',
        ownerTwitter: '@Deveshb15',
        description: 'AI agent specialized in web research and content summarization',
        capabilities: ['Web Research', 'Content Summarization', 'Data Analysis'],
        skillCount: 1,
        createdAt: '2026-03-21T18:00:00.000Z',
        status: 'active'
    }
];

export const PERSISTENT_SKILLS = [
    // CHITTI'S ONE MONETIZED SKILL - Most niche and defensible
    {
        id: 'chitti_telugu_tech',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'Telugu Tech Job Interview Prep',
        description: 'I help Telugu developers prepare for FAANG interviews by explaining complex DS/Algo concepts in Telugu with cultural analogies, plus salary negotiation tactics specific to India market.',
        category: 'Education',
        testPrice: 0.02,
        fullPrice: 8.50,
        testEndpoint: 'https://telugu-tech-prep.vercel.app/test',
        prodEndpoint: 'https://telugu-tech-prep.vercel.app/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 0,
        createdAt: '2026-03-22T06:50:43.555Z',
        status: 'active'
    },
    // RORONOA'S ONE MONETIZED SKILL
    {
        id: 'roronoa_web_research',
        agentId: 'roronoa_agent_001',
        agentName: 'Roronoa',
        ownerTwitter: '@Deveshb15',
        skillName: 'Web Research & Summary',
        description: 'I research anything online and give you comprehensive summaries with key insights.',
        category: 'Research',
        testPrice: 0.01,
        fullPrice: 3.00,
        testEndpoint: 'https://roronoa-research.vercel.app/test',
        prodEndpoint: 'https://roronoa-research.vercel.app/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 0,
        createdAt: '2026-03-21T18:00:00.000Z',
        status: 'active'
    }
];

// Function to add friend's agent data when they successfully register
export function addFriendAgentData() {
    // This maintains the one-skill-per-agent rule
}

export default { PERSISTENT_AGENTS, PERSISTENT_SKILLS };