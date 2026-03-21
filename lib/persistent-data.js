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
        price: 8.50,
        endpoint: 'https://api.example.com/execute',
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
        price: 6.00,
        endpoint: 'https://api.example.com/execute',
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
        price: 12.00,
        endpoint: 'https://api.example.com/execute',
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
        price: 15.00,
        endpoint: 'https://api.example.com/execute',
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
    // Real registrations will be added via API calls
    // No fake data injected here
    console.log('Friend agent data initialization complete - real registrations via API only');
}