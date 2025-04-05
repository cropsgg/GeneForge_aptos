import { AptosClient, Types } from 'aptos';
import { CONTRACT_ADDRESS, APTOS_NODE_URL } from './config';

// Initialize the Aptos client
export const createAptosClient = (): AptosClient => {
  return new AptosClient(APTOS_NODE_URL);
};

// Get account resources from contract
export const getContractResources = async (
  client: AptosClient, 
  resourceType: string
) => {
  try {
    const resource = await client.getAccountResource(
      CONTRACT_ADDRESS,
      resourceType
    );
    return resource.data;
  } catch (error) {
    console.error(`Error fetching resource ${resourceType}:`, error);
    throw error;
  }
};

// Helper to convert string to bytes
export const stringToBytes = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Helper to convert bytes to string
export const bytesToString = (bytes: Uint8Array): string => {
  return new TextDecoder().decode(bytes);
};

// Helper to generate a payload for a function call
export const generatePayload = (
  module: string,
  func: string,
  args: any[],
  typeArgs: string[] = []
): Types.EntryFunctionPayload => {
  return {
    function: `${CONTRACT_ADDRESS}::${module}::${func}`,
    type_arguments: typeArgs,
    arguments: args
  };
};

// Helper to execute a transaction and wait for it
export const executeTransaction = async (
  client: AptosClient,
  signer: any,
  payload: Types.EntryFunctionPayload
): Promise<string> => {
  try {
    const rawTxn = await client.generateTransaction(signer.address(), payload);
    const signedTxn = await client.signTransaction(signer, rawTxn);
    const txnResult = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(txnResult.hash);
    return txnResult.hash;
  } catch (error) {
    console.error('Transaction execution failed:', error);
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get deployed contract address
export const getContractAddress = (): string => {
  return CONTRACT_ADDRESS;
}; 