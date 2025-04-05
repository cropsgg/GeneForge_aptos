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

// Helper to convert strings to byte arrays for Move 
export const stringToBytes = (text: string): Uint8Array => {
  return new TextEncoder().encode(text);
};

// Get deployed contract address
export const getContractAddress = (): string => {
  return CONTRACT_ADDRESS;
}; 