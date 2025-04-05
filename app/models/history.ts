export interface TransactionHistoryItem {
  id: string;
  walletAddress: string;
  transactionHash: string;
  timestamp: number;
  status: 'success' | 'pending' | 'error';
  type: 'sample' | 'data' | 'access' | 'workflow' | 'ip';
  title: string;
  description: string;
  details?: Record<string, any>;
}

// Mock data generator for demonstration
export function generateMockHistory(walletAddress: string, count: number = 5): TransactionHistoryItem[] {
  const types: Array<TransactionHistoryItem['type']> = ['sample', 'data', 'access', 'workflow', 'ip'];
  const titles = {
    sample: ['Sample Registration', 'Sample Update', 'Sample Transfer'],
    data: ['Data Submission', 'Data Update', 'Data Verification'],
    access: ['Access Grant', 'Permission Update', 'Access Revocation'],
    workflow: ['Workflow Initiation', 'Approval Step', 'Workflow Completion'],
    ip: ['IP Registration', 'Patent Filing', 'License Grant']
  };
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const titleOptions = titles[type];
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
    
    // Generate transaction within the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000);
    
    // Determine status with correct type
    let status: 'success' | 'pending' | 'error' = 'success';
    const rand = Math.random();
    if (rand > 0.9) {
      status = 'error';
    } else if (rand > 0.8) {
      status = 'pending';
    }
    
    return {
      id: `tx-${Date.now()}-${i}`,
      walletAddress,
      transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      timestamp,
      status,
      type,
      title,
      description: `Transaction for ${type} operation: ${title.toLowerCase()}`,
      details: {
        operationId: `${type}-${Math.floor(Math.random() * 1000)}`,
        gasUsed: Math.floor(Math.random() * 100000),
        blockNumber: Math.floor(Math.random() * 10000000)
      }
    };
  }).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending (newest first)
}

// Get transaction history from localStorage or generate mock data
export function getTransactionHistory(walletAddress: string): TransactionHistoryItem[] {
  if (typeof window === 'undefined' || !walletAddress) return [];
  
  try {
    const storedHistory = localStorage.getItem(`txHistory_${walletAddress}`);
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      // Validate parsed data is an array
      if (!Array.isArray(parsed)) {
        console.error('Invalid history format in localStorage');
        return [];
      }
      return parsed;
    }
    
    // Generate mock data for first-time visitors
    const mockHistory = generateMockHistory(walletAddress);
    saveTransactionHistory(walletAddress, mockHistory);
    return mockHistory;
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
}

// Save transaction history to localStorage
export function saveTransactionHistory(walletAddress: string, history: TransactionHistoryItem[]): void {
  if (typeof window === 'undefined' || !walletAddress) return;
  
  try {
    // Validate input is an array
    if (!Array.isArray(history)) {
      console.error('Cannot save invalid history format');
      return;
    }
    localStorage.setItem(`txHistory_${walletAddress}`, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving transaction history:', error);
  }
}

// Add a new transaction to history
export function addTransaction(
  walletAddress: string, 
  type: TransactionHistoryItem['type'],
  title: string,
  description: string,
  transactionHash: string,
  details?: Record<string, any>
): TransactionHistoryItem {
  if (typeof window === 'undefined' || !walletAddress) {
    throw new Error('Cannot add transaction: Invalid environment or wallet');
  }

  const newTransaction: TransactionHistoryItem = {
    id: `tx-${Date.now()}`,
    walletAddress,
    transactionHash,
    timestamp: Date.now(),
    status: 'success',
    type,
    title,
    description,
    details
  };
  
  try {
    const history = getTransactionHistory(walletAddress);
    const updatedHistory = [newTransaction, ...history];
    saveTransactionHistory(walletAddress, updatedHistory);
  } catch (error) {
    console.error('Error updating transaction history:', error);
  }
  
  return newTransaction;
} 