import { Types } from 'aptos';
import { IntellectualProperty } from './types';

export class IntellectualPropertyContract {
  private client: Types.AptosClient;
  private contractAddress: string;

  constructor(nodeUrl: string, contractAddress: string) {
    this.client = new Types.AptosClient(nodeUrl);
    this.contractAddress = contractAddress;
  }

  async recordContribution(
    signer: Types.AptosAccount,
    title: string,
    description: string,
    role: string,
    contribution: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::intellectual_property::record_contribution`,
      type_arguments: [],
      arguments: [title, description, role, contribution]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error recording contribution:', error);
      throw error;
    }
  }

  async getContribution(contributionId: string): Promise<IntellectualProperty> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::intellectual_property::Contribution`
      );
      
      return resource.data as IntellectualProperty;
    } catch (error) {
      console.error('Error getting contribution:', error);
      throw error;
    }
  }
}