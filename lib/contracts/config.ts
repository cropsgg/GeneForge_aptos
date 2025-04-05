// Contract configuration
export const CONTRACT_ADDRESS = '0x08e845d10bbb594fcffceb36d934a188bb84d9cdf7362e4e2522265b185127cb';
export const APTOS_NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const APTOS_FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';

// Module names
export const MODULE_NAMES = {
  SAMPLE_PROVENANCE: 'SampleProvenance',
  EXPERIMENTAL_DATA: 'ExperimentalDataAuditTrail',
  ACCESS_CONTROL: 'AccessControlPermission',
  WORKFLOW_AUTOMATION: 'WorkflowAutomationCompliance',
  INTELLECTUAL_PROPERTY: 'IntellectualPropertyAttribution',
};

// Functions
export const FUNCTIONS = {
  // Sample Provenance
  INITIALIZE_SAMPLE_REGISTRY: 'initialize_registry',
  REGISTER_SAMPLE: 'register_sample',
  RECORD_TRANSFER: 'record_transfer',
  
  // Experimental Data
  INITIALIZE_DATA_REGISTRY: 'initialize_data_registry',
  SUBMIT_EXPERIMENT: 'submit_experiment',
  UPDATE_EXPERIMENT: 'update_experiment',
  
  // Access Control
  INITIALIZE_PERMISSION_REGISTRY: 'initialize_permission_registry',
  GRANT_PERMISSION: 'grant_permission',
  
  // Workflow Automation
  INITIALIZE_WORKFLOW_REGISTRY: 'initialize_workflow_registry',
  CREATE_TASK: 'create_task',
  UPDATE_TASK_STATUS: 'update_task_status',
  
  // Intellectual Property
  INITIALIZE_IP_REGISTRY: 'initialize_ip_registry',
  REGISTER_CONTRIBUTION: 'register_contribution',
}; 