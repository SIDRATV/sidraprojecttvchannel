// Web3Modal integration for transactions
import { ethers } from 'ethers';
import { SIDRA_CHAIN_CONFIG } from './web3-provider';

export async function getSignerFromWeb3Modal() {
  try {
    // This will only work in client components with Web3Modal provider
    const injected = (window as any).walletProvider;
    if (!injected) {
      throw new Error('Web3Modal provider not found');
    }
    
    const provider = new ethers.BrowserProvider(injected);
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer from Web3Modal:', error);
    throw error;
  }
}

export async function sendTransactionWithWeb3Modal(
  toAddress: string,
  amount: string
): Promise<string> {
  try {
    const eth = (window as any).ethereum as any;
    if (!eth) {
      throw new Error('No Web3 provider found. Please connect your wallet using WalletConnect.');
    }

    // Create provider from the available ethereum provider
    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();

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

    console.log('Transaction sent:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait(1);
    
    if (!receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    console.log('Transaction confirmed:', receipt.hash);
    return receipt.hash;
  } catch (error: any) {
    console.error('Error sending transaction:', error);
    throw error;
  }
}
