import { Types } from 'aptos';
import { Sample, SampleHistoryEvent } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { stringToBytes, bytesToString, parseAptosError } from './aptos-client';
import { AptosConnector } from './aptos-connector';
import { Network } from '@aptos-labs/ts-sdk';

export class SampleProvenanceContract {
  private connector: AptosConnector;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS, network: Network = Network.DEVNET) {
    this.connector = new AptosConnector(network, contractAddress);
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.SAMPLE_PROVENANCE;
  }

  // Check if registry is initialized and initialize if needed
  async ensureRegistryInitialized(walletAddress: string): Promise<boolean> {
    try {
      console.log("Checking if sample registry is initialized...");
      
      // Guard against multiple initialization attempts with a simple lock mechanism
      if ((this as any)._initializingRegistry) {
        console.log("Registry initialization already in progress, waiting...");
        // Wait for existing initialization to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      }
      
      (this as any)._initializingRegistry = true;
      
      try {
        // Check if the registry resource exists
        const registryExists = await this.connector.doesResourceExist(
          this.contractAddress,
          `${this.contractAddress}::${this.moduleName}::SampleRegistry`
        );
        
        if (!registryExists) {
          console.log("Sample registry not initialized, initializing now...");
          
          // Initialize registry
          const initTxn = await this.connector.submitTransaction(
            walletAddress,
            this.contractAddress,
            this.moduleName,
            FUNCTIONS.INITIALIZE_SAMPLE_REGISTRY,
            [],
            []
          );
          
          // Check if we got a synthetic hash (indicates already exists handling)
          if (initTxn.hash.includes('already-exists') || initTxn.hash.includes('simulation-already-exists')) {
            console.log("Registry already initialized (detected during transaction)");
            return true;
          }
          
          // Wait for initialization to complete
          const status = await this.connector.waitForTransaction(initTxn.hash);
          
          if (!status.success) {
            // If it failed but registry might actually be initialized (race condition)
            if (status.status.includes('already exists')) {
              console.log("Registry already initialized (detected from transaction result)");
              return true;
            }
            
            throw new Error(`Failed to initialize registry: ${status.status}`);
          }
          
          console.log("Sample registry initialized successfully");
          return true;
        }
        
        console.log("Sample registry already initialized");
        return true;
      } finally {
        // Always release the lock
        (this as any)._initializingRegistry = false;
      }
    } catch (error) {
      (this as any)._initializingRegistry = false;
      const parsedError = parseAptosError(error);
      
      // If error is because registry already exists, consider it a success
      if (parsedError.code === 'resource_exists') {
        console.log("Registry already initialized (caught from error)");
        return true;
      }
      
      // If it's a sequence number error, this might be due to a race condition
      // where another transaction initialized the registry before this one
      if (parsedError.code === 'sequence_number_error') {
        console.log("Sequence number error during initialization, checking if registry exists...");
        
        // Double-check if the registry exists
        try {
          const registryExists = await this.connector.doesResourceExist(
            this.contractAddress,
            `${this.contractAddress}::${this.moduleName}::SampleRegistry`
          );
          
          if (registryExists) {
            console.log("Registry already initialized (checked after sequence error)");
            return true;
          }
        } catch (checkError) {
          console.error("Error checking registry after sequence error:", checkError);
        }
      }
      
      console.error("Error ensuring registry initialization:", error);
      throw error;
    }
  }

  // Function to register a new sample
  async registerSample(
    walletAddress: string,
    description: string,
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized first
      await this.ensureRegistryInitialized(walletAddress);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.REGISTER_SAMPLE,
        [],
        [Array.from(stringToBytes(description))]
      );
    } catch (error) {
      console.error('Error registering sample:', error);
      throw error;
    }
  }

  // Function to transfer a sample to a new owner
  async recordTransfer(
    walletAddress: string,
    sampleId: number,
    newOwner: string,
    details: string
  ): Promise<{ hash: string }> {
    try {
      // Ensure registry is initialized
      await this.ensureRegistryInitialized(walletAddress);
      
      return await this.connector.submitTransaction(
        walletAddress,
        this.contractAddress,
        this.moduleName,
        FUNCTIONS.RECORD_TRANSFER,
        [],
        [sampleId, newOwner, Array.from(stringToBytes(details))]
      );
    } catch (error) {
      console.error('Error recording transfer:', error);
      throw error;
    }
  }

  // Function to get total sample count
  async getSampleCount(): Promise<number> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'get_sample_count',
        [],
        [this.contractAddress]
      );
      
      return Number(result[0]);
    } catch (error) {
      console.error('Error getting sample count:', error);
      return 0;
    }
  }

  // Function to get sample by ID
  async getSampleById(sampleId: number): Promise<Sample | null> {
    try {
      const result = await this.connector.view(
        this.contractAddress,
        this.moduleName,
        'get_sample_by_id',
        [],
        [this.contractAddress, sampleId]
      );
      
      if (!result || result.length < 3) {
        return null;
      }
      
      const [descriptionBytes, ownerAddress, timestampBigInt] = result;
      
      // Convert data from Move format
      const description = bytesToString(descriptionBytes);
      const owner = ownerAddress.toString();
      const timestamp = Number(timestampBigInt);
      
      return {
        id: sampleId,
        description,
        owner,
        timestamp,
        // We don't have history details in this call, just latest event time
        history: [{
          event_type: "Latest event",
          operator: owner,
          timestamp,
          details: ""
        }]
      };
    } catch (error) {
      console.error(`Error getting sample id ${sampleId}:`, error);
      return null;
    }
  }

  // Function to get all samples
  async getAllSamples(): Promise<Sample[]> {
    try {
      const count = await this.getSampleCount();
      const samples: Sample[] = [];
      
      // Fetch each sample
      for (let i = 0; i < count; i++) {
        const sample = await this.getSampleById(i);
        if (sample) {
          samples.push(sample);
        }
      }
      
      return samples;
    } catch (error) {
      console.error('Error getting all samples:', error);
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