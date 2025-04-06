import { Types } from 'aptos';
import { WorkflowTask } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { stringToBytes, parseAptosError } from './aptos-client';
import { AptosConnector } from './aptos-connector';
import { Network } from '@aptos-labs/ts-sdk';

export class WorkflowAutomationContract {
  private connector: AptosConnector;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS, network: Network = Network.DEVNET) {
    this.connector = new AptosConnector(network, contractAddress);
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.WORKFLOW_AUTOMATION;
  }

  // Check if registry is initialized and initialize if needed
  async ensureRegistryInitialized(walletAddress: string): Promise<boolean> {
    try {
      // Check if the registry resource exists
      const registryExists = await this.connector.doesResourceExist(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::TaskRegistry`
      );
      
      if (!registryExists) {
        console.log("Workflow registry not initialized, initializing now...");
        
        // Initialize registry
        const initTxn = await this.connector.submitTransaction(
          walletAddress,
          this.contractAddress,
          this.moduleName,
          FUNCTIONS.INITIALIZE_WORKFLOW_REGISTRY,
          [],
          []
        );
        
        // Wait for initialization to complete
        const status = await this.connector.waitForTransaction(initTxn.hash);
        
        if (!status.success) {
          throw new Error(`Failed to initialize workflow registry: ${status.status}`);
        }
        
        console.log("Workflow registry initialized successfully");
        return true;
      }
      
      return true;
    } catch (error) {
      const parsedError = parseAptosError(error);
      
      // If error is because registry already exists, consider it a success
      if (parsedError.code === 'resource_exists') {
        console.log("Workflow registry already initialized");
        return true;
      }
      
      console.error("Error ensuring workflow registry initialization:", error);
      throw error;
    }
  }

  async createTask(
    walletAddress: string,
    description: string,
    assignee: string
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized first
      await this.ensureRegistryInitialized(walletAddress);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.CREATE_TASK,
        [],
        [Array.from(stringToBytes(description)), assignee]
      );
    } catch (error) {
      console.error('Error creating workflow task:', error);
      throw error;
    }
  }

  async updateTaskStatus(
    walletAddress: string,
    taskId: number,
    status: number
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized
      await this.ensureRegistryInitialized(walletAddress);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.UPDATE_TASK_STATUS,
        [],
        [taskId, status]
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async getTask(taskId: number): Promise<WorkflowTask | null> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'get_task_by_id',
        [],
        [this.contractAddress, taskId]
      );
      
      if (!result || result.length < 4) {
        return null;
      }
      
      const [descriptionBytes, ownerAddress, statusValue, timestampBigInt] = result;
      
      return {
        id: taskId,
        description: new TextDecoder().decode(new Uint8Array(descriptionBytes)),
        owner: ownerAddress.toString(),
        status: this.getStatusName(Number(statusValue)),
        timestamp: Number(timestampBigInt)
      };
    } catch (error) {
      console.error('Error getting task:', error);
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

  // Helper method to get status name from number
  private getStatusName(statusValue: number): string {
    const statusMap = {
      0: 'Pending',
      1: 'In Progress',
      2: 'Completed',
      3: 'Approved'
    };
    return statusMap[statusValue as keyof typeof statusMap] || 'Unknown';
  }

  // Task status constants
  static readonly TASK_STATUS = {
    PENDING: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
    APPROVED: 3
  };
}