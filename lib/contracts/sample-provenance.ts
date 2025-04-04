import { Types } from 'aptos';
import { Sample, SampleHistoryEvent } from './types';

export class SampleProvenanceContract {
  private client: Types.AptosClient;
  private contractAddress: string;

  constructor(nodeUrl: string, contractAddress: string) {
    this.client = new Types.AptosClient(nodeUrl);
    this.contractAddress = contractAddress;
  }

  async registerSample(
    signer: Types.AptosAccount,
    description: string,
    origin: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::sample_provenance::register_sample`,
      type_arguments: [],
      arguments: [description, origin]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error registering sample:', error);
      throw error;
    }
  }

  async recordSampleEvent(
    signer: Types.AptosAccount,
    sampleId: string,
    action: string,
    details: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::sample_provenance::record_event`,
      type_arguments: [],
      arguments: [sampleId, action, details]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error recording sample event:', error);
      throw error;
    }
  }

  async getSampleHistory(sampleId: string): Promise<Sample> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::sample_provenance::Sample`
      );
      
      // Parse and return the sample data
      return resource.data as Sample;
    } catch (error) {
      console.error('Error getting sample history:', error);
      throw error;
    }
  }
}