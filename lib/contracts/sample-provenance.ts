import { AptosClient, AptosAccount, Types } from 'aptos';
import { Sample, SampleHistoryEvent } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient, stringToBytes, executeTransaction, generatePayload } from './aptos-client';

export class SampleProvenanceContract {
  private client: AptosClient;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS) {
    this.client = createAptosClient();
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.SAMPLE_PROVENANCE;
  }

  async registerSample(
    signer: AptosAccount,
    description: string,
  ): Promise<string> {
    try {
      const payload = generatePayload(
        this.moduleName,
        FUNCTIONS.REGISTER_SAMPLE,
        [stringToBytes(description)]
      );
      
      return await executeTransaction(this.client, signer, payload);
    } catch (error) {
      console.error('Error registering sample:', error);
      throw error;
    }
  }

  async recordTransfer(
    signer: AptosAccount,
    sampleId: number,
    newOwner: string,
    details: string
  ): Promise<string> {
    try {
      const payload = generatePayload(
        this.moduleName,
        FUNCTIONS.RECORD_TRANSFER,
        [sampleId, newOwner, stringToBytes(details)]
      );
      
      return await executeTransaction(this.client, signer, payload);
    } catch (error) {
      console.error('Error recording transfer:', error);
      throw error;
    }
  }

  async getSampleById(sampleId: number): Promise<Sample | null> {
    try {
      // This is a placeholder as the smart contract doesn't expose a view function yet
      // In a real implementation, we would query the chain for the sample data
      // This would require adding a view function to the Move module
      console.warn('getSampleById is not fully implemented yet');
      return null;
    } catch (error) {
      console.error('Error getting sample:', error);
      return null;
    }
  }

  async getAllSamples(): Promise<Sample[]> {
    try {
      // This is a placeholder as the smart contract doesn't expose a view function yet
      // In a real implementation, we would query the chain for all samples
      // This would require adding a view function to the Move module
      console.warn('getAllSamples is not fully implemented yet');
      return [];
    } catch (error) {
      console.error('Error getting samples:', error);
      return [];
    }
  }
}