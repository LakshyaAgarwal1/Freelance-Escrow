# Freelance Escrow — Blockchain-Based Payment Assurance Platform

A complete, production-minded Web3 freelance payment assurance platform. Combines milestone-based Ethereum smart contracts, cryptographic terms hashing, a Django REST Framework backend, and a modern React + Vite + Tailwind CSS frontend.

---

## 🚀 Key Features

- **Non-Custodial Escrow**: Funds are locked in verifiable smart contracts on-chain before work begins. Neither party nor the platform can arbitrarily seize locked funds.
- **Milestone-Based Releases**: Granular approval of individual project milestones. Releasing payment transfers funds directly to the freelancer's wallet.
- **Cryptographic Terms Anchoring**: Contract terms and acceptance criteria are hashed using Keccak-256 and anchored permanently on-chain.
- **Deterministic Dispute Resolution**: Permitted disputes freeze remaining escrow funds. An authorized arbitrator executes rulings enforcing that client refund + freelancer payout equals 100% of the frozen balance.
- **Timeout Refund Protection**: Clients can claim a full refund if agreed deadlines pass with no milestone delivery.
- **EIP-191 Cryptographic Authentication**: Django backend uses challenge nonces and `personal_sign` signature recovery with replay protection.
- **High-Fidelity Fintech UI**: Dark-mode glassmorphic theme with real-time status badges, transaction lifecycles, and dedicated Client & Freelancer workspaces.

---

## 📁 Repository Structure

```plaintext
Freelance Escrow/
├── contracts/             # Solidity 0.8.24, Hardhat, OpenZeppelin, Test Suite
│   ├── contracts/         # FreelanceEscrow.sol
│   ├── test/              # FreelanceEscrow.test.ts (17 passing tests)
│   └── scripts/           # deploy.ts
├── backend/               # Django 5 + Django REST Framework API
│   ├── config/            # Settings, URLs, WSGI
│   ├── core/              # Models, Serializers, Views, EIP-191 Auth, Tests
│   └── requirements.txt
├── frontend/              # React 18, Vite, TypeScript, Tailwind CSS, Ethers v6
│   ├── src/               # Pages, Contexts, Hooks, Components
│   └── index.html
└── docs/                  # Academic Documentation & Walkthroughs
    ├── ARCHITECTURE.md    # Architecture & Sequence Diagrams
    ├── STATE_MACHINE.md   # State Transitions & Dispute Invariants
    ├── DEMO_SCRIPT.md     # Step-by-step Examiner Demonstration Script
    └── REPORT_OUTLINE.md  # Final-Year Engineering Report Outline
```

---

## ⚡ Quickstart & Execution Guide

### 1. Smart Contracts & Local Blockchain

```bash
cd contracts
npm install
# Run the 17 automated tests
npx hardhat test

# Start the local Hardhat blockchain node
npx hardhat node

# In a separate terminal, deploy the contract to localhost
npx hardhat run scripts/deploy.ts --network localhost
```

### 2. Django Backend

```bash
cd backend

# Activate virtual environment or set PYTHONPATH
$env:PYTHONPATH="C:\Users\ESHA\OneDrive\Desktop\Freelance Escrow\backend\venv\Lib\site-packages"

# Run database migrations
python manage.py migrate

# Run automated backend test suite
python manage.py test

# Start the API server
python manage.py runserver 8000
```

### 3. Frontend Web Application

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Test Verification

### Smart Contract Test Suite (`contracts/test/FreelanceEscrow.test.ts`)
```plaintext
  FreelanceEscrow Smart Contract Suite
    1. Agreement Creation & Funding Lifecycle
      ✔ Should allow a client to create an agreement with defined milestones
      ✔ Should allow client to fund an agreement with exact ETH
      ✔ Should support atomic createAndFundAgreement in a single transaction
      ✔ Should reject funding with insufficient or excess ETH
    2. Work Submission and Milestone Approval
      ✔ Should allow freelancer to submit milestone evidence and transition state to InProgress
      ✔ Should release payment to freelancer upon client milestone approval
      ✔ Should transition agreement to Completed when all milestones are approved
    3. Access Control & Authorization Safeguards
      ✔ Should reject milestone submission from strangers or client
      ✔ Should reject milestone approval from non-client accounts
      ✔ Should reject approval of milestone that has not been submitted yet
    4. Dispute Handling & Arbitrator Resolution
      ✔ Should allow client or freelancer to raise a dispute
      ✔ Should freeze milestone actions while a dispute is active
      ✔ Should prevent non-arbitrator from executing dispute ruling
      ✔ Should enforce that settlement amounts equal total frozen escrow balance
      ✔ Should execute arbitrator ruling and distribute funds to client and freelancer
    5. Refunds & Cancellation Conditions
      ✔ Should allow client to cancel an un-funded agreement
      ✔ Should allow client to claim timeout refund if deadline expired and no work submitted

  17 passing (5s)
```

### Backend Test Suite (`backend/core/tests.py`)
```plaintext
Ran 7 tests in 0.151s
OK (Signature recovery, nonce expiry, replay attack rejection, spoofing protection, metadata)
```

---

## 📖 Academic Documentation

See the `docs/` folder for comprehensive documentation:
- [Architecture Details](docs/ARCHITECTURE.md)
- [State Machine & Dispute Policy](docs/STATE_MACHINE.md)
- [Demonstration Script](docs/DEMO_SCRIPT.md)
- [Final-Year Engineering Thesis Outline](docs/REPORT_OUTLINE.md)
