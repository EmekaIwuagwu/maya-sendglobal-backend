import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/error-codes';
import { BlockchainTransaction } from '../types';

// USDC ABI (minimal for transfer)
const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

export class BlockchainService {
  private static getChain() {
    return env.DEFAULT_NETWORK === 'mainnet' ? base : baseSepolia;
  }

  private static getRpcUrl() {
    return env.DEFAULT_NETWORK === 'mainnet'
      ? env.BASE_RPC_URL_MAINNET
      : env.BASE_RPC_URL_TESTNET;
  }

  private static getUsdcContract() {
    return env.DEFAULT_NETWORK === 'mainnet'
      ? env.USDC_CONTRACT_MAINNET
      : env.USDC_CONTRACT_TESTNET;
  }

  private static getChainId() {
    return env.DEFAULT_NETWORK === 'mainnet'
      ? env.BASE_CHAIN_ID_MAINNET
      : env.BASE_CHAIN_ID_TESTNET;
  }

  /**
   * Get public client for reading blockchain data
   */
  static getPublicClient() {
    return createPublicClient({
      chain: this.getChain(),
      transport: http(this.getRpcUrl()),
    });
  }

  /**
   * Get USDC balance for an address
   */
  static async getUsdcBalance(address: string): Promise<string> {
    try {
      const client = this.getPublicClient();

      const balance = await client.readContract({
        address: this.getUsdcContract() as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      // USDC has 6 decimals
      return formatUnits(balance as bigint, 6);
    } catch (error) {
      logger.error('Error getting USDC balance:', error);
      throw new AppError('TXN_013', 500);
    }
  }

  /**
   * Build transfer transaction data
   */
  static buildTransferData(recipient: string, amount: string) {
    try {
      const amountInUnits = parseUnits(amount, 6); // USDC has 6 decimals

      return {
        to: this.getUsdcContract() as `0x${string}`,
        recipient: recipient as `0x${string}`,
        amount: amountInUnits,
        chainId: this.getChainId(),
      };
    } catch (error) {
      logger.error('Error building transfer data:', error);
      throw new AppError('TXN_013', 500);
    }
  }

  /**
   * Estimate gas for a transaction
   */
  static async estimateGas(from: string, to: string, amount: string): Promise<bigint> {
    try {
      const client = this.getPublicClient();
      const amountInUnits = parseUnits(amount, 6);

      const gasEstimate = await client.estimateContractGas({
        address: this.getUsdcContract() as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amountInUnits],
        account: from as `0x${string}`,
      });

      return gasEstimate;
    } catch (error) {
      logger.error('Error estimating gas:', error);
      throw new AppError('TXN_013', 500);
    }
  }

  /**
   * Get transaction by hash
   */
  static async getTransaction(hash: string): Promise<BlockchainTransaction | null> {
    try {
      const client = this.getPublicClient();

      const tx = await client.getTransaction({
        hash: hash as `0x${string}`,
      });

      if (!tx) return null;

      const receipt = await client.getTransactionReceipt({
        hash: hash as `0x${string}`,
      });

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: formatUnits(tx.value, 6),
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: tx.gasPrice?.toString(),
        blockNumber: Number(tx.blockNumber),
        status: receipt?.status === 'success' ? 'confirmed' : 'failed',
      };
    } catch (error) {
      logger.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Monitor transaction status
   */
  static async waitForTransaction(
    hash: string,
    confirmations: number = 1
  ): Promise<'confirmed' | 'failed'> {
    try {
      const client = this.getPublicClient();

      const receipt = await client.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        confirmations,
      });

      return receipt.status === 'success' ? 'confirmed' : 'failed';
    } catch (error) {
      logger.error('Error waiting for transaction:', error);
      return 'failed';
    }
  }

  /**
   * Get current block number
   */
  static async getBlockNumber(): Promise<number> {
    try {
      const client = this.getPublicClient();
      const blockNumber = await client.getBlockNumber();
      return Number(blockNumber);
    } catch (error) {
      logger.error('Error getting block number:', error);
      throw new AppError('TXN_013', 500);
    }
  }

  /**
   * Validate wallet address
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export default BlockchainService;
