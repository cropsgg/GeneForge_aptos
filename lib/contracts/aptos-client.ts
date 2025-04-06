import { AptosClient, Types, TxnBuilderTypes, BCS, HexString } from 'aptos';
import { CONTRACT_ADDRESS, APTOS_NODE_URL } from './config';

// Type declaration for the Aptos wallet
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string; publicKey: string }>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
      signTransaction: (transaction: any) => Promise<Uint8Array>;
      network: string;
    };
  }
}

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

// Simulate transaction before submitting with better error handling
export const simulateTransaction = async (
  client: AptosClient,
  senderAddress: string,
  payload: Types.EntryFunctionPayload
): Promise<any> => {
  try {
    // First get the latest sequence number to ensure it's correct
    const account = await client.getAccount(senderAddress);
    const currentSeqNum = parseInt(account.sequence_number);
    
    // Generate the transaction with proper gas parameters
    const rawTxn = await client.generateTransaction(senderAddress, payload, {
      max_gas_amount: "20000", // Set a reasonable default as string
      gas_unit_price: "100"    // Set a reasonable default as string
    });
    
    // Log sequence number comparison for debugging
    console.log(`Simulation - Current account sequence number: ${currentSeqNum}, Transaction sequence number: ${rawTxn.sequence_number}`);
    
    // Using recommended simulation parameters with improved typing
    const simulationOptions = {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true
    };
    
    // Perform simulation with better error handling
    // Cast to any to work around type issues with simulateTransaction
    const simulation = await (client as any).simulateTransaction(rawTxn, simulationOptions);
    
    if (simulation.length > 0) {
      const simResult = simulation[0];
      
      if (simResult.success) {
        // If successful, return with gas estimates
        return {
          ...simResult,
          gas_used: simResult.gas_used || '0',
          gas_unit_price: simResult.gas_unit_price || '0',
          max_gas_amount: simResult.max_gas_amount || '0'
        };
      } else {
        // Handle specific VM errors from simulation
        const vmStatus = simResult.vm_status || 'Unknown error';
        
        // Check for resource already exists error
        if (vmStatus.includes('already exists') || vmStatus.includes('RESOURCE_ALREADY_EXISTS')) {
          throw new Error(`Resource already exists: ${vmStatus}`);
        }
        
        // Check for sequence number error
        if (vmStatus.includes('SEQUENCE_NUMBER_TOO_') || vmStatus.includes('sequence number')) {
          throw new Error(`Sequence number error: ${vmStatus}. Current account sequence number: ${currentSeqNum}`);
        }
        
        // Check for gas errors
        if (vmStatus.includes('OUT_OF_GAS') || vmStatus.includes('gas')) {
          throw new Error(`Gas error: ${vmStatus}. Try increasing gas limit.`);
        }
        
        // Generic error with more details
        console.error('Simulation failed with VM status:', vmStatus);
        console.error('Full simulation result:', JSON.stringify(simulation));
        throw new Error(`Simulation failed: ${vmStatus}`);
      }
    } else {
      throw new Error('Empty simulation result. The transaction might be invalid.');
    }
  } catch (error) {
    // If it's already a parsed error, pass it through
    if (error instanceof Error && error.message) {
      console.error('Transaction simulation failed:', error.message);
      throw error;
    }
    
    // Otherwise, wrap it in a more descriptive error
    console.error('Unexpected error during transaction simulation:', error);
    throw new Error(`Transaction simulation failed: ${String(error)}`);
  }
};

// Sign and submit a transaction using the wallet adapter
export const signAndSubmitTransaction = async (
  client: AptosClient,
  payload: Types.EntryFunctionPayload
): Promise<{ hash: string }> => {
  try {
    if (!window.aptos) {
      throw new Error('Aptos wallet not found. Please install a compatible wallet extension.');
    }
    
    // Use the wallet to sign and submit the transaction
    const response = await window.aptos.signAndSubmitTransaction(payload);
    
    // Handle different response formats from wallet adapters
    let txHash: string;
    if (typeof response === 'string') {
      txHash = response;
    } else if (typeof response === 'object' && response !== null && 'hash' in response) {
      txHash = response.hash;
    } else {
      throw new Error('Invalid response format from wallet');
    }
    
    // Return the transaction hash
    return { hash: txHash };
  } catch (error) {
    console.error('Error in signAndSubmitTransaction:', error);
    throw error;
  }
};

// Wait for a transaction to be confirmed
export const waitForTransaction = async (
  client: AptosClient,
  txHash: string
): Promise<any> => {
  try {
    const result = await client.waitForTransaction(txHash);
    return result;
  } catch (error) {
    console.error(`Error waiting for transaction ${txHash}:`, error);
    throw error;
  }
};

// Bytes to string conversion for reading Move data
export const bytesToString = (bytes: Uint8Array | string[] | number[]): string => {
  if (bytes instanceof Uint8Array) {
    return new TextDecoder().decode(bytes);
  } else if (Array.isArray(bytes)) {
    return new TextDecoder().decode(new Uint8Array(bytes as number[]));
  }
  return '';
};

// Format address to standard format
export const formatAddress = (address: string): string => {
  try {
    if (!address.startsWith('0x')) {
      address = `0x${address}`;
    }
    return address;
  } catch (error) {
    console.error('Error formatting address:', error);
    return address;
  }
};

// Helper to call a view function on a contract
export const callViewFunction = async (
  client: AptosClient,
  moduleName: string,
  functionName: string,
  typeArgs: string[] = [],
  args: any[] = []
): Promise<any> => {
  try {
    const response = await client.view({
      function: `${CONTRACT_ADDRESS}::${moduleName}::${functionName}`,
      type_arguments: typeArgs,
      arguments: args
    });
    
    return response;
  } catch (error) {
    console.error(`Error calling view function ${moduleName}::${functionName}:`, error);
    throw error;
  }
};

// Format transaction result for consistent handling
export const formatTransactionResult = (txn: any): { success: boolean; status: string } => {
  let success = false;
  let status = '';
  
  if (!txn) {
    return { success: false, status: 'No transaction data' };
  }
  
  if (typeof txn.success === 'boolean') {
    success = txn.success;
    status = txn.vm_status || '';
  } else if (txn.vm_status) {
    success = txn.vm_status === 'Executed successfully';
    status = txn.vm_status;
  } else if (txn.type === 'user_transaction' && txn.payload) {
    success = true; // Assume success if we can't determine
    status = 'Transaction confirmed';
  }
  
  return { success, status };
};

// Poll and wait for a transaction to be confirmed with timeout
export const pollForTransaction = async (
  client: AptosClient, 
  txHash: string, 
  timeoutMs: number = 30000
): Promise<{ success: boolean; status: string }> => {
  const startTime = Date.now();
  let lastKnownStatus = { success: false, status: 'Waiting for confirmation' };
  
  while ((Date.now() - startTime) < timeoutMs) {
    try {
      const txn = await client.getTransactionByHash(txHash);
      if (txn) {
        lastKnownStatus = formatTransactionResult(txn);
        
        // If we have a definitive success or failure, return it
        if (lastKnownStatus.success || (lastKnownStatus.status && lastKnownStatus.status !== 'Waiting for confirmation')) {
          return lastKnownStatus;
        }
      }
    } catch (error) {
      // Ignore error and retry - transaction might not be available yet
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // If we timeout, return the last status we had
  return lastKnownStatus.status ? 
    lastKnownStatus : 
    { success: false, status: 'Timeout waiting for transaction confirmation' };
};

// Parse Aptos errors into more understandable formats with actionable messages
export const parseAptosError = (error: any): {
  code: string;
  message: string;
  details: string;
  actionable: string;
} => {
  // Default error structure
  const defaultError = {
    code: 'unknown_error',
    message: String(error),
    details: '',
    actionable: 'Try again later or contact support if the issue persists.'
  };
  
  if (!error) return defaultError;
  
  try {
    // If it's an Error object
    if (error instanceof Error) {
      const message = error.message;
      
      // Generic error
      if (message.includes('Generic error')) {
        // Try to extract more details
        const detailsMatch = message.match(/Generic error: (.*?)($|\.)/);
        const details = detailsMatch ? detailsMatch[1] : message;
        
        // Check for specific known generic error cases
        if (details.includes('Out of gas')) {
          return {
            code: 'out_of_gas',
            message: 'Transaction ran out of gas',
            details,
            actionable: 'Try increasing the gas limit or simplifying your transaction.'
          };
        }
        
        if (details.includes('RESOURCE_ALREADY_EXISTS')) {
          return {
            code: 'resource_exists',
            message: 'Resource already exists',
            details,
            actionable: 'This operation has already been completed.'
          };
        }
        
        if (details.includes('RESOURCE_DOES_NOT_EXIST')) {
          return {
            code: 'resource_not_found',
            message: 'Resource does not exist',
            details,
            actionable: 'Ensure the resource exists before trying to access it.'
          };
        }
        
        if (details.includes('SEQUENCE_NUMBER')) {
          return {
            code: 'sequence_number_error',
            message: 'Transaction sequence number issue',
            details,
            actionable: 'Wait a moment and try again. Your previous transaction may still be processing.'
          };
        }
        
        return {
          code: 'generic_error',
          message: 'Transaction encountered an error',
          details,
          actionable: 'Try again with different parameters or check your inputs.'
        };
      }
      
      // Sequence number error
      if (message.includes('sequence number')) {
        return {
          code: 'sequence_number_error',
          message: 'Transaction sequence number mismatch',
          details: message,
          actionable: 'Wait a moment and try again. Your previous transaction may still be processing.'
        };
      }
      
      // Resource already exists
      if (message.includes('already exists') || message.includes('resource already exists')) {
        return {
          code: 'resource_exists',
          message: 'Resource already exists',
          details: message,
          actionable: 'This operation has already been completed.'
        };
      }
      
      // Gas estimation error
      if (message.includes('gas') && message.includes('estimate')) {
        return {
          code: 'gas_estimation_error',
          message: 'Failed to estimate gas for transaction',
          details: message,
          actionable: 'Try manually setting a higher gas limit.'
        };
      }
      
      // Permission denied
      if (message.includes('permission') || message.includes('authorization')) {
        return {
          code: 'permission_denied',
          message: 'You do not have permission to perform this action',
          details: message,
          actionable: 'Verify that you have the correct permissions or try with a different account.'
        };
      }
      
      // Account/resource not found
      if (message.includes('account not found') || message.includes('resource not found') || message.includes('404')) {
        return {
          code: 'not_found',
          message: 'The requested resource was not found',
          details: message,
          actionable: 'Verify the address or resource ID and try again.'
        };
      }
      
      // Invalid arguments
      if (message.includes('invalid argument') || message.includes('INVALID_ARGUMENT')) {
        return {
          code: 'invalid_argument',
          message: 'Invalid argument provided to function',
          details: message,
          actionable: 'Check your inputs and ensure they match the expected format.'
        };
      }
    }
    
    // If it's a raw API error from Aptos
    if (typeof error === 'object' && error !== null) {
      if (error.vm_status) {
        return {
          code: 'vm_error',
          message: 'VM execution error',
          details: error.vm_status,
          actionable: 'Check your transaction inputs or wait and try again.'
        };
      }
      
      if (error.error_code) {
        return {
          code: error.error_code,
          message: error.message || 'API error',
          details: JSON.stringify(error),
          actionable: 'Check your inputs and try again.'
        };
      }
    }
    
    return defaultError;
  } catch (parseError) {
    console.error('Error parsing Aptos error:', parseError);
    return defaultError;
  }
};

// Debug transaction information
export const debugTransaction = async (
  client: AptosClient,
  txHash: string
): Promise<void> => {
  try {
    console.log(`==== Transaction Debug Info for ${txHash} ====`);
    
    // Get transaction info
    const txn = await client.getTransactionByHash(txHash);
    console.log("Transaction type:", txn.type);
    
    if ('success' in txn) {
      console.log("Success:", txn.success);
    }
    
    if ('vm_status' in txn) {
      console.log("VM Status:", txn.vm_status);
    }
    
    if ('events' in txn) {
      console.log("Events:", txn.events);
    }
    
    if ('gas_used' in txn) {
      console.log("Gas used:", txn.gas_used);
    }
    
    console.log("==== End Debug Info ====");
  } catch (error) {
    console.error("Error debugging transaction:", error);
  }
};

// Enhanced debugging utility for transaction issues
export const debugTransactionWithDetails = async (
  client: AptosClient,
  txHash: string
): Promise<{
  status: string;
  success?: boolean;
  gasUsed?: string;
  events?: any[];
  vmStatus?: string;
  errorDetails?: string;
}> => {
  try {
    console.log(`==== Enhanced Transaction Debug for ${txHash} ====`);
    
    // Get transaction info
    const txn = await client.getTransactionByHash(txHash);
    console.log(`Transaction type: ${txn.type}`);
    
    const result: any = {
      status: "unknown",
    };
    
    if ('success' in txn) {
      console.log(`Success: ${txn.success}`);
      result.success = txn.success;
      result.status = txn.success ? "success" : "failed";
    }
    
    if ('vm_status' in txn) {
      console.log(`VM Status: ${txn.vm_status}`);
      result.vmStatus = txn.vm_status;
      
      // Parse VM status for more details
      if (txn.vm_status && typeof txn.vm_status === 'string') {
        const vmStatus = txn.vm_status;
        
        // Extract specific error patterns
        if (vmStatus.includes('RESOURCE_ALREADY_EXISTS')) {
          result.errorDetails = "Resource already exists";
        } else if (vmStatus.includes('SEQUENCE_NUMBER_TOO_OLD')) {
          result.errorDetails = "Transaction sequence number is too old";
        } else if (vmStatus.includes('SEQUENCE_NUMBER_TOO_NEW')) {
          result.errorDetails = "Transaction sequence number is too new";
        } else if (vmStatus.includes('OUT_OF_GAS')) {
          result.errorDetails = "Transaction ran out of gas";
        } else if (vmStatus.includes('EXECUTION_FAILURE')) {
          result.errorDetails = "Execution failed at the VM level";
        }
      }
    }
    
    if ('gas_used' in txn) {
      console.log(`Gas used: ${txn.gas_used}`);
      result.gasUsed = txn.gas_used;
    }
    
    if ('events' in txn && Array.isArray(txn.events)) {
      console.log(`Events (${txn.events.length}):`);
      if (txn.events.length > 0) {
        txn.events.forEach((event, i) => {
          console.log(`Event ${i + 1}:`, JSON.stringify(event, null, 2));
        });
      } else {
        console.log("No events found");
      }
      result.events = txn.events;
    }
    
    // Get account resources if we know the affected address
    let accountAddress = '';
    if ('sender' in txn) {
      accountAddress = txn.sender;
    }
    
    if (accountAddress) {
      try {
        console.log(`Checking account resources for ${accountAddress}...`);
        const resources = await client.getAccountResources(accountAddress);
        console.log(`Account has ${resources.length} resources`);
      } catch (resourceError) {
        console.error("Error fetching account resources:", resourceError);
      }
    }
    
    console.log("==== End Enhanced Debug Info ====");
    return result;
  } catch (error) {
    console.error("Error debugging transaction:", error);
    return {
      status: "error", 
      errorDetails: `Failed to debug: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 