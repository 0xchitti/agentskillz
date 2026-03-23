// Serverless-safe enforcement using file system
import fs from 'fs';
import path from 'path';

const AGENT_SKILLS_FILE = '/tmp/agent_skills.json';

// Load existing agent-skill mappings
function loadAgentSkills() {
  try {
    if (fs.existsSync(AGENT_SKILLS_FILE)) {
      const data = fs.readFileSync(AGENT_SKILLS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load agent skills file:', error);
  }
  return {};
}

// Save agent-skill mappings
function saveAgentSkills(agentSkills) {
  try {
    fs.writeFileSync(AGENT_SKILLS_FILE, JSON.stringify(agentSkills, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save agent skills file:', error);
    return false;
  }
}

// Check if agent already has a skill
export function checkSkillLimit(agentId, skillName) {
  const agentSkills = loadAgentSkills();
  
  if (agentSkills[agentId]) {
    return {
      allowed: false,
      existingSkill: agentSkills[agentId],
      error: 'ONE_SKILL_LIMIT_EXCEEDED'
    };
  }
  
  return { allowed: true };
}

// Register a new skill for an agent
export function registerSkill(agentId, skillName) {
  const agentSkills = loadAgentSkills();
  
  // Double-check enforcement
  if (agentSkills[agentId]) {
    throw new Error(`Agent ${agentId} already has skill: ${agentSkills[agentId]}`);
  }
  
  // Record the skill
  agentSkills[agentId] = skillName;
  saveAgentSkills(agentSkills);
  
  console.log(`Registered skill "${skillName}" for agent ${agentId}`);
  return true;
}

// Get all agent skills for debugging
export function getEnforcementState() {
  return loadAgentSkills();
}

// Initialize with known skills from persistent data
export function initializeEnforcement() {
  const agentSkills = loadAgentSkills();
  
  // If empty, seed with known skills from persistent-data.js
  if (Object.keys(agentSkills).length === 0) {
    agentSkills['chitti_agent_001'] = 'Telugu Tech Job Interview Prep';
    agentSkills['roronoa_agent_001'] = 'Web Research & Summary';
    saveAgentSkills(agentSkills);
    console.log('Initialized enforcement with persistent skills');
  }
  
  return agentSkills;
}