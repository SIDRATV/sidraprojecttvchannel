import { ethers } from 'ethers';

// EIP-1193 Provider Interface
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isConnected?: boolean;
}

// Extend global window to include ethereum
declare const window: Window & { ethereum?: EthereumProvider };

// SidraChain Configuration
export const SIDRA_CHAIN_CONFIG = {
  chainId: 97453,
  chainName: 'Sidra Chain',
  rpcUrl: 'https://node.sidrachain.com',
  symbol: 'SIDRA',
  decimals: 18,
  blockExplorerUrl: 'https://ledger.sidrachain.com',
};

// Initialize Web3 Provider
export const getProvider = () => {
  return new ethers.JsonRpcProvider(SIDRA_CHAIN_CONFIG.rpcUrl);
};

// Get Signer (requires MetaMask or Web3 wallet)
export const getSigner = async () => {
  const eth = (window as any).ethereum as EthereumProvider | undefined;
  if (!eth) {
    throw new Error('No Web3 wallet provider found. Please connect your wallet.');
  }

  try {
    const provider = new ethers.BrowserProvider(eth as unknown as ethers.Eip1193Provider);
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    throw new Error('Failed to get signer. Make sure your wallet is connected.');
  }
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

// Send Transaction (On-Chain) - Updated to accept signer directly
export const sendTransaction = async (
  toAddress: string,
  amount: string,
  signer?: any
): Promise<string> => {
  try {
    // If signer is not provided, try to get it from window.ethereum (fallback)
    let signerToUse = signer;
    
    if (!signerToUse) {
      const eth = (window as any).ethereum as EthereumProvider | undefined;
      
      if (!eth) {
        throw new Error('Please connect your wallet through WalletConnect or MetaMask');
      }

      const provider = new ethers.BrowserProvider(eth as unknown as ethers.Eip1193Provider);
      signerToUse = await provider.getSigner();
    }

    const signerAddress = await signerToUse.getAddress();

    // Validate recipient address
    if (!ethers.isAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    // Convert amount from SIDRA to Wei
    const amountInWei = ethers.parseEther(amount);

    console.log('Sending transaction:', { from: signerAddress, to: toAddress, amount: amount });

    // Send transaction
    const tx = await signerToUse.sendTransaction({
      to: toAddress,
      value: amountInWei,
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    console.log('Transaction confirmed:', receipt.hash);
    return receipt!.hash;
  } catch (error: any) {
    console.error('Error sending transaction:', error);
    throw new Error(error.message || 'Failed to send transaction');
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
    const eth = (window as any).ethereum as EthereumProvider | undefined;
    if (!eth) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = (await eth.request({
      method: 'eth_requestAccounts',
    })) as string[];

    // Check if we need to switch to SidraChain
    const chainId = (await eth.request({
      method: 'eth_chainId',
    })) as string;

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
    const eth = (window as any).ethereum as EthereumProvider | undefined;
    if (!eth) throw new Error('No Ethereum provider');
    
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SIDRA_CHAIN_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If the chain doesn't exist, add it
    if (switchError.code === 4902) {
      const eth = (window as any).ethereum as EthereumProvider;
      await eth.request({
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
  const eth = (window as any).ethereum as EthereumProvider | undefined;
  if (eth) {
    eth.on('accountsChanged', (...args: unknown[]) => callback(args[0] as string[]));
  }
};

// Listen for Chain Changes
export const onChainChange = (callback: (chainId: string) => void) => {
  const eth = (window as any).ethereum as EthereumProvider | undefined;
  if (eth) {
    eth.on('chainChanged', (...args: unknown[]) => callback(args[0] as string));
  }
};

// Get Current Account
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      return null;
    }

    const eth = (window as any).ethereum as EthereumProvider;
    const accounts = (await eth.request({
      method: 'eth_accounts',
    })) as string[];

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Get Current Chain ID
export const getCurrentChainId = async (): Promise<number | null> => {
  try {
    const eth = (window as any).ethereum as EthereumProvider | undefined;
    if (!eth) {
      return null;
    }

    const chainId = (await eth.request({
      method: 'eth_chainId',
    })) as string;

    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};
