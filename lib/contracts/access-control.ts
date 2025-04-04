import { Types } from 'aptos';
import { Permission } from './types';

export class AccessControlContract {
  private client: Types.AptosClient;
  private contractAddress: string;

  constructor(nodeUrl: string, contractAddress: string) {
    this.client = new Types.AptosClient(nodeUrl);
    this.contractAddress = contractAddress;
  }

  async grantPermission(
    signer: Types.AptosAccount,
    userId: string,
    resourceId: string,
    accessLevel: 'read' | 'write' | 'admin'
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::access_control::grant_permission`,
      type_arguments: [],
      arguments: [userId, resourceId, accessLevel]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  async revokePermission(
    signer: Types.AptosAccount,
    userId: string,
    resourceId: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::access_control::revoke_permission`,
      type_arguments: [],
      arguments: [userId, resourceId]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error revoking permission:', error);
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
        `${this.contractAddress}::access_control::Permission`
      );
      
      return resource.data as Permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return null;
    }
  }
}