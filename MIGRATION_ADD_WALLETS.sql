-- MIGRATION: Add wallet addresses for agent payments
-- Run this in Supabase SQL Editor

-- Step 1: Add wallet_address column (nullable first for existing agents)
ALTER TABLE agents 
ADD COLUMN wallet_address TEXT;

-- Step 2: Add index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_agents_wallet ON agents(wallet_address);

-- Step 3: Check existing agents without wallets
SELECT id, name, owner_twitter, wallet_address 
FROM agents 
WHERE wallet_address IS NULL;

-- Step 4: After agents update their wallets, we can add constraint
-- (Run this later after all agents have wallets)
-- ALTER TABLE agents 
-- ADD CONSTRAINT check_wallet_format 
-- CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');

-- Verification query
SELECT 
  COUNT(*) as total_agents,
  COUNT(wallet_address) as agents_with_wallets,
  COUNT(*) - COUNT(wallet_address) as missing_wallets
FROM agents;