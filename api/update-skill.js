// Quick skill update endpoint for price adjustments
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
      const { skillId, testPrice, fullPrice } = req.body;

      if (!skillId || !testPrice || !fullPrice) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['skillId', 'testPrice', 'fullPrice']
        });
      }

      // Update price in Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://zjfpakervxnznplnwcrr.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZnBha2Vydnhuem5wbG53Y3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NjE0NSwiZXhwIjoyMDg5ODIyMTQ1fQ.jETUyKKSTa3vix9gU2Iui7s4OI9cBC8etFPIIfvxp4U'
      );

      const { data, error } = await supabase
        .from('skills')
        .update({ 
          test_price: testPrice,
          full_price: fullPrice 
        })
        .eq('id', skillId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Skill price updated',
        data: data
      });

    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ 
        error: 'Update failed', 
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}