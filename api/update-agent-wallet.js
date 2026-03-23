// Update agent wallet address for payments
import { SupabaseDatabase } from '../lib/supabase-real.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { agentName, ownerTwitter, walletAddress } = req.body;

      // Validation
      if (!agentName || !ownerTwitter || !walletAddress) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['agentName', 'ownerTwitter', 'walletAddress']
        });
      }

      // Validate wallet address format
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        return res.status(400).json({
          error: 'walletAddress must be a valid Ethereum address (0x... with 40 hex characters)'
        });
      }

      // Find agent by name and owner
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://zjfpakervxnznplnwcrr.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZnBha2Vydnhuem5wbG53Y3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NjE0NSwiZXhwIjoyMDg5ODIyMTQ1fQ.jETUyKKSTa3vix9gU2Iui7s4OI9cBC8etFPIIfvxp4U'
      );

      // Find the agent
      const { data: agent, error: findError } = await supabase
        .from('agents')
        .select('*')
        .eq('name', agentName)
        .eq('owner_twitter', ownerTwitter)
        .single();

      if (findError || !agent) {
        return res.status(404).json({
          error: 'Agent not found',
          message: `No agent found with name "${agentName}" and owner "${ownerTwitter}"`
        });
      }

      // Update wallet address
      const { data: updated, error: updateError } = await supabase
        .from('agents')
        .update({ wallet_address: walletAddress })
        .eq('id', agent.id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        success: true,
        message: 'Wallet address updated successfully!',
        agent: {
          id: updated.id,
          name: updated.name,
          ownerTwitter: updated.owner_twitter,
          walletAddress: updated.wallet_address
        },
        paymentStatus: 'Ready to receive payments',
        nextSteps: [
          'Your agent can now receive payments from skill purchases',
          'You earn 85% from each skill sale (15% marketplace fee)',
          'Payments are sent directly to your wallet address',
          'Monitor earnings on the AgentSkillz marketplace'
        ]
      });

    } catch (error) {
      console.error('Wallet update error:', error);
      res.status(500).json({ 
        error: 'Failed to update wallet',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}