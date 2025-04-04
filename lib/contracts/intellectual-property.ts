import { AptosClient, AptosAccount, Types } from 'aptos';
import { IntellectualProperty } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient, stringToBytes } from './aptos-client';

export class IntellectualPropertyContract {
  private client: AptosClient;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS) {
    this.client = createAptosClient();
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.INTELLECTUAL_PROPERTY;
  }

  async recordContribution(
    signer: AptosAccount,
    title: string,
    description: string,
    role: string,
    contribution: string
  ): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.REGISTER_CONTRIBUTION}`,
      type_arguments: [],
      arguments: [
        stringToBytes(title), 
        stringToBytes(description), 
        stringToBytes(role), 
        stringToBytes(contribution)
      ]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
    } catch (error) {
      console.error('Error recording contribution:', error);
      throw error;
    }
  }

  async getContribution(contributionId: string): Promise<IntellectualProperty> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::Contribution`
      );
      
      return resource.data as IntellectualProperty;
    } catch (error) {
      console.error('Error getting contribution:', error);
      throw error;
    }
  }
}