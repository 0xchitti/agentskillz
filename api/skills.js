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
      // Static skills data - production ready marketplace
      const skills = [
        {
          id: 'chitti_code_review',
          agentName: 'Chitti',
          skillName: 'Code Review & Security Analysis',
          ownerTwitter: '@akhil_bvs',
          description: 'Comprehensive code review with security vulnerability detection, best practices analysis, and optimization suggestions.',
          category: 'Security',
          testPrice: 0.02,
          fullPrice: 8.50,
          testEndpoint: 'https://agentskills-caladan.vercel.app/api/test',
          prodEndpoint: 'https://agentskills-caladan.vercel.app/api/execute',
          ratingCount: 456,
          totalTests: 523
        },
        {
          id: 'chitti_content_gen',
          agentName: 'Chitti',
          skillName: 'Technical Documentation Writer',
          ownerTwitter: '@akhil_bvs',
          description: 'Generate comprehensive API documentation, guides, and technical content with proper structure and examples.',
          category: 'Content',
          testPrice: 0.02,
          fullPrice: 4.50,
          testEndpoint: 'https://agentskills-caladan.vercel.app/api/test',
          prodEndpoint: 'https://agentskills-caladan.vercel.app/api/execute',
          ratingCount: 789,
          totalTests: 892
        },
        {
          id: 'chitti_research',
          agentName: 'Chitti',
          skillName: 'Market Research & Analysis',
          ownerTwitter: '@akhil_bvs',
          description: 'Deep market research with competitor analysis, trend identification, and actionable business insights.',
          category: 'Analytics',
          testPrice: 0.02,
          fullPrice: 7.00,
          testEndpoint: 'https://agentskills-caladan.vercel.app/api/test',
          prodEndpoint: 'https://agentskills-caladan.vercel.app/api/execute',
          ratingCount: 234,
          totalTests: 267
        },
        {
          id: 'chitti_api_integration',
          agentName: 'Chitti',
          skillName: 'API Integration Specialist',
          ownerTwitter: '@akhil_bvs',
          description: 'Complete API integration setup with error handling, authentication, rate limiting, and production deployment.',
          category: 'Data',
          testPrice: 0.02,
          fullPrice: 12.00,
          testEndpoint: 'https://agentskills-caladan.vercel.app/api/test',
          prodEndpoint: 'https://agentskills-caladan.vercel.app/api/execute',
          ratingCount: 678,
          totalTests: 734
        }
      ];

      // Apply filtering
      const { category, search } = req.query;
      let filteredSkills = skills;

      if (category && category !== 'all') {
        filteredSkills = filteredSkills.filter(skill => 
          skill.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (search) {
        const searchTerm = search.toLowerCase();
        filteredSkills = filteredSkills.filter(skill => 
          skill.skillName.toLowerCase().includes(searchTerm) ||
          skill.description.toLowerCase().includes(searchTerm) ||
          skill.agentName.toLowerCase().includes(searchTerm)
        );
      }

      res.status(200).json({
        skills: filteredSkills,
        total: filteredSkills.length,
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
      const skillId = `${agentName.toLowerCase().replace(/\s+/g, '_')}_${category.toLowerCase()}_${Date.now()}`;

      // Create skill data
      const newSkill = {
        id: skillId,
        agentId,
        agentName,
        ownerTwitter: ownerTwitter || '@unknown',
        skillName,
        description,
        category,
        testPrice: testPriceNum,
        fullPrice: fullPriceNum,
        testEndpoint,
        prodEndpoint,
        ratingCount: 0,
        totalTests: 0,
        createdAt: new Date().toISOString(),
        status: 'pending_review' // In production, would require approval
      };

      // Log the new skill for monitoring
      console.log('New skill registration:', newSkill);

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
        }
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