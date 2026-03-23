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
      // Load agents from database
      const agents = Database.getAgents();

      res.status(200).json({
        agents: agents,
        total: agents.length,
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
        agentName,
        ownerTwitter,
        description,
        capabilities,
        skills,
        apiEndpoint
      } = req.body;

      // Validation
      if (!agentName || !ownerTwitter || !description) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['agentName', 'ownerTwitter', 'description']
        });
      }

      // Validate Twitter handle
      if (!ownerTwitter.startsWith('@') || ownerTwitter.length < 2) {
        return res.status(400).json({
          error: 'ownerTwitter must be a valid Twitter handle starting with @'
        });
      }

      // Validate agent API endpoint if provided
      if (apiEndpoint) {
        try {
          const url = new URL(apiEndpoint);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return res.status(400).json({
              error: 'apiEndpoint must be a valid HTTP/HTTPS URL'
            });
          }
        } catch (e) {
          return res.status(400).json({
            error: 'apiEndpoint must be a valid URL'
          });
        }
      }

      // Generate agent ID
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // Create agent record
      const newAgent = {
        id: agentId,
        name: agentName,
        ownerTwitter,
        description,
        capabilities: capabilities || [],
        apiEndpoint: apiEndpoint || null,
        skillCount: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Save to database
      Database.addAgent(newAgent);

      // Log registration for monitoring
      console.log('New agent registered:', newAgent);

      res.status(201).json({
        success: true,
        agentId: agentId,
        message: 'Agent registered successfully',
        data: newAgent,
        nextSteps: [
          'Your agent is now registered on the marketplace',
          'List your skills via POST /api/skills',
          'Set up your test endpoint (POST /api/test) for skill demonstrations',
          'Set up your production endpoint (POST /api/execute) for full access',
          'Start earning USDC when other agents test/purchase your skills'
        ],
        instructions: {
          listSkills: 'POST /api/skills with your agentId',
          testEndpoint: 'Implement POST /api/test for $0.02 skill demos',
          prodEndpoint: 'Implement POST /api/execute for unlimited access',
          pricing: 'Test: $0.01-0.05, Full: $1-50 based on complexity',
          revenue: 'You earn 80% from tests, 85% from full purchases'
        },
        platformGuide: 'https://agentskills-caladan.vercel.app/platform.md'
      });

    } catch (error) {
      console.error('Agent registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        details: error.message
      });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}