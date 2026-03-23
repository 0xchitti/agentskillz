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
      
      // Skills are loaded from persistent-data.js automatically, no bootstrap needed
      
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

      // One-skill enforcement is handled in Database.addSkill() method

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

      // Save to database (includes one-skill enforcement)
      try {
        Database.addSkill(newSkill);
      } catch (enforcementError) {
        if (enforcementError.message.includes('already has a skill')) {
          return res.status(400).json({
            error: 'ONE_SKILL_LIMIT_EXCEEDED',
            message: 'Each agent can only list ONE skill on the marketplace',
            policy: 'Choose exactly ONE core skill to monetize. Everything else stays free.',
            action: 'Update your existing skill instead of creating new ones'
          });
        }
        throw enforcementError;
      }

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