import { Types } from 'aptos';
import { IntellectualProperty } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { stringToBytes, parseAptosError } from './aptos-client';
import { AptosConnector } from './aptos-connector';
import { Network } from '@aptos-labs/ts-sdk';

export class IntellectualPropertyContract {
  private connector: AptosConnector;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS, network: Network = Network.DEVNET) {
    this.connector = new AptosConnector(network, contractAddress);
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.INTELLECTUAL_PROPERTY;
  }

  // Check if registry is initialized and initialize if needed
  async ensureRegistryInitialized(walletAddress: string): Promise<boolean> {
    try {
      // Check if the registry resource exists
      const registryExists = await this.connector.doesResourceExist(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::ContributionRegistry`
      );
      
      if (!registryExists) {
        console.log("IP registry not initialized, initializing now...");
        
        // Initialize registry
        const initTxn = await this.connector.submitTransaction(
          walletAddress,
          this.contractAddress,
          this.moduleName,
          FUNCTIONS.INITIALIZE_IP_REGISTRY,
          [],
          []
        );
        
        // Wait for initialization to complete
        const status = await this.connector.waitForTransaction(initTxn.hash);
        
        if (!status.success) {
          throw new Error(`Failed to initialize IP registry: ${status.status}`);
        }
        
        console.log("IP registry initialized successfully");
        return true;
      }
      
      return true;
    } catch (error) {
      const parsedError = parseAptosError(error);
      
      // If error is because registry already exists, consider it a success
      if (parsedError.code === 'resource_exists') {
        console.log("IP registry already initialized");
        return true;
      }
      
      console.error("Error ensuring IP registry initialization:", error);
      throw error;
    }
  }

  async recordContribution(
    walletAddress: string,
    title: string,
    description: string,
    role: string,
    contribution: string
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized first
      await this.ensureRegistryInitialized(walletAddress);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.REGISTER_CONTRIBUTION,
        [],
        [
          Array.from(stringToBytes(title)), 
          Array.from(stringToBytes(description)), 
          Array.from(stringToBytes(role)), 
          Array.from(stringToBytes(contribution))
        ]
      );
    } catch (error) {
      console.error('Error recording contribution:', error);
      throw error;
    }
  }

  async getContribution(contributionId: number): Promise<IntellectualProperty | null> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'get_contribution_by_id',
        [],
        [this.contractAddress, contributionId]
      );
      
      if (!result || result.length < 4) {
        return null;
      }
      
      const [titleBytes, descriptionBytes, contentHashBytes, ownerAddress, timestampBigInt] = result;
      
      return {
        id: contributionId,
        title: new TextDecoder().decode(new Uint8Array(titleBytes)),
        description: new TextDecoder().decode(new Uint8Array(descriptionBytes)),
        content_hash: new TextDecoder().decode(new Uint8Array(contentHashBytes)),
        owner: ownerAddress.toString(),
        timestamp: Number(timestampBigInt)
      };
    } catch (error) {
      console.error('Error getting contribution:', error);
      return null;
    }
  }

  // Function to get transaction explorer URL
  getExplorerUrl(txHash: string): string {
    return this.connector.getExplorerUrl(txHash);
  }

  // Function to check if the network is connected
  async isNetworkConnected(): Promise<boolean> {
    return await this.connector.isConnected();
  }

  // Function to get the current network name
  getNetworkName(): string {
    return this.connector.getNetworkName();
  }
}