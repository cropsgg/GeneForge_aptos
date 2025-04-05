import { AptosClient, AptosAccount, Types } from 'aptos';
import { Sample, SampleHistoryEvent } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient, stringToBytes } from './aptos-client';

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
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.REGISTER_SAMPLE}`,
      type_arguments: [],
      arguments: [stringToBytes(description)]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
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
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.RECORD_TRANSFER}`,
      type_arguments: [],
      arguments: [sampleId, newOwner, stringToBytes(details)]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
    } catch (error) {
      console.error('Error recording transfer:', error);
      throw error;
    }
  }

  async getSampleHistory(sampleId: string): Promise<Sample> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::Sample`
      );
      
      // Parse and return the sample data
      return resource.data as Sample;
    } catch (error) {
      console.error('Error getting sample history:', error);
      throw error;
    }
  }
}