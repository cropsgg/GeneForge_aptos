import { AptosClient, AptosAccount, Types } from 'aptos';
import { Permission } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient } from './aptos-client';

export class AccessControlContract {
  private client: AptosClient;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS) {
    this.client = createAptosClient();
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.ACCESS_CONTROL;
  }

  async grantPermission(
    signer: AptosAccount,
    userId: string,
    resourceId: number,
    accessLevel: number
  ): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.GRANT_PERMISSION}`,
      type_arguments: [],
      arguments: [userId, resourceId, accessLevel]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  async checkPermission(
    userId: string,
    resourceId: string
  ): Promise<Permission | null> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::Permission`
      );
      
      return resource.data as Permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return null;
    }
  }

  // Helper methods for access levels
  static readonly ACCESS_LEVELS = {
    READ: 1,
    WRITE: 2,
    ADMIN: 3
  };
}