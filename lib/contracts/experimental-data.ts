import { AptosClient, AptosAccount, Types } from 'aptos';
import { ExperimentalData } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient, stringToBytes } from './aptos-client';

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
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.SUBMIT_EXPERIMENT}`,
      type_arguments: [],
      arguments: [stringToBytes(dataHash), stringToBytes(description)]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
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
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.UPDATE_EXPERIMENT}`,
      type_arguments: [],
      arguments: [dataId, stringToBytes(newHash), stringToBytes(description)]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
    } catch (error) {
      console.error('Error updating experimental data:', error);
      throw error;
    }
  }

  async getDataHistory(dataId: string): Promise<ExperimentalData> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::ExperimentalData`
      );
      
      return resource.data as ExperimentalData;
    } catch (error) {
      console.error('Error getting data history:', error);
      throw error;
    }
  }
}