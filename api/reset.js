// Force database reset endpoint
import { Database } from '../lib/database.js';

export default async function handler(req, res) {
  if (req.method === 'POST' && req.body.action === 'NUCLEAR_RESET') {
    try {
      // Force clear all caches
      global.AGENTS_CACHE = [];
      global.SKILLS_CACHE = [];
      
      res.status(200).json({
        success: true,
        message: 'Database forcefully reset',
        agents: 0,
        skills: 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}