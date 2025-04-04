import { Types } from 'aptos';
import { WorkflowTask } from './types';

export class WorkflowAutomationContract {
  private client: Types.AptosClient;
  private contractAddress: string;

  constructor(nodeUrl: string, contractAddress: string) {
    this.client = new Types.AptosClient(nodeUrl);
    this.contractAddress = contractAddress;
  }

  async createTask(
    signer: Types.AptosAccount,
    description: string,
    assignee: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::workflow_automation::create_task`,
      type_arguments: [],
      arguments: [description, assignee]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error creating workflow task:', error);
      throw error;
    }
  }

  async updateTaskStatus(
    signer: Types.AptosAccount,
    taskId: string,
    status: 'in_progress' | 'completed'
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::workflow_automation::update_task_status`,
      type_arguments: [],
      arguments: [taskId, status]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async approveTask(
    signer: Types.AptosAccount,
    taskId: string,
    comments: string
  ): Promise<string> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${this.contractAddress}::workflow_automation::approve_task`,
      type_arguments: [],
      arguments: [taskId, comments]
    };

    try {
      const txnHash = await this.client.submitTransaction(signer, payload);
      await this.client.waitForTransaction(txnHash);
      return txnHash;
    } catch (error) {
      console.error('Error approving task:', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<WorkflowTask> {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::workflow_automation::Task`
      );
      
      return resource.data as WorkflowTask;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }
}