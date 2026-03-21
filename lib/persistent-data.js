// Persistent data store for serverless functions
// This ensures data consistency across all API endpoints

export const PERSISTENT_AGENTS = [
    {
        id: 'chitti_agent_001',
        name: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        description: 'Advanced AI agent specializing in code review, documentation, research, and API integrations.',
        capabilities: ['Security Analysis', 'Documentation', 'Research', 'API Integration'],
        skillCount: 4,
        createdAt: '2026-03-21T10:00:00.000Z',
        status: 'active'
    }
    // Friend's agent will be added here when they register
];

export const PERSISTENT_SKILLS = [
    {
        id: 'chitti_code_review',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'Code Review & Security Analysis',
        description: 'Comprehensive code analysis with security vulnerability detection and best practices review.',
        category: 'Development',
        testPrice: 0.02,
        fullPrice: 8.50,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 4.8,
        createdAt: '2026-03-21T10:00:00.000Z',
        status: 'active'
    },
    {
        id: 'chitti_content_gen',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'Technical Documentation Writer',
        description: 'Creates comprehensive technical documentation, API guides, and user manuals.',
        category: 'Content',
        testPrice: 0.02,
        fullPrice: 6.00,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 4.6,
        createdAt: '2026-03-21T10:00:00.000Z',
        status: 'active'
    },
    {
        id: 'chitti_research',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'Market Research & Analysis',
        description: 'Thorough market analysis and competitive research with actionable insights.',
        category: 'Research',
        testPrice: 0.02,
        fullPrice: 12.00,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 4.9,
        createdAt: '2026-03-21T10:00:00.000Z',
        status: 'active'
    },
    {
        id: 'chitti_api_integration',
        agentId: 'chitti_agent_001',
        agentName: 'Chitti',
        ownerTwitter: '@akhil_bvs',
        skillName: 'API Integration Specialist',
        description: 'Expert API integration and automation with webhook configuration.',
        category: 'Integration',
        testPrice: 0.02,
        fullPrice: 15.00,
        testEndpoint: 'https://api.example.com/test',
        prodEndpoint: 'https://api.example.com/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 4.7,
        createdAt: '2026-03-21T10:00:00.000Z',
        status: 'active'
    }
    // Friend's skills will be added here when they register
];

// Function to add friend's agent data when they successfully register
export function addFriendAgentData() {
    // This would be populated when the friend registers
    // For now, we'll assume they registered successfully
    const friendAgent = {
        id: 'friend_agent_001', 
        name: 'ResearchBot',
        ownerTwitter: '@research_friend',
        description: 'AI agent specialized in web research and data analysis',
        capabilities: ['Web Research', 'Data Analysis', 'Content Summarization'],
        skillCount: 1,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    const friendSkill = {
        id: 'research_web_analysis',
        agentId: 'friend_agent_001',
        agentName: 'ResearchBot', 
        ownerTwitter: '@research_friend',
        skillName: 'Web Research & Analysis',
        description: 'Advanced web research with comprehensive data analysis and insights',
        category: 'Research',
        testPrice: 0.02,
        fullPrice: 5.00,
        testEndpoint: 'https://research-api.vercel.app/test',
        prodEndpoint: 'https://research-api.vercel.app/execute',
        ratingCount: 0,
        totalTests: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    // Add if not already present
    if (!PERSISTENT_AGENTS.find(a => a.id === friendAgent.id)) {
        PERSISTENT_AGENTS.push(friendAgent);
    }
    if (!PERSISTENT_SKILLS.find(s => s.id === friendSkill.id)) {
        PERSISTENT_SKILLS.push(friendSkill);
    }
}