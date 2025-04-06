import { Types } from 'aptos';
import { Permission } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { stringToBytes, parseAptosError } from './aptos-client';
import { AptosConnector } from './aptos-connector';
import { Network } from '@aptos-labs/ts-sdk';

export class AccessControlContract {
  private connector: AptosConnector;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS, network: Network = Network.DEVNET) {
    this.connector = new AptosConnector(network, contractAddress);
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.ACCESS_CONTROL;
  }

  // Check if registry is initialized and initialize if needed
  async ensureRegistryInitialized(walletAddress: string): Promise<boolean> {
    try {
      // Check if the registry resource exists
      const registryExists = await this.connector.doesResourceExist(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::PermissionRegistry`
      );
      
      if (!registryExists) {
        console.log("Permission registry not initialized, initializing now...");
        
        // Initialize registry
        const initTxn = await this.connector.submitTransaction(
          walletAddress,
          this.contractAddress,
          this.moduleName,
          FUNCTIONS.INITIALIZE_PERMISSION_REGISTRY,
          [],
          []
        );
        
        // Wait for initialization to complete
        const status = await this.connector.waitForTransaction(initTxn.hash);
        
        if (!status.success) {
          throw new Error(`Failed to initialize permission registry: ${status.status}`);
        }
        
        console.log("Permission registry initialized successfully");
        return true;
      }
      
      return true;
    } catch (error) {
      const parsedError = parseAptosError(error);
      
      // If error is because registry already exists, consider it a success
      if (parsedError.code === 'resource_exists') {
        console.log("Permission registry already initialized");
        return true;
      }
      
      console.error("Error ensuring permission registry initialization:", error);
      throw error;
    }
  }

  async grantPermission(
    walletAddress: string,
    userId: string,
    resourceId: number,
    accessLevel: number
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized first
      await this.ensureRegistryInitialized(walletAddress);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.GRANT_PERMISSION,
        [],
        [userId, resourceId, accessLevel]
      );
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  async checkPermission(
    userId: string,
    resourceId: number
  ): Promise<Permission | null> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'check_permission',
        [],
        [userId, resourceId]
      );
      
      if (!result || result.length < 1) {
        return null;
      }
      
      return {
        user: userId,
        resource_id: resourceId,
        level: Number(result[0]),
        granted_at: Number(result[1]),
        granted_by: result[2]
      };
    } catch (error) {
      console.error('Error checking permission:', error);
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

  // Helper methods for access levels
  static readonly ACCESS_LEVELS = {
    READ: 1,
    WRITE: 2,
    ADMIN: 3
  };
}