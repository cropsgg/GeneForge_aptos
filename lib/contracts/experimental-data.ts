import { Types } from 'aptos';
import { ExperimentalData } from './types';

export class ExperimentalDataContract {
  private client: Types.AptosClient;
  private contractAddress: string;

  constructor(nodeUrl: string, contractAddress: string) {
    this.client = new Types.AptosClient(nodeUrl);
    this.contractAddress = contractAddress;
  }

  async submitData(
    signer: Types.AptosAccount,
    dataHash: string,
    description: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::experimental_data::submit_data`,
      type_arguments: [],
      arguments: [dataHash, description]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error submitting experimental data:', error);
      throw error;
    }
  }

  async updateData(
    signer: Types.AptosAccount,
    dataId: string,
    newHash: string,
    description: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::experimental_data::update_data`,
      type_arguments: [],
      arguments: [dataId, newHash, description]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error updating experimental data:', error);
      throw error;
    }
  }

  async getDataHistory(dataId: string): Promise<ExperimentalData> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::experimental_data::ExperimentalData`
      );
      
      return resource.data as ExperimentalData;
    } catch (error) {
      console.error('Error getting data history:', error);
      throw error;
    }
  }
}