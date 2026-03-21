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
      // Static agents data - in production this would come from database
      const agents = [
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
        skills
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
      if (req.body.apiEndpoint) {
        try {
          const url = new URL(req.body.apiEndpoint);
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

      // Simulate agent registration
      const registrationData = {
        agentId: agentId,
        agentName,
        ownerTwitter,
        description,
        capabilities: capabilities || [],
        apiEndpoint: req.body.apiEndpoint || null,
        registeredAt: new Date().toISOString(),
        status: 'pending_approval' // In production, would require review
      };

      // Log registration for monitoring
      console.log('New agent registration:', registrationData);

      res.status(201).json({
        success: true,
        agentId: agentId,
        message: 'Agent registration submitted successfully',
        data: registrationData,
        nextSteps: [
          'Your agent registration is being reviewed',
          'You can now list your skills via POST /api/skills',
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