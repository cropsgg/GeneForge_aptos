import { AptosClient, AptosAccount, Types } from 'aptos';
import { WorkflowTask } from './types';
import { CONTRACT_ADDRESS, MODULE_NAMES, FUNCTIONS } from './config';
import { createAptosClient, stringToBytes } from './aptos-client';

export class WorkflowAutomationContract {
  private client: AptosClient;
  private contractAddress: string;
  private moduleName: string;

  constructor(contractAddress: string = CONTRACT_ADDRESS) {
    this.client = createAptosClient();
    this.contractAddress = contractAddress;
    this.moduleName = MODULE_NAMES.WORKFLOW_AUTOMATION;
  }

  async createTask(
    signer: AptosAccount,
    description: string,
    assignee: string
  ): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.CREATE_TASK}`,
      type_arguments: [],
      arguments: [stringToBytes(description), assignee]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
    } catch (error) {
      console.error('Error creating workflow task:', error);
      throw error;
    }
  }

  async updateTaskStatus(
    signer: AptosAccount,
    taskId: number,
    status: number
  ): Promise<string> {
    const payload: Types.EntryFunctionPayload = {
      function: `${this.contractAddress}::${this.moduleName}::${FUNCTIONS.UPDATE_TASK_STATUS}`,
      type_arguments: [],
      arguments: [taskId, status]
    };

    try {
      const rawTxn = await this.client.generateTransaction(signer.address(), payload);
      const signedTxn = await this.client.signTransaction(signer, rawTxn);
      const txnResult = await this.client.submitTransaction(signedTxn);
      await this.client.waitForTransaction(txnResult.hash);
      return txnResult.hash;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<WorkflowTask> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::${this.moduleName}::Task`
      );
      
      return resource.data as WorkflowTask;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  // Task status constants
  static readonly TASK_STATUS = {
    PENDING: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
    APPROVED: 3
  };
}