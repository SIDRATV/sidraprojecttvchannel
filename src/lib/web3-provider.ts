import { ethers } from 'ethers';

// Declare window.ethereum for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

// SidraChain Configuration
export const SIDRA_CHAIN_CONFIG = {
  chainId: 97453,
  chainName: 'SidraChain',
  rpcUrl: 'https://node.sidrachain.com',
  symbol: 'SIDRA',
  decimals: 18,
  blockExplorerUrl: 'https://explorer.sidrachain.com',
};

// Initialize Web3 Provider
export const getProvider = () => {
  return new ethers.JsonRpcProvider(SIDRA_CHAIN_CONFIG.rpcUrl);
};

// Get Signer (requires MetaMask or Web3 wallet)
export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
};

// Get Balance (On-Chain)
export const getBalance = async (walletAddress: string): Promise<string> => {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(walletAddress);
    // Convert from Wei to SIDRA (18 decimals)
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw new Error('Failed to fetch balance');
  }
};

// Send Transaction (On-Chain)
export const sendTransaction = async (
  toAddress: string,
  amount: string
): Promise<string> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const signer = await getSigner();
    const signerAddress = await signer.getAddress();

    // Validate recipient address
    if (!ethers.isAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    // Convert amount from SIDRA to Wei
    const amountInWei = ethers.parseEther(amount);

    // Send transaction
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: amountInWei,
    });

    // Wait for transaction confirmation
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return receipt.hash;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

// Get Transaction Details
export const getTransaction = async (txHash: string) => {
  try {
    const provider = getProvider();
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasPrice: ethers.formatEther(tx.gasPrice || '0'),
      gasLimit: tx.gasLimit.toString(),
      blockNumber: tx.blockNumber,
      timestamp: receipt?.blockNumber ? 
        await provider.getBlock(receipt.blockNumber).then(b => b?.timestamp) : 
        null,
      status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

// Connect to MetaMask and Switch Chain
export const connectMetaMask = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Check if we need to switch to SidraChain
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    if (parseInt(chainId, 16) !== SIDRA_CHAIN_CONFIG.chainId) {
      await switchToSidraChain();
    }

    return accounts[0];
  } catch (error) {
    console.error('Error connecting MetaMask:', error);
    throw error;
  }
};

// Switch to SidraChain Network
export const switchToSidraChain = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SIDRA_CHAIN_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If the chain doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${SIDRA_CHAIN_CONFIG.chainId.toString(16)}`,
            chainName: SIDRA_CHAIN_CONFIG.chainName,
            rpcUrls: [SIDRA_CHAIN_CONFIG.rpcUrl],
            nativeCurrency: {
              name: SIDRA_CHAIN_CONFIG.symbol,
              symbol: SIDRA_CHAIN_CONFIG.symbol,
              decimals: SIDRA_CHAIN_CONFIG.decimals,
            },
            blockExplorerUrls: [SIDRA_CHAIN_CONFIG.blockExplorerUrl],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

// Listen for Account Changes
export const onAccountChange = (callback: (accounts: string[]) => void) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// Listen for Chain Changes
export const onChainChange = (callback: (chainId: string) => void) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

// Get Current Account
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Get Current Chain ID
export const getCurrentChainId = async (): Promise<number | null> => {
  try {
    if (!window.ethereum) {
      return null;
    }

    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};
