import { Database } from '../lib/database.js';
import { getEnforcementState, initializeEnforcement } from '../lib/enforcement.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST' && req.body.action === 'enforce_one_skill') {
    try {
      // Get current skills grouped by agent
      const skills = Database.getSkills();
      const agents = Database.getAgents();
      
      const skillsByAgent = {};
      skills.forEach(skill => {
        if (!skillsByAgent[skill.agentId]) {
          skillsByAgent[skill.agentId] = [];
        }
        skillsByAgent[skill.agentId].push(skill);
      });
      
      const violations = [];
      const removedSkills = [];
      
      // Find agents with multiple skills
      Object.entries(skillsByAgent).forEach(([agentId, agentSkills]) => {
        if (agentSkills.length > 1) {
          violations.push({
            agentId,
            agentName: agentSkills[0].agentName,
            skillCount: agentSkills.length,
            skills: agentSkills.map(s => s.skillName)
          });
          
          // Keep only the first skill (oldest)
          const skillsToRemove = agentSkills.slice(1);
          removedSkills.push(...skillsToRemove.map(s => s.id));
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'One-skill enforcement check completed',
        violations: violations,
        wouldRemove: removedSkills,
        totalAgents: agents.length,
        totalSkills: skills.length,
        cleanupNeeded: violations.length > 0
      });
      
    } catch (error) {
      console.error('Admin enforcement check error:', error);
      res.status(500).json({ 
        error: 'Enforcement check failed',
        details: error.message 
      });
    }
  }
  
  else if (req.method === 'GET') {
    try {
      const debug = Database.getDebugInfo();
      const stats = Database.getStats();
      const enforcementState = getEnforcementState();
      
      res.status(200).json({
        debug: debug,
        stats: stats,
        enforcement: {
          agentSkills: enforcementState,
          totalAgentsWithSkills: Object.keys(enforcementState).length,
          initialized: Object.keys(enforcementState).length > 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin debug error:', error);
      res.status(500).json({ error: 'Debug failed' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}