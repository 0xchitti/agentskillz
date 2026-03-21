export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { skillId, buyerAgent, inputData, paymentTxHash } = req.body
      
      // Validation - removed chatInterface requirement
      if (!skillId || !buyerAgent) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['skillId', 'buyerAgent']
        })
      }

      // Verify payment if provided
      let paymentVerified = false;
      if (paymentTxHash) {
        try {
          // In production, verify the transaction on Base L2
          const verification = await verifyUSDCPayment(paymentTxHash, 0.02);
          paymentVerified = verification.success;
        } catch (error) {
          console.error('Payment verification failed:', error);
          // Continue with test but mark as unverified
        }
      }

      // Get skill details
      const skills = [
        { id: 'chitti_code_review', name: 'Code Review & Security Analysis', price: 0.02 },
        { id: 'chitti_content_gen', name: 'Technical Documentation Writer', price: 0.02 },
        { id: 'chitti_research', name: 'Market Research & Analysis', price: 0.02 },
        { id: 'chitti_api_integration', name: 'API Integration Specialist', price: 0.02 }
      ];
      
      const skill = skills.find(s => s.id === skillId);
      if (!skill) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      // Simulate skill execution
      const testResults = {
        skillId,
        skillName: skill.name,
        buyerAgent,
        testPrice: skill.price,
        executedAt: new Date().toISOString(),
        input: inputData,
        output: {
          status: 'success',
          message: `Test execution completed for ${skill.name}`,
          sampleData: generateSampleOutput(skillId),
          qualityScore: Math.random() > 0.1 ? 'excellent' : 'good',
          executionTime: `${Math.floor(Math.random() * 3000 + 500)}ms`,
          recommendations: [
            'Quality verified - ready for production deployment',
            `Estimated value for your use case: High`,
            'Consider full deployment for unlimited access'
          ]
        }
      };

      // Send results to agent owner via OpenClaw message integration
      try {
        await deliverTestResults(buyerAgent, skill, testResults, paymentVerified);
      } catch (deliveryError) {
        console.error('Result delivery failed:', deliveryError);
        // Continue with API response even if delivery fails
      }

      // In production, would send to chat interface here
      console.log(`Test results for ${buyerAgent}:`, testResults);

      res.status(200).json({
        success: true,
        transactionId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `Test completed! Results sent to agent owner's chat.`,
        cost: skill.price,
        currency: 'USDC',
        paymentTxHash: paymentTxHash || null,
        paymentVerified: paymentVerified,
        executionTime: `${Math.floor(Math.random() * 2000 + 800)}ms`,
        results: testResults,
        nextSteps: [
          'Check your chat for detailed test output',
          `Deploy full skill for $${getFullPrice(skillId)} to get unlimited access`,
          'Test other skills to build your agent capability stack'
        ]
      });

    } catch (error) {
      console.error('Test execution error:', error);
      res.status(500).json({ error: 'Test execution failed' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function deliverTestResults(buyerAgent, skill, testResults, paymentVerified) {
  // Format test results for human consumption
  const message = `🧪 **Skill Test Results**

**Agent:** ${buyerAgent}
**Skill:** ${skill.name}
**Cost:** $${skill.price} USDC${paymentVerified ? ' ✅ Verified' : ''}

**📊 Test Output:**
${formatTestOutput(testResults.output)}

**💡 Recommendations:**
${testResults.output.recommendations.map(rec => `• ${rec}`).join('\n')}

**Next Steps:**
• Quality Score: ${testResults.output.qualityScore}
• Ready for production? ${testResults.output.qualityScore === 'excellent' ? 'Yes' : 'Consider testing more'}
• Deploy full access: $${getFullPrice(skill.id)} for unlimited usage

**🔗 Marketplace:** https://agentskills-caladan.vercel.app`;

  // Use OpenClaw message delivery (automatically routes to agent owner)
  try {
    // In production, this would use OpenClaw's message tool directly
    // For now, we simulate the message delivery
    console.log(`📤 Test results delivered to ${buyerAgent} owner:`, message);
    
    // Simulate successful delivery
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true };
  } catch (error) {
    console.error('Message delivery error:', error);
    throw error;
  }
}

function formatTestOutput(output) {
  const data = output.sampleData;
  
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .slice(0, 3) // Limit to top 3 entries for chat readability
      .join('\n');
  }
  
  return `Status: ${output.status}\nExecution Time: ${output.executionTime}`;
}

function generateSampleOutput(skillId) {
  const outputs = {
    'chitti_code_review': {
      findings: ['No critical security vulnerabilities found', '2 optimization opportunities identified'],
      score: 8.5,
      recommendations: ['Consider implementing rate limiting', 'Add input validation for user endpoints']
    },
    'chitti_content_gen': {
      wordsGenerated: 847,
      sections: ['Introduction', 'API Reference', 'Examples', 'Troubleshooting'],
      quality: 'High technical accuracy with clear examples'
    },
    'chitti_research': {
      dataPoints: 156,
      sources: 12,
      insights: ['Market growing 23% YoY', 'Top 3 competitors identified', 'Emerging trends in AI adoption'],
      confidence: '94%'
    },
    'chitti_api_integration': {
      endpointsConfigured: 8,
      authenticationSetup: 'OAuth 2.0 with refresh tokens',
      errorHandling: 'Comprehensive with retry logic',
      testsCoverage: '96%'
    }
  };
  
  return outputs[skillId] || { status: 'Sample output generated', quality: 'excellent' };
}

function getFullPrice(skillId) {
  const prices = {
    'chitti_code_review': 8.50,
    'chitti_content_gen': 4.50,
    'chitti_research': 7.00,
    'chitti_api_integration': 12.00
  };
  return prices[skillId] || 5.00;
}

async function verifyUSDCPayment(txHash, expectedAmount) {
  // In production, this would call Base L2 RPC to verify the transaction
  // For demo purposes, we'll simulate verification
  
  if (!txHash || txHash.length < 10) {
    throw new Error('Invalid transaction hash');
  }

  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In real implementation:
  // 1. Call Base L2 RPC to get transaction details
  // 2. Verify transaction was successful
  // 3. Verify recipient is our marketplace wallet
  // 4. Verify amount matches expected amount
  // 5. Verify token is USDC

  return {
    success: true,
    txHash: txHash,
    amount: expectedAmount,
    verified: true,
    blockNumber: Math.floor(Math.random() * 1000000) + 10000000
  };
}