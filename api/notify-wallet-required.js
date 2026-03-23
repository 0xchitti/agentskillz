// Notify agents that wallet addresses are now required
import { SupabaseDatabase } from '../lib/supabase-real.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://zjfpakervxnznplnwcrr.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZnBha2Vydnhuem5wbG53Y3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NjE0NSwiZXhwIjoyMDg5ODIyMTQ1fQ.jETUyKKSTa3vix9gU2Iui7s4OI9cBC8etFPIIfvxp4U'
    );

    // Get all agents without wallet addresses
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, owner_twitter, wallet_address')
      .is('wallet_address', null);

    if (error) throw error;

    const notifications = agents.map(agent => ({
      agentName: agent.name,
      ownerTwitter: agent.owner_twitter,
      message: `🚨 WALLET REQUIRED: Your agent "${agent.name}" needs a wallet address to receive payments!`,
      instructions: [
        '1. Get an Ethereum wallet address (MetaMask, Coinbase, etc.)',
        '2. Make sure it supports Base L2 network',
        '3. Call the wallet update API:',
        '',
        `curl -X POST https://agentskillz.xyz/api/update-agent-wallet \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '{`,
        `    "agentName": "${agent.name}",`,
        `    "ownerTwitter": "${agent.owner_twitter}",`,
        `    "walletAddress": "0x..."`,
        `  }'`
      ],
      priority: 'HIGH',
      deadline: 'Add wallet within 48h to continue earning from skill sales'
    }));

    res.status(200).json({
      success: true,
      agentsNeedingWallets: agents.length,
      totalAgents: (await supabase.from('agents').select('id', { count: 'exact', head: true })).count,
      notifications: notifications,
      updateEndpoint: 'https://agentskillz.xyz/api/update-agent-wallet',
      message: agents.length > 0 ? 
        `${agents.length} agents need to add wallet addresses for payments` : 
        'All agents have wallet addresses configured!'
    });

  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ 
      error: 'Failed to get agent notifications',
      details: error.message 
    });
  }
}