// Real Supabase integration for AgentSkillz
import { createClient } from '@supabase/supabase-js'

// Using dedicated AgentSkillz project: zjfpakervxnznplnwcrr  
const supabaseUrl = 'https://zjfpakervxnznplnwcrr.supabase.co'

// Real API keys for AgentSkillz project
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZnBha2Vydnhuem5wbG53Y3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDYxNDUsImV4cCI6MjA4OTgyMjE0NX0.DFVmsAhBK0fB1v2zpXoeTOL9ff0gQUsHRyUPN9ZJUaE'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZnBha2Vydnhuem5wbG53Y3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NjE0NSwiZXhwIjoyMDg5ODIyMTQ1fQ.jETUyKKSTa3vix9gU2Iui7s4OI9cBC8etFPIIfvxp4U'

const supabaseKey = SERVICE_KEY // Use service key for server-side operations

let supabase = null

try {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log('Connected to Supabase project:', supabaseUrl)
} catch (error) {
  console.warn('Supabase connection failed:', error.message)
}

export class SupabaseDatabase {
  // Test connection
  static async testConnection() {
    if (!supabase) return { success: false, error: 'No Supabase client' }
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('count', { count: 'exact', head: true })
      
      if (error) throw error
      return { success: true, count: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Create tables if they don't exist
  static async createTables() {
    if (!supabase) return { success: false, error: 'No Supabase client' }

    const schema = `
      -- Agents table
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_twitter TEXT NOT NULL,
        description TEXT NOT NULL,
        capabilities TEXT[] DEFAULT '{}',
        api_endpoint TEXT,
        skill_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        status TEXT DEFAULT 'active'
      );

      -- Skills table  
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        agent_name TEXT NOT NULL,
        owner_twitter TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        test_price DECIMAL(10,3) NOT NULL,
        full_price DECIMAL(10,2) NOT NULL,
        test_endpoint TEXT NOT NULL,
        prod_endpoint TEXT NOT NULL,
        rating_count INTEGER DEFAULT 0,
        total_tests INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        status TEXT DEFAULT 'active'
      );

      -- One skill per agent constraint
      CREATE UNIQUE INDEX IF NOT EXISTS idx_one_skill_per_agent ON skills(agent_id);
    `

    try {
      const { data, error } = await supabase.rpc('exec', { sql: schema })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Agents
  static async getAgents() {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.warn('Error getting agents:', error)
      return []
    }
    return data || []
  }

  static async addAgent(agent) {
    if (!supabase) throw new Error('No Supabase connection')
    
    const { data, error } = await supabase
      .from('agents')
      .insert([{
        id: agent.id,
        name: agent.name,
        owner_twitter: agent.ownerTwitter,
        description: agent.description,
        capabilities: agent.capabilities || [],
        api_endpoint: agent.apiEndpoint || null,
        skill_count: agent.skillCount || 0,
        status: agent.status || 'active'
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async findAgent(agentId) {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Error finding agent:', error)
      return null
    }
    return data
  }

  // Skills
  static async getSkills() {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.warn('Error getting skills:', error)
      return []
    }
    return data || []
  }

  static async addSkill(skill) {
    if (!supabase) throw new Error('No Supabase connection')
    
    // Check if agent already has a skill (one-skill enforcement)
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('id, skill_name')
      .eq('agent_id', skill.agentId)
    
    if (existingSkills && existingSkills.length > 0) {
      throw new Error(`Agent ${skill.agentId} already has a skill: ${existingSkills[0].skill_name}`)
    }

    const { data, error } = await supabase
      .from('skills')
      .insert([{
        id: skill.id,
        agent_id: skill.agentId,
        agent_name: skill.agentName,
        owner_twitter: skill.ownerTwitter,
        skill_name: skill.skillName,
        description: skill.description,
        category: skill.category,
        test_price: skill.testPrice,
        full_price: skill.fullPrice,
        test_endpoint: skill.testEndpoint,
        prod_endpoint: skill.prodEndpoint,
        rating_count: skill.ratingCount || 0,
        total_tests: skill.totalTests || 0,
        rating: skill.rating || 0,
        status: skill.status || 'active'
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Get single skill
  static async getSkill(skillId) {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Error finding skill:', error)
      return null
    }
    return data
  }

  // Update skill
  static async updateSkill(skillId, updates) {
    if (!supabase) throw new Error('No Supabase connection')
    
    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', skillId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Add purchase (placeholder - would need purchases table)
  static async addPurchase(purchase) {
    console.log('Purchase recorded:', purchase)
    // TODO: Add purchases table and implement this
    return purchase
  }

  // Stats
  static async getStats() {
    if (!supabase) return {
      totalAgents: 0,
      totalSkills: 0,
      totalTests: 0,
      totalPurchases: 0,
      totalMoney: 0,
      averageRating: 0
    }

    const [agentsResult, skillsResult] = await Promise.all([
      supabase.from('agents').select('id', { count: 'exact', head: true }),
      supabase.from('skills').select('id', { count: 'exact', head: true })
    ])

    return {
      totalAgents: agentsResult.count || 0,
      totalSkills: skillsResult.count || 0,
      totalTests: 0, // TODO: implement when we have purchases table
      totalPurchases: 0,
      totalMoney: 0,
      averageRating: 0
    }
  }
}

export default SupabaseDatabase