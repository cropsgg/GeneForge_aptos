import { Aptos, AptosConfig, Network, NetworkToNetworkName } from '@aptos-labs/ts-sdk';
import { CONTRACT_ADDRESS, APTOS_NODE_URL } from './config';
import { toast } from 'sonner';
import { AptosClient } from 'aptos';
import { 
  pollForTransaction, 
  formatTransactionResult, 
  parseAptosError, 
  debugTransaction,
  simulateTransaction,
  debugTransactionWithDetails
} from './aptos-client';

// Default network configuration
const DEFAULT_NETWORK = Network.DEVNET;
const EXPLORER_URL = 'https://explorer.aptoslabs.com/txn';

// Create Aptos config
export const getAptosConfig = (network: Network = DEFAULT_NETWORK) => {
  return new AptosConfig({ network });
};

// AptosConnector class to manage all Aptos blockchain interactions
export class AptosConnector {
  private config: AptosConfig;
  private client: Aptos;
  private contractAddress: string;
  // Also maintain a legacy client for compatibility
  private legacyClient: AptosClient;

  constructor(network: Network = DEFAULT_NETWORK, contractAddress: string = CONTRACT_ADDRESS) {
    this.config = getAptosConfig(network);
    this.client = new Aptos(this.config);
    this.contractAddress = contractAddress;
    // Initialize legacy client
    this.legacyClient = new AptosClient(APTOS_NODE_URL);
  }

  // Get network name
  getNetworkName(): string {
    return NetworkToNetworkName[this.config.network];
  }

  // Change network
  changeNetwork(network: Network): void {
    this.config = getAptosConfig(network);
    this.client = new Aptos(this.config);
  }

  // Get formatted explorer URL
  getExplorerUrl(txHash: string): string {
    return `${EXPLORER_URL}/${txHash}?network=${this.getNetworkName().toLowerCase()}`;
  }

  // Get ledger info to check if connected
  async isConnected(): Promise<boolean> {
    try {
      await this.legacyClient.getLedgerInfo();
      return true;
    } catch (error) {
      console.error('Network connection error:', error);
      return false;
    }
  }

  // Get latest sequence number for an account
  async getLatestSequenceNumber(address: string): Promise<number> {
    try {
      const account = await this.legacyClient.getAccount(address);
      return parseInt(account.sequence_number);
    } catch (error) {
      console.error(`Error getting sequence number for ${address}:`, error);
      throw error;
    }
  }

  // Check if a resource exists
  async doesResourceExist(
    address: string,
    resourceType: string
  ): Promise<boolean> {
    try {
      await this.legacyClient.getAccountResource(address, resourceType);
      return true;
    } catch (error: any) {
      // Check if error indicates resource does not exist
      if (error.status === 404 || 
          (error.message && (
            error.message.includes("Resource not found") ||
            error.message.includes("not found")
          ))) {
        return false;
      }
      
      // Rethrow unexpected errors
      throw error;
    }
  }

  // View function to call read-only contract functions
  async view(
    moduleAddress: string = this.contractAddress,
    moduleName: string, 
    functionName: string, 
    typeArguments: string[] = [],
    args: any[] = []
  ): Promise<any> {
    try {
      // Use the legacy client which has simpler typing
      const result = await this.legacyClient.view({
        function: `${moduleAddress}::${moduleName}::${functionName}`,
        type_arguments: typeArguments,
        arguments: args
      });
      return result;
    } catch (error) {
      console.error(`Error viewing function ${moduleName}::${functionName}:`, error);
      throw error;
    }
  }

  // Submit transaction with improved retry logic and error handling
  async submitTransaction(
    sender: string,
    moduleAddress: string = this.contractAddress,
    moduleName: string,
    functionName: string,
    typeArguments: string[] = [],
    args: any[] = [],
    options: {
      maxGasAmount?: number;
      gasUnitPrice?: number;
    } = {}
  ): Promise<{ hash: string }> {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;
    
    while (attempts < maxAttempts) {
      try {
        if (!window.aptos) {
          throw new Error('Aptos wallet not found. Please install a compatible wallet extension.');
        }
        
        // Try to get the current sequence number for accurate tracking
        let sequenceNumber: number | undefined;
        try {
          sequenceNumber = await this.getLatestSequenceNumber(sender);
          console.log(`Using sequence number: ${sequenceNumber} for account ${sender}`);
        } catch (seqError) {
          console.warn('Failed to get sequence number, continuing without it:', seqError);
        }
        
        // Generate gas parameters if needed
        let gasUnitPrice: string | undefined;
        let maxGasAmount: string | undefined;
        
        if (options.gasUnitPrice) {
          gasUnitPrice = options.gasUnitPrice.toString();
        }
        
        if (options.maxGasAmount) {
          maxGasAmount = options.maxGasAmount.toString();
        }
        
        // Try to simulate the transaction first
        try {
          // Create the legacy client for simulation
          const client = new AptosClient(APTOS_NODE_URL);
          
          // Create payload for simulation
          const simulatePayload = {
            function: `${moduleAddress}::${moduleName}::${functionName}`,
            type_arguments: typeArguments,
            arguments: args
          };
          
          console.log(`Simulating transaction for ${moduleName}::${functionName}...`);
          const simulationResult = await simulateTransaction(client, sender, simulatePayload);
          
          // Use the gas estimates from simulation if successful
          if (simulationResult && simulationResult.gas_unit_price) {
            gasUnitPrice = simulationResult.gas_unit_price;
          }
          
          if (simulationResult && simulationResult.max_gas_amount) {
            // Add a safety buffer of 50% for gas amount
            const estimatedGas = parseInt(simulationResult.max_gas_amount);
            maxGasAmount = Math.ceil(estimatedGas * 1.5).toString();
          }
          
          console.log(`Simulation successful, estimated gas: ${maxGasAmount}, unit price: ${gasUnitPrice}`);
        } catch (simError) {
          // Check for specific errors that we can handle
          const parsedSimError = parseAptosError(simError);
          
          // If it's a resource already exists error, we can just continue
          // since the operation is likely idempotent
          if (parsedSimError.code === 'resource_exists') {
            console.log("Resource already exists, treating as success");
            toast.success("Operation already completed");
            
            // Return a dummy transaction hash for UI feedback
            return { hash: `simulation-already-exists-${Date.now()}` };
          }
          
          // For other errors, log and continue with submission anyway
          console.warn('Simulation failed, proceeding with submission:', parsedSimError);
        }
        
        // Prepare transaction payload
        const payload = {
          function: `${moduleAddress}::${moduleName}::${functionName}`,
          type_arguments: typeArguments,
          arguments: args,
          ...(sequenceNumber !== undefined && { sequence_number: sequenceNumber.toString() }),
          ...(gasUnitPrice && { gas_unit_price: gasUnitPrice }),
          ...(maxGasAmount && { max_gas_amount: maxGasAmount })
        };
        
        // Use wallet adapter to sign and submit
        console.log(`Submitting transaction attempt ${attempts + 1}...`);
        const response = await window.aptos.signAndSubmitTransaction(payload);
        const hash = typeof response === 'string' ? response : response.hash;
        
        console.log(`Transaction submitted with hash: ${hash}`);
        
        // Wait briefly to ensure transaction is processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { hash };
      } catch (error) {
        attempts++;
        lastError = error;
        const parsedError = parseAptosError(error);
        
        // If it's a sequence number or generic error, wait and retry
        if (parsedError.code === 'sequence_number_error' || parsedError.code === 'generic_error') {
          console.warn(`Transaction attempt ${attempts} failed with ${parsedError.code}, waiting before retry...`);
          
          // Clear sequence number cache and try with a fresh one
          try {
            console.log(`Refreshing sequence number for ${sender}...`);
            // Force refresh account info in next attempt
          } catch (refreshError) {
            console.error('Error refreshing account info:', refreshError);
          }
          
          // Add exponential backoff with jitter for retries
          const baseDelay = 2000 * attempts;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (parsedError.code === 'resource_exists') {
          // If resource already exists, treat as success
          console.log("Resource already exists, treating as success");
          toast.success("Operation already completed");
          
          // Return a dummy transaction hash for UI feedback
          return { hash: `already-exists-${Date.now()}` };
        } else {
          // For other errors, throw immediately
          console.error('Error submitting transaction:', error);
          toast.error(`Transaction failed: ${parsedError.message}`);
          throw error;
        }
        
        // If we've reached max attempts, throw the error
        if (attempts >= maxAttempts) {
          console.error('Error submitting transaction after max retries:', error);
          toast.error(`Transaction failed after ${maxAttempts} attempts: ${parsedError.message}`);
          throw error;
        }
      }
    }
    
    // This should never be reached due to the throws above
    throw new Error("Failed to submit transaction after multiple attempts");
  }

  // Check transaction status
  async checkTransaction(txHash: string): Promise<{ success: boolean; status: string }> {
    try {
      // Using the legacy client to avoid TS SDK typing issues
      const txn = await this.legacyClient.getTransactionByHash(txHash);
      return formatTransactionResult(txn);
    } catch (error) {
      console.error(`Error checking transaction ${txHash}:`, error);
      return { success: false, status: 'Transaction not found or query failed' };
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txHash: string, timeoutMs: number = 30000): Promise<{ success: boolean; status: string }> {
    try {
      // Use our polling helper with the legacy client
      return await pollForTransaction(this.legacyClient, txHash, timeoutMs);
    } catch (error) {
      console.error(`Error waiting for transaction ${txHash}:`, error);
      return { success: false, status: `Timeout or error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // Debug a transaction with enhanced details
  async debugTransactionDetails(txHash: string): Promise<any> {
    try {
      // Use enhanced debugging utility
      return await debugTransactionWithDetails(this.legacyClient, txHash);
    } catch (error) {
      console.error(`Error debugging transaction ${txHash}:`, error);
      return { status: 'error', errorDetails: String(error) };
    }
  }

  // Get account resources
  async getAccountResources(address: string): Promise<any[]> {
    try {
      return await this.legacyClient.getAccountResources(address);
    } catch (error) {
      console.error(`Error fetching resources for account ${address}:`, error);
      return [];
    }
  }

  // Get specific account resource
  async getAccountResource(address: string, resourceType: string): Promise<any> {
    try {
      return await this.legacyClient.getAccountResource(address, resourceType);
    } catch (error) {
      console.error(`Error fetching resource ${resourceType} for account ${address}:`, error);
      throw error;
    }
  }
} 