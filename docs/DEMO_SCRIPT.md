# Demonstration Script: Freelance Escrow Platform

This script provides step-by-step instructions for demonstrating the platform to examiners, academic reviewers, or clients.

---

## Prerequisites Setup

1. **Terminal 1: Start Hardhat Local Blockchain Node**
   ```bash
   cd contracts
   npx hardhat node
   ```
   *Note: This will output 20 local test accounts with 10,000 ETH each.*

2. **Terminal 2: Deploy Escrow Smart Contract**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.ts --network localhost
   ```

3. **Terminal 3: Start Django Backend API**
   ```bash
   cd backend
   $env:PYTHONPATH="C:\Users\ESHA\OneDrive\Desktop\Freelance Escrow\backend\venv\Lib\site-packages"
   python manage.py runserver 8000
   ```

4. **Terminal 4: Start Frontend Vite Server**
   ```bash
   cd frontend
   npm run dev
   ```
   *Open browser at `http://localhost:5173`.*

5. **MetaMask Configuration**:
   - Add Network: **Hardhat Localhost**
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `31337`
     - Currency Symbol: `ETH`
   - Import Account #0 (Client): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Import Account #1 (Freelancer): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Import Account #2 (Arbitrator): `0x5de4111afa1a4b94908f83103eb2f95402a46f29d1b0f901b6a2a0470e562312`

---

## Live Demonstration Flow

### Scenario 1: Agreement Creation & Atomic Escrow Funding
1. Connect MetaMask using **Account #0** (Client).
2. Navigate to **New Agreement** (`/create`).
3. Set Freelancer Address to Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
4. Enter Scope & Acceptance Criteria. Notice the **live Keccak-256 terms hash** calculation.
5. Define 2 Milestones:
   - Milestone 1: 0.5 ETH
   - Milestone 2: 1.0 ETH
6. Click **Create & Lock 1.500 ETH in Escrow**.
7. Confirm MetaMask transaction.
8. The page automatically redirects to the new Agreement Detail. Notice the status badge reads **Funded (Ready)** and Escrow Balance shows **1.5 ETH**.

### Scenario 2: Work Submission by Freelancer
1. Switch MetaMask wallet to **Account #1** (Freelancer).
2. Refresh or navigate to **Freelancer Hub** (`/freelancer`).
3. Open the agreement and click **Submit Deliverable** on Milestone 1.
4. Input evidence reference: `ipfs://bafybeigprototype1` and click Confirm.
5. Sign transaction in MetaMask.
6. The status shifts to **Submitted (In Review)** and agreement shifts to **In Progress**.

### Scenario 3: Client Verification & Milestone Payout Release
1. Switch MetaMask wallet back to **Account #0** (Client).
2. Navigate to **Client Reviews** (`/client`).
3. The deliverable appears in the review queue.
4. Click **Inspect & Approve**.
5. Click **Approve & Release 0.5 ETH**.
6. Sign transaction in MetaMask.
7. Observe that 0.5 ETH was automatically deducted from contract escrow balance and transferred instantly to the Freelancer wallet!

### Scenario 4: Contested Milestone & Arbitrator Ruling
1. On Milestone 2, click the **Warning Icon (Dispute)**.
2. Enter dispute reason: "Deliverable code does not satisfy specifications."
3. Confirm transaction. Remaining 1.0 ETH becomes **Frozen**; agreement state becomes **Disputed**.
4. Switch MetaMask to **Account #2** (Arbitrator).
5. Open Dispute Center (`/disputes`) or open the agreement.
6. Click **Issue Arbitrator Ruling**.
7. Allocate ruling: Client Refund 0.4 ETH, Freelancer Payment 0.6 ETH (Sum = 1.0 ETH).
8. Click **Execute Smart Contract Ruling**.
9. Sign transaction in MetaMask. The funds are immediately distributed to both parties and dispute is marked resolved.
