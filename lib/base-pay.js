// Base Pay integration for AgentSkillz - Manual implementation
// Based on Base Skills patterns without requiring @base-org packages

class BasePay {
  constructor() {
    this.baseChainId = 8453; // Base mainnet
    this.usdcContract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    this.marketplaceWallet = '0xFC2676f1a5Ed396992782d3f0ddb8c340646022c';
  }

  // Create payment request for Base Pay style
  createPaymentRequest({ amount, description, skillId, agentName }) {
    return {
      to: this.marketplaceWallet,
      value: '0', // No ETH, using USDC
      data: this.encodeUSDCTransfer(this.marketplaceWallet, amount),
      chainId: this.baseChainId,
      metadata: {
        description,
        skillId,
        agentName,
        amount: `${amount} USDC`,
        marketplace: 'AgentSkillz'
      }
    };
  }

  // Encode USDC transfer transaction
  encodeUSDCTransfer(to, amountUSDC) {
    // ERC-20 transfer(address,uint256) = 0xa9059cbb
    const amount = BigInt(Math.floor(amountUSDC * 1e6)); // USDC has 6 decimals
    const toAddress = to.slice(2).padStart(64, '0');
    const amountHex = amount.toString(16).padStart(64, '0');
    return `0xa9059cbb${toAddress}${amountHex}`;
  }

  // Generate payment link (similar to Base Pay)
  generatePaymentLink({ amount, description, skillId }) {
    const baseUrl = 'https://agentskillz.xyz';
    const params = new URLSearchParams({
      action: 'pay',
      amount: amount.toString(),
      currency: 'USDC',
      description,
      skillId,
      to: this.marketplaceWallet
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Verify Base payment (following Base Skills security patterns)
  async verifyPayment(transactionHash, expectedAmount, expectedSkillId) {
    try {
      // Use Base RPC to get transaction details
      const response = await fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [transactionHash],
          id: 1
        })
      });

      const { result: tx } = await response.json();
      
      if (!tx) throw new Error('Transaction not found');

      // Verify transaction details
      const verifications = {
        toCorrect: tx.to.toLowerCase() === this.usdcContract.toLowerCase(),
        fromValid: tx.from && tx.from.length === 42,
        amountCorrect: this.verifyUSDCAmount(tx.input, expectedAmount),
        chainCorrect: parseInt(tx.chainId, 16) === this.baseChainId,
        confirmed: tx.blockNumber !== null
      };

      console.log('Payment verification:', verifications);
      
      return Object.values(verifications).every(v => v === true);
      
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  // Verify USDC transfer amount from transaction data
  verifyUSDCAmount(txData, expectedAmount) {
    if (!txData || txData.length < 138) return false; // Basic length check
    
    try {
      // Extract amount from transfer data (last 64 chars)
      const amountHex = txData.slice(-64);
      const actualAmount = parseInt(amountHex, 16) / 1e6; // Convert from wei to USDC
      
      return Math.abs(actualAmount - expectedAmount) < 0.01; // Allow small rounding
    } catch {
      return false;
    }
  }

  // Create Base-style payment button HTML
  createPaymentButton({ amount, description, skillId, agentName }) {
    const paymentData = this.createPaymentRequest({ amount, description, skillId, agentName });
    
    return `
      <button 
        class="base-pay-button" 
        onclick="initiateBasePay('${skillId}', ${amount}, '${agentName}')"
        style="
          background: #0052FF;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        "
      >
        <span>💰</span>
        Pay $${amount} USDC
      </button>
    `;
  }
}

// Initialize global Base Pay instance
if (typeof window !== 'undefined') {
  window.basePay = new BasePay();
  
  // Global function for payment initiation
  window.initiateBasePay = async (skillId, amount, agentName) => {
    try {
      // Request wallet connection
      if (!window.ethereum) {
        alert('Please install a Web3 wallet (MetaMask, Coinbase, etc.)');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const userAddress = accounts[0];

      // Switch to Base network if needed
      await window.basePay.switchToBase();

      // Create USDC transfer transaction
      const paymentTx = window.basePay.createPaymentRequest({
        amount,
        description: `Purchase skill from ${agentName}`,
        skillId,
        agentName
      });

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: window.basePay.usdcContract,
          data: paymentTx.data,
          value: '0x0'
        }]
      });

      console.log('Payment transaction sent:', txHash);
      
      // Process purchase
      await window.processPurchase(skillId, agentName, txHash);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error.message}`);
    }
  };
}

// Add network switching capability
BasePay.prototype.switchToBase = async function() {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }], // Base mainnet
    });
  } catch (switchError) {
    // Network doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x2105',
          chainName: 'Base',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org']
        }]
      });
    }
  }
};

export default BasePay;