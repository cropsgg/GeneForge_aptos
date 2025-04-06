export interface Sample {
  id: number;
  description: string;
  owner: string;
  timestamp: number;
  history: SampleHistoryEvent[];
}

export interface SampleHistoryEvent {
  event_type: string;
  operator: string;
  timestamp: number;
  details: string;
}

export interface ExperimentalData {
  id: number;
  hash: string;
  description: string;
  experimentId: string;
  dataType: string;
  version: string;
  creator: string;
  timestamp: number;
  history: DataUpdate[];
}

export interface DataUpdate {
  event: string;
  operator: string;
  timestamp: number;
}

export interface Permission {
  user: string;
  resource_id: number;
  level: number;
  granted_at: number;
  granted_by: string;
}

export interface WorkflowTask {
  id: number;
  description: string;
  owner: string;
  status: string;
  timestamp: number;
}

export interface WorkflowStatus {
  status: string;
  operator: string;
  timestamp: number;
}

export interface IntellectualProperty {
  id: number;
  title: string;
  description: string;
  content_hash: string;
  owner: string;
  timestamp: number;
}

// Transaction-related types
export interface TransactionPayload {
  function: string;
  type_arguments: string[];
  arguments: any[];
}

export interface TransactionResult {
  hash: string;
  success?: boolean;
  vm_status?: string;
}

// Wallet-related types
export interface WalletAccount {
  address: string;
  publicKey?: string;
}

export type WalletProvider = 'petra' | 'martian' | 'pontem' | 'other';