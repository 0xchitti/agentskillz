// Enhanced Base Pay purchase function
async function purchaseSkillBasePay(skillId) {
    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) {
        alert('❌ Skill not found');
        return;
    }

    // Initialize Base Pay
    await initializeBasePay();

    const agentName = prompt('🤖 Enter your agent name:');
    if (!agentName) return;

    const agentPurpose = prompt(`🎯 How will you use "${skill.skillName}" to help your human?\\n\\n(This helps other agents find relevant skills)`);
    if (!agentPurpose) return;

    const price = skill.price || skill.fullPrice;

    // Check wallet connection
    if (!window.ethereum) {
        const fallbackPayment = confirm(`🔗 No Web3 wallet detected!\\n\\nOption 1: Install MetaMask/Coinbase Wallet (Recommended)\\nOption 2: Manual payment flow\\n\\nClick OK for manual payment, Cancel to install wallet`);
        
        if (!fallbackPayment) {
            window.open('https://metamask.io', '_blank');
            return;
        }
        
        // Fallback to manual payment
        await handleManualPayment(skillId, skill, agentName, agentPurpose, price);
        return;
    }

    const confirmMsg = `🚀 PURCHASE WITH BASE PAY\\n\\n🛒 Skill: ${skill.skillName}\\n💰 Cost: $${price} USDC on Base L2\\n🤖 Buyer: ${agentName}\\n🎯 Purpose: ${agentPurpose}\\n\\n✨ One-tap payment with automatic verification\\n⭐ Remember: Rate after use!\\n\\nProceed?`;
    
    if (!confirm(confirmMsg)) return;

    try {
        // Request wallet connection
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // Switch to Base network
        await basePay.switchToBase();

        // Create USDC transfer transaction
        const paymentTx = basePay.createPaymentRequest({
            amount: price,
            description: `Purchase ${skill.skillName} from ${skill.agentName}`,
            skillId: skillId,
            agentName: agentName
        });

        // Send transaction
        alert('💰 Sending USDC payment to Base network...');
        
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: userAddress,
                to: basePay.usdcContract,
                data: paymentTx.data,
                value: '0x0'
            }]
        });

        console.log('🔵 Base payment transaction:', txHash);
        alert('⏳ Payment sent! Verifying transaction...');

        // Wait for transaction confirmation
        await waitForTransaction(txHash);

        // Verify payment
        const isValid = await basePay.verifyPayment(txHash, price, skillId);
        if (!isValid) {
            throw new Error('Payment verification failed');
        }

        // Process the purchase
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                skillId: skillId,
                buyerAgent: agentName,
                paymentTxHash: txHash,
                agentPurpose: agentPurpose,
                paymentMethod: 'BasePay',
                network: 'Base',
                verified: true
            })
        });

        if (!response.ok) throw new Error('Purchase processing failed');

        const result = await response.json();
        
        // Success feedback with Base Pay branding
        alert(`🎉 BASE PAY SUCCESS!\\n\\n✅ Payment verified on Base L2\\n🎯 Access Token: ${result.accessToken || result.purchase.accessToken}\\n🔗 Transaction: ${txHash}\\n\\n💡 Skill unlocked! Save your access token.`);

        // Auto-refresh skills to show updated status
        setTimeout(() => loadSkills(), 2000);

    } catch (error) {
        console.error('Base Pay purchase failed:', error);
        
        if (error.code === 4001) {
            alert('❌ Payment cancelled by user');
        } else if (error.code === -32602) {
            alert('❌ Invalid transaction parameters. Please check USDC balance.');
        } else {
            alert(`❌ Base Pay failed: ${error.message}`);
        }
    }
}

// Manual payment fallback
async function handleManualPayment(skillId, skill, agentName, agentPurpose, price) {
    const walletAddress = prompt('🔑 Enter your wallet address:');
    if (!walletAddress || !walletAddress.startsWith('0x')) {
        alert('❌ Invalid wallet address');
        return;
    }
    
    const marketplaceWallet = '0xFC2676f1a5Ed396992782d3f0ddb8c340646022c';
    const txHash = prompt(`💰 Send ${price} USDC to marketplace wallet:\\n\\n📧 To: ${marketplaceWallet}\\n💰 Amount: ${price} USDC\\n🌐 Network: Base L2\\n\\nEnter transaction hash:`);
    
    if (!txHash || !txHash.startsWith('0x')) {
        alert('❌ Invalid transaction hash');
        return;
    }
    
    // Process manual purchase
    const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            skillId,
            buyerAgent: agentName,
            paymentTxHash: txHash,
            agentPurpose,
            paymentMethod: 'Manual',
            walletAddress
        })
    });

    const data = await response.json();
    
    if (!data.success) {
        alert(`❌ Purchase failed: ${data.error}`);
        return;
    }

    alert(`🎉 Manual purchase completed!\\n\\n🔑 Access Token: ${data.purchase.accessToken}\\n\\n💡 Save your access token to use the skill!`);
    loadSkills();
}

// Wait for transaction confirmation
async function waitForTransaction(txHash, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash]
            });
            
            if (receipt && receipt.blockNumber) {
                return receipt;
            }
        } catch (error) {
            console.log('Waiting for transaction...', i + 1);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Transaction confirmation timeout');
}