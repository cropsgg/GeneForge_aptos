import { Types } from 'aptos';
import { ExperimentalData } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { stringToBytes, bytesToString, parseAptosError } from './aptos-client';
import { AptosConnector } from './aptos-connector';
import { Network } from '@aptos-labs/ts-sdk';

export class ExperimentalDataContract {
  private connector: AptosConnector;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS, network: Network = Network.DEVNET) {
    this.connector = new AptosConnector(network, contractAddress);
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.EXPERIMENTAL_DATA;
  }

  // Check if registry is initialized and initialize if needed
  async ensureRegistryInitialized(walletAddress: string): Promise<boolean> {
    try {
      // Check if the registry resource exists
      const registryExists = await this.connector.doesResourceExist(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::DataRegistry`
      );
      
      if (!registryExists) {
        console.log("Data registry not initialized, initializing now...");
        
        // Initialize registry
        const initTxn = await this.connector.submitTransaction(
          walletAddress,
          this.contractAddress,
          this.moduleName,
          FUNCTIONS.INITIALIZE_DATA_REGISTRY,
          [],
          []
        );
        
        // Wait for initialization to complete
        const status = await this.connector.waitForTransaction(initTxn.hash);
        
        if (!status.success) {
          throw new Error(`Failed to initialize data registry: ${status.status}`);
        }
        
        console.log("Data registry initialized successfully");
        return true;
      }
      
      return true;
    } catch (error) {
      const parsedError = parseAptosError(error);
      
      // If error is because registry already exists, consider it a success
      if (parsedError.code === 'resource_exists') {
        console.log("Data registry already initialized");
        return true;
      }
      
      console.error("Error ensuring data registry initialization:", error);
      throw error;
    }
  }

  // Submit experimental data
  async submitData(
    walletAddress: string,
    dataHash: string,
    description: string,
    experimentId: string,
    dataType: string,
    version: string
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized first
      await this.ensureRegistryInitialized(walletAddress);
      
      // Create a full data object to send
      const dataObject = {
        hash: dataHash,
        description: description,
        experimentId: experimentId,
        dataType: dataType,
        version: version
      };
      
      // Convert to JSON string and then to bytes for Move
      const dataJson = JSON.stringify(dataObject);
      
      // Debug log size of the data
      console.log(`Data JSON size: ${dataJson.length} bytes`);
      
      // Submit transaction with retry logic
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.SUBMIT_EXPERIMENT,
        [],
        [Array.from(stringToBytes(dataJson))]
      );
    } catch (error) {
      console.error('Error submitting experimental data:', error);
      throw error;
    }
  }

  // Update experimental data
  async updateData(
    walletAddress: string,
    dataId: number,
    newHash: string,
    description: string,
    version: string
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized
      await this.ensureRegistryInitialized(walletAddress);
      
      // Create a update object
      const updateObject = {
        hash: newHash,
        description: description,
        version: version
      };
      
      // Convert to JSON string and then to bytes for Move
      const updateJson = JSON.stringify(updateObject);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.UPDATE_EXPERIMENT,
        [],
        [dataId, Array.from(stringToBytes(updateJson))]
      );
    } catch (error) {
      console.error('Error updating experimental data:', error);
      throw error;
    }
  }

  // Get experimental data by ID
  async getDataById(dataId: number): Promise<ExperimentalData | null> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'get_experiment_by_id',
        [],
        [this.contractAddress, dataId]
      );
      
      if (!result || result.length < 3) {
        return null;
      }
      
      const [dataJson, creatorAddress, timestampBigInt] = result;
      
      // Convert from Move format
      const dataString = bytesToString(dataJson);
      let parsedData;
      try {
        parsedData = JSON.parse(dataString);
      } catch (e) {
        console.error('Error parsing JSON data:', e);
        parsedData = { hash: dataString };
      }
      
      return {
        id: dataId,
        hash: parsedData.hash,
        description: parsedData.description || '',
        experimentId: parsedData.experimentId || '',
        dataType: parsedData.dataType || '',
        version: parsedData.version || '1.0',
        creator: creatorAddress.toString(),
        timestamp: Number(timestampBigInt),
        history: []  // We don't have history in this call
      };
    } catch (error) {
      console.error(`Error getting data ID ${dataId}:`, error);
      return null;
    }
  }

  // Get data count
  async getDataCount(): Promise<number> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'get_experiment_count',
        [],
        [this.contractAddress]
      );
      
      return Number(result[0]);
    } catch (error) {
      console.error('Error getting experiment count:', error);
      return 0;
    }
  }

  // Get all experimental data
  async getAllData(): Promise<ExperimentalData[]> {
    try {
      const count = await this.getDataCount();
      const dataItems: ExperimentalData[] = [];
      
      // Fetch each data item
      for (let i = 0; i < count; i++) {
        const data = await this.getDataById(i);
        if (data) {
          dataItems.push(data);
        }
      }
      
      return dataItems;
    } catch (error) {
      console.error('Error getting all experiment data:', error);
      return [];
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