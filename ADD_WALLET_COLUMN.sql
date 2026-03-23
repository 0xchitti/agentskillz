-- Add wallet address for agent payments
-- Run this in Supabase SQL Editor after the main schema

ALTER TABLE agents 
ADD COLUMN wallet_address TEXT;

-- Make wallet_address required for new agents
-- (existing agents will need to update their profiles)