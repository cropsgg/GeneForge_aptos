# Geneforge CRISPR Cas9 with Aptos Blockchain

This project integrates CRISPR Cas9 gene pattern detection and prediction with Aptos blockchain for secure and transparent data management.

## Project Structure
- **app/**: Next.js app files for the web interface
- **components/**: React components for the UI
- **move/**: Aptos Move smart contracts
  - **sources/**: Contains the five smart contract modules:
    - sample_provenance: Ensures biological sample journey is securely recorded
    - experimental_data_audit_trail: Safeguards experimental data and ensures reproducibility
    - access_control_permission: Manages secure access to sensitive data
    - workflow_automation_compliance: Automates and enforces lab workflow processes
    - intellectual_property_attribution: Secures research contributions and protects IP

## Smart Contract Functionality

### Sample Provenance Contract
- Sample Registration: Log a unique sample ID, collection date, and source
- Chain-of-Custody Tracking: Record each transfer or processing step
- Immutable Audit Trail: Provide a tamper-proof history

### Experimental Data Audit Trail Contract
- Data Submission: Enable lab assistants to submit experimental results
- Data Hashing: Store cryptographic hashes of datasets
- Versioning & Timestamping: Maintain a chronological log of data modifications

### Access Control and Permission Management Contract
- Role Definition: Define roles (lab assistant, researcher, etc.)
- Permission Grants: Allow data owners to grant or revoke access
- Audit Logging: Record all access events

### Workflow Automation and Compliance Contract
- Task Scheduling: Automate approval steps and workflow transitions
- Compliance Checks: Embed regulatory requirements
- Notifications: Trigger alerts and require digital signatures

### Intellectual Property and Attribution Contract
- Contribution Registration: Record details of new gene editing methods
- Time-Stamping & Digital Signatures: Provide proof of innovation
- Licensing & Royalties: Facilitate licensing agreements and track usage

## Development Setup

### Prerequisites
- [Aptos CLI](https://aptos.dev/tools/aptos-cli/install-cli/)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- [Aptos Wallet Extension](https://petra.app/) (Petra, Martian, or Pontem)

### Smart Contract Development
1. Install the Aptos CLI:
   ```bash
   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
   ```

2. Configure your Aptos account:
   ```bash
   aptos init
   ```

3. Compile the Move modules:
   ```bash
   aptos move compile --named-addresses geneforge=default
   ```

4. Test the smart contracts:
   ```bash
   aptos move test --named-addresses geneforge=default
   ```

5. Publish the modules:
   ```bash
   aptos move publish --named-addresses geneforge=default
   ```

### Web Application
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser 