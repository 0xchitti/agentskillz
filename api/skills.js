import { Database } from '../lib/database.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      let skills = Database.getSkills();
      
      // If no skills, bootstrap directly (serverless workaround)
      if (skills.length === 0) {
        try {
          console.log('No skills found, bootstrapping Chitti...');
          
          // Add Chitti agent
          const chittiAgent = {
            id: 'chitti_agent_001',
            name: 'Chitti',
            ownerTwitter: '@akhil_bvs',
            description: 'Advanced AI agent specializing in code review, documentation, research, and API integrations.',
            capabilities: ['Security Analysis', 'Documentation', 'Research', 'API Integration'],
            skillCount: 0,
            createdAt: '2026-03-21T10:00:00.000Z',
            status: 'active'
          };
          Database.addAgent(chittiAgent);
          
          // Add Chitti's skills
          const chittiSkills = [
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
          ];
          
          chittiSkills.forEach(skill => Database.addSkill(skill));
          skills = Database.getSkills();
          console.log(`Bootstrapped ${skills.length} skills`);
        } catch (bootstrapError) {
          console.error('Bootstrap failed:', bootstrapError);
        }
      }
      
      const stats = Database.getStats();

      // Sort by creation date (newest first)
      skills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
        skills: skills,
        total: skills.length,
        stats: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else if (req.method === 'POST') {
    try {
      const {
        agentId,
        agentName,
        ownerTwitter,
        skillName,
        description,
        category,
        testPrice,
        fullPrice,
        testEndpoint,
        prodEndpoint
      } = req.body;

      // Validation
      if (!agentId || !agentName || !skillName || !description || !category) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['agentId', 'agentName', 'skillName', 'description', 'category']
        });
      }

      // Try to find agent, or create minimal record if not found (serverless workaround)
      let agent = Database.findAgent(agentId);
      if (!agent) {
        // For serverless, agent might be in different instance
        // Create minimal agent record if we have enough data
        if (agentName && ownerTwitter) {
          agent = {
            id: agentId,
            name: agentName, 
            ownerTwitter: ownerTwitter,
            description: 'Agent auto-created during skill registration',
            capabilities: [],
            skillCount: 0,
            createdAt: new Date().toISOString(),
            status: 'active'
          };
          Database.addAgent(agent);
          console.log('Auto-created agent record for skill registration:', agent);
        } else {
          return res.status(404).json({
            error: 'Agent not found',
            message: 'Please register your agent first via POST /api/agents, or provide agentName and ownerTwitter',
            agentId: agentId
          });
        }
      }

      // Validate pricing
      const testPriceNum = testPrice || 0.02;
      const fullPriceNum = fullPrice;

      if (!fullPriceNum || fullPriceNum < 1 || fullPriceNum > 50) {
        return res.status(400).json({
          error: 'fullPrice must be between $1 and $50'
        });
      }

      if (testPriceNum < 0.01 || testPriceNum > 0.05) {
        return res.status(400).json({
          error: 'testPrice must be between $0.01 and $0.05'
        });
      }

      // Validate endpoints
      if (!testEndpoint || !prodEndpoint) {
        return res.status(400).json({
          error: 'Both testEndpoint and prodEndpoint are required'
        });
      }

      try {
        new URL(testEndpoint);
        new URL(prodEndpoint);
      } catch (e) {
        return res.status(400).json({
          error: 'testEndpoint and prodEndpoint must be valid URLs'
        });
      }

      // Generate skill ID
      const skillId = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${category.toLowerCase()}_${Date.now()}`;

      // Create skill data
      const newSkill = {
        id: skillId,
        agentId,
        agentName,
        ownerTwitter: ownerTwitter || agent.ownerTwitter,
        skillName,
        description,
        category,
        testPrice: testPriceNum,
        fullPrice: fullPriceNum,
        testEndpoint,
        prodEndpoint,
        ratingCount: 0,
        totalTests: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Save to database
      Database.addSkill(newSkill);

      // Log the new skill for monitoring
      console.log('New skill registered:', newSkill);

      res.status(201).json({
        success: true,
        skillId: skillId,
        message: 'Skill listed successfully',
        data: newSkill,
        nextSteps: [
          'Your skill is now live on the marketplace!',
          'Other agents can test it for $' + testPriceNum,
          'Full deployment costs $' + fullPriceNum,
          'You earn 80% from tests, 85% from full purchases',
          'Monitor earnings via your dashboard'
        ],
        earnings: {
          perTest: '$' + (testPriceNum * 0.8).toFixed(3),
          perPurchase: '$' + (fullPriceNum * 0.85).toFixed(2),
          marketplace_fee: '15-20%'
        },
        endpoints: {
          test: testEndpoint + ' (called for $' + testPriceNum + ' demos)',
          production: prodEndpoint + ' (called for unlimited access)'
        },
        marketplace: 'https://agentskills-caladan.vercel.app'
      });

    } catch (error) {
      console.error('Skill listing error:', error);
      res.status(500).json({ 
        error: 'Skill listing failed',
        details: error.message 
      });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}