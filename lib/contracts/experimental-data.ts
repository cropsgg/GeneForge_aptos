import { AptosClient, AptosAccount, Types } from 'aptos';
import { ExperimentalData } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient, stringToBytes, executeTransaction, generatePayload } from './aptos-client';

export class ExperimentalDataContract {
  private client: AptosClient;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS) {
    this.client = createAptosClient();
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.EXPERIMENTAL_DATA;
  }

  async submitData(
    signer: AptosAccount,
    dataHash: string,
    description: string
  ): Promise<string> {
    try {
      const payload = generatePayload(
        this.moduleName,
        FUNCTIONS.SUBMIT_EXPERIMENT,
        [stringToBytes(dataHash), stringToBytes(description)]
      );
      
      return await executeTransaction(this.client, signer, payload);
    } catch (error) {
      console.error('Error submitting experimental data:', error);
      throw error;
    }
  }

  async updateData(
    signer: AptosAccount,
    dataId: number,
    newHash: string,
    description: string
  ): Promise<string> {
    try {
      const payload = generatePayload(
        this.moduleName,
        FUNCTIONS.UPDATE_EXPERIMENT,
        [dataId, stringToBytes(newHash), stringToBytes(description)]
      );
      
      return await executeTransaction(this.client, signer, payload);
    } catch (error) {
      console.error('Error updating experimental data:', error);
      throw error;
    }
  }

  async getExperimentById(experimentId: number): Promise<ExperimentalData | null> {
    try {
      // This is a placeholder as the smart contract doesn't expose a view function yet
      // In a real implementation, we would query the chain for the experiment data
      // This would require adding a view function to the Move module
      console.warn('getExperimentById is not fully implemented yet');
      return null;
    } catch (error) {
      console.error('Error getting experiment:', error);
      return null;
    }
  }

  async getAllExperiments(): Promise<ExperimentalData[]> {
    try {
      // This is a placeholder as the smart contract doesn't expose a view function yet
      // In a real implementation, we would query the chain for all experiments
      // This would require adding a view function to the Move module
      console.warn('getAllExperiments is not fully implemented yet');
      return [];
    } catch (error) {
      console.error('Error getting experiments:', error);
      return [];
    }
  }
}