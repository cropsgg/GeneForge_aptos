export interface Sample {
  id: string;
  description: string;
  collectionTime: string;
  origin: string;
  currentOwner: string;
  history: SampleHistoryEvent[];
}

export interface SampleHistoryEvent {
  timestamp: string;
  action: string;
  operator: string;
  details: string;
}

export interface ExperimentalData {
  id: string;
  dataHash: string;
  version: number;
  timestamp: string;
  creator: string;
  description: string;
  updates: DataUpdate[];
}

export interface DataUpdate {
  version: number;
  timestamp: string;
  updater: string;
  description: string;
  previousHash: string;
  newHash: string;
}

export interface Permission {
  resourceId: string;
  userId: string;
  accessLevel: 'read' | 'write' | 'admin';
  grantedBy: string;
  grantedAt: string;
}

export interface WorkflowTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  creator: string;
  assignee: string;
  createdAt: string;
  approvals: Approval[];
}

export interface Approval {
  approver: string;
  timestamp: string;
  status: 'approved' | 'rejected';
  comments: string;
}

export interface IntellectualProperty {
  id: string;
  title: string;
  description: string;
  contributors: Contributor[];
  timestamp: string;
  hash: string;
}

export interface Contributor {
  address: string;
  role: string;
  contribution: string;
  timestamp: string;
}