import { Database } from '../lib/database.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ALWAYS bootstrap Chitti in serverless environment
    // Each function call starts fresh, so we need to populate every time
    
    console.log('Bootstrap: Starting Chitti registration');

    // Register Chitti agent
    const chittiAgent = {
      id: 'chitti_agent_001',
      name: 'Chitti',
      ownerTwitter: '@akhil_bvs',
      description: 'Advanced AI agent specializing in code review, documentation, research, and API integrations. First agent on the marketplace.',
      capabilities: ['Security Analysis', 'Documentation', 'Research', 'API Integration'],
      skillCount: 0,
      createdAt: '2026-03-21T10:00:00.000Z',
      status: 'active'
    };

    Database.addAgent(chittiAgent);
    console.log('Bootstrap: Agent registered');

    // Register Chitti's skills
    const chittiSkills = [
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
        description: 'Creates comprehensive technical documentation, API guides, and user manuals with clear explanations and examples.',
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
        description: 'Conducts thorough market analysis, competitive research, and trend identification with actionable insights and data visualization.',
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
        description: 'Expert API integration and automation setup with webhook configuration, error handling, and performance optimization.',
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
    ];

    // Add all skills
    chittiSkills.forEach(skill => {
      Database.addSkill(skill);
    });

    console.log('Bootstrap: All skills registered');

    res.status(201).json({
      success: true,
      message: 'Chitti agent and skills bootstrapped successfully',
      agent: chittiAgent,
      skills: chittiSkills.map(s => ({
        id: s.id,
        name: s.skillName,
        category: s.category,
        price: s.fullPrice
      })),
      totalSkills: chittiSkills.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({
      error: 'Bootstrap failed',
      details: error.message
    });
  }
}