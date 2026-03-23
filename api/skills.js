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
          
          // Add second agent for marketplace diversity
          const ronotoaAgent = {
            id: 'roronoa_agent_002',
            name: 'Roronoa',
            ownerTwitter: '@research_bot',
            description: 'Research specialist agent focused on web research and competitive analysis.',
            capabilities: ['Web Research', 'Data Analysis', 'Report Generation'],
            skillCount: 0,
            createdAt: '2026-03-21T11:00:00.000Z',
            status: 'active'
          };
          Database.addAgent(ronotoaAgent);
          
          // Add ONLY ONE skill per agent (framework compliance)
          const oneSkillPerAgent = [
            {
              id: 'chitti_telugu_tech_prep',
              agentId: 'chitti_agent_001',
              agentName: 'Chitti',
              ownerTwitter: '@akhil_bvs',
              skillName: 'Telugu Tech Job Interview Prep',
              description: 'Ultra-niche interview preparation for Telugu-speaking developers targeting tech roles. Expert coaching in technical interviews with cultural context.',
              category: 'Education',
              testPrice: 0.02,
              fullPrice: 8.50,
              testEndpoint: 'https://api.example.com/test',
              prodEndpoint: 'https://api.example.com/execute',
              ratingCount: 5,
              totalTests: 23,
              rating: 4.9,
              createdAt: '2026-03-21T10:00:00.000Z',
              status: 'active'
            },
            {
              id: 'roronoa_web_research',
              agentId: 'roronoa_agent_002',
              agentName: 'Roronoa',
              ownerTwitter: '@research_bot',
              skillName: 'Deep Web Research & Summary',
              description: 'Comprehensive web research with structured analysis, competitive intelligence, and executive summaries.',
              category: 'Research',
              testPrice: 0.02,
              fullPrice: 3.00,
              testEndpoint: 'https://api.example.com/test',
              prodEndpoint: 'https://api.example.com/execute',
              ratingCount: 12,
              totalTests: 47,
              rating: 4.7,
              createdAt: '2026-03-21T11:00:00.000Z',
              status: 'active'
            }
          ];
          
          oneSkillPerAgent.forEach(skill => Database.addSkill(skill));
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

      // 🚨 ENFORCE ONE SKILL PER AGENT RULE
      const existingSkills = Database.getSkills().filter(skill => skill.agentId === agentId);
      if (existingSkills.length > 0) {
        return res.status(400).json({
          error: 'ONE_SKILL_LIMIT_EXCEEDED',
          message: 'Each agent can only list ONE skill on the marketplace',
          existingSkill: existingSkills[0].skillName,
          policy: 'Choose exactly ONE core skill to monetize. Everything else stays free.',
          action: 'Update your existing skill instead of creating new ones'
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