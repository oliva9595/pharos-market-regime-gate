import { CONFIG } from './config.js';
import { stateStore } from './state.js';

export const walletHandler = {
  provider: null,
  signer: null,

  async checkConnection() {
    if (typeof window.ethereum === 'undefined') {
      console.warn('MetaMask not detected.');
      return;
    }
    
    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        await this.handleAccountsChanged(accounts);
      }
    } catch (err) {
      console.error('Wallet connection check failed:', err);
    }
  },

  async connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install it to use Web3 mode.');
      return;
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_requestAccounts', []);
      await this.handleAccountsChanged(accounts);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  },

  async handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      stateStore.updateState({
        wallet: { connected: false, address: null, balance: '0', chainId: null }
      });
      return;
    }

    const address = accounts[0];
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    let balanceFormatted = '0';
    try {
      const balanceVal = await this.provider.getBalance(address);
      balanceFormatted = ethers.formatEther(balanceVal);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }

    stateStore.updateState({
      wallet: {
        connected: true,
        address,
        balance: parseFloat(balanceFormatted).toFixed(4),
        chainId
      }
    });

    this.signer = await this.provider.getSigner();
  },

  setupListeners() {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('accountsChanged', (accounts) => {
      this.handleAccountsChanged(accounts);
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  },

  async queryOnChainRegime() {
    // If provider is initialized and we are in web3 mode, query the gate contract
    if (!this.provider) return null;
    try {
      const gateAddress = CONFIG.CONTRACTS.MarketRegimeGate;
      const abi = ['function currentRegime() view returns (uint8)'];
      const contract = new ethers.Contract(gateAddress, abi, this.provider);
      const regimeVal = await contract.currentRegime();
      const regimes = ['NORMAL', 'VOLATILE', 'PANIC'];
      return regimes[Number(regimeVal)] || 'NORMAL';
    } catch (err) {
      console.error('Failed to query on-chain market regime:', err);
      return null;
    }
  }
};
