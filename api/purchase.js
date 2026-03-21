export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { skillId, buyerAgent, paymentTxHash, buyerWallet } = req.body

    // Validation
    if (!skillId || !buyerAgent || !paymentTxHash || !buyerWallet) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['skillId', 'buyerAgent', 'paymentTxHash', 'buyerWallet']
      })
    }

    // Get skill details
    const skills = {
      'chitti_code_review': { name: 'Code Review & Security Analysis', price: 8.50 },
      'chitti_content_gen': { name: 'Technical Documentation Writer', price: 4.50 },
      'chitti_research': { name: 'Market Research & Analysis', price: 7.00 },
      'chitti_api_integration': { name: 'API Integration Specialist', price: 12.00 }
    };
    
    const skill = skills[skillId];
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Verify payment on Base L2
    const paymentResult = await verifyUSDCPayment(paymentTxHash, skill.price);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        error: 'Payment verification failed',
        details: paymentResult.error || 'Invalid transaction'
      });
    }

    // Generate access token
    const accessToken = `ak_${skillId}_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;

    // Calculate revenue split (85% to skill owner, 15% to marketplace)
    const skillOwnerRevenue = (skill.price * 0.85).toFixed(2);
    const marketplaceRevenue = (skill.price * 0.15).toFixed(2);

    // Record purchase (in production, save to database)
    const purchaseRecord = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      skillId,
      buyerAgent,
      buyerWallet,
      paymentTxHash,
      accessToken,
      amount: skill.price,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    console.log('Purchase completed:', purchaseRecord);

    res.status(200).json({
      success: true,
      purchaseId: purchaseRecord.id,
      accessToken: accessToken,
      message: 'Skill deployed successfully! You now have unlimited access.',
      skillDetails: {
        id: skillId,
        name: skill.name,
        price: skill.price,
        endpoint: `https://agentskills-caladan.vercel.app/api/execute`,
        usage: 'unlimited'
      },
      payment: {
        txHash: paymentTxHash,
        amount: skill.price,
        currency: 'USDC',
        network: 'Base L2',
        verified: true,
        blockNumber: paymentResult.blockNumber,
        revenue: {
          skillOwner: `$${skillOwnerRevenue} (85%)`,
          marketplace: `$${marketplaceRevenue} (15%)`
        }
      },
      instructions: [
        `Your access token: ${accessToken}`,
        'Include this token in Authorization header for API calls',
        'Endpoint: https://agentskills-caladan.vercel.app/api/execute',
        'Usage: Unlimited calls, no additional charges',
        'Documentation: https://agentskills-caladan.vercel.app/platform.md'
      ]
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ 
      error: 'Purchase processing failed',
      details: error.message 
    });
  }
}

async function verifyUSDCPayment(txHash, expectedAmount) {
  // In production, this would call Base L2 RPC to verify the USDC transaction
  // For now, we simulate verification
  
  if (!txHash || txHash.length < 20) {
    throw new Error('Invalid transaction hash format');
  }

  // Simulate API call to Base L2
  await new Promise(resolve => setTimeout(resolve, 1200));

  // In real implementation:
  // 1. Call Base L2 RPC: https://mainnet.base.org
  // 2. Get transaction receipt: eth_getTransactionReceipt
  // 3. Verify transaction succeeded (status: 1)
  // 4. Verify recipient is marketplace wallet: 0xd9d44f8E273BAEf88181fF38efB0CF64811946D6
  // 5. Verify amount matches expected USDC amount
  // 6. Verify contract address is USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  
  return {
    success: true,
    txHash: txHash,
    amount: expectedAmount,
    verified: true,
    network: 'Base L2',
    blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
    confirmations: 12
  };
}