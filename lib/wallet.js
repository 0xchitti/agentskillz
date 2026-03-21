// Wallet connection and USDC payment handling for Base L2

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const MARKETPLACE_ADDRESS = '0xd9d44f8E273BAEf88181fF38efB0CF64811946D6'; // Our wallet
const BASE_CHAIN_ID = 8453; // Base mainnet

// ERC20 ABI for USDC transfers
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
];

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.userAddress = null;
  }

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to make payments');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.userAddress = accounts[0];

      // Switch to Base network if needed
      await this.switchToBase();

      // Set up provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      return this.userAddress;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async switchToBase() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }]
      });
    } catch (switchError) {
      // Network not added, try to add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
            chainName: 'Base',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  async getUSDCBalance() {
    if (!this.signer) throw new Error('Wallet not connected');

    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer);
    const balance = await usdcContract.balanceOf(this.userAddress);
    const decimals = await usdcContract.decimals();
    
    return ethers.utils.formatUnits(balance, decimals);
  }

  async payUSDC(amountUSD) {
    if (!this.signer) throw new Error('Wallet not connected');

    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer);
    
    // Convert USD amount to USDC units (6 decimals)
    const amountInUnits = ethers.utils.parseUnits(amountUSD.toString(), 6);

    // Execute transfer
    const tx = await usdcContract.transfer(MARKETPLACE_ADDRESS, amountInUnits);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      amount: amountUSD,
      recipient: MARKETPLACE_ADDRESS
    };
  }

  async verifyPayment(txHash, expectedAmount, expectedRecipient) {
    if (!this.provider) throw new Error('Provider not available');

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        throw new Error('Transaction not found');
      }

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Verify the transaction details
      const tx = await this.provider.getTransaction(txHash);
      
      // For ERC20 transfers, we'd need to decode logs properly
      // For now, basic verification
      if (tx.to.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        throw new Error('Payment not made to USDC contract');
      }

      return {
        verified: true,
        txHash: txHash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }
}

// Global wallet instance
let walletManager = null;

// Export functions for use in HTML
window.WalletManager = WalletManager;

window.connectWallet = async function() {
  try {
    walletManager = new WalletManager();
    const address = await walletManager.connectWallet();
    
    // Update UI
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
      connectBtn.textContent = `${address.slice(0,6)}...${address.slice(-4)}`;
      connectBtn.disabled = true;
    }
    
    // Show balance
    const balance = await walletManager.getUSDCBalance();
    console.log(`USDC Balance: ${balance}`);
    
    return address;
  } catch (error) {
    alert(`Wallet connection failed: ${error.message}`);
    throw error;
  }
};

window.payForSkillTest = async function(skillId, amount = 0.02) {
  if (!walletManager) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    // Show loading state
    const loadingMsg = `Processing payment of $${amount} USDC...`;
    console.log(loadingMsg);

    // Execute payment
    const paymentResult = await walletManager.payUSDC(amount);
    
    console.log('Payment successful:', paymentResult);
    
    return {
      success: true,
      txHash: paymentResult.txHash,
      amount: amount,
      message: `Payment of $${amount} USDC completed successfully!`
    };
    
  } catch (error) {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

export { WalletManager };