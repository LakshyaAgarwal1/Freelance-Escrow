# System Architecture: Freelance Escrow Platform

## 1. Overview
Freelance Escrow is a decentralized Web3 payment assurance application built to eliminate payment uncertainty, defaults, and disputes in freelance engagements. The architecture is segregated into three distinct tiers:

1. **Decentralized Settlement Layer (Smart Contracts)**: The immutable authority for escrow deposits, milestone states, payout execution, and dispute resolution.
2. **Metadata & Off-Chain Coordination Layer (Django REST Framework)**: Manages non-financial metadata, user profiles, deliverable evidence links, cryptographic nonces, and blockchain event indexing.
3. **Client Interface Layer (React + Vite + Ethers v6)**: A responsive fintech-styled Web3 application connecting client, freelancer, and arbitrator wallets directly to the blockchain and backend APIs.

---

## 2. Tiered System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client (React + Vite + TypeScript)"]
        UI["Web3 UI (Tailwind CSS)"]
        CTX["Web3Context (MetaMask / Ethers v6)"]
        HOOK["useEscrowAgreements Hook"]
        UI --> CTX
        UI --> HOOK
    end

    subgraph BlockchainLayer["Blockchain Network (EVM / Hardhat Cancun)"]
        SC["FreelanceEscrow.sol"]
        STATE[("On-Chain State: Balance, Milestones, States")]
        EV["Event Logs (MilestoneApproved, Disputed, etc.)"]
        SC --> STATE
        SC --> EV
    end

    subgraph BackendLayer["Backend System (Django 5 + DRF)"]
        API["REST API Views"]
        AUTH["EIP-191 Auth (Recover Personal Sign)"]
        DB[("Database (SQLite / PostgreSQL)")]
        API --> DB
        AUTH --> DB
    end

    CTX -- "Transaction (Deposit, Release, Dispute)" --> SC
    SC -- "Read Balances & Milestones" --> HOOK
    CTX -- "EIP-191 Signed Nonce" --> AUTH
    UI -- "Off-chain metadata, titles, descriptions" --> API
```

---

## 3. Data Flow Sequences

### A. Agreement Creation & Funding Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Frontend
    participant DjangoAPI
    participant SmartContract
    actor Freelancer

    Client->>Frontend: Fill agreement details & milestones
    Frontend->>Frontend: Calculate Keccak-256 terms hash
    Frontend->>DjangoAPI: Save Agreement Metadata (title, description, criteria)
    Client->>Frontend: Confirm "Create & Fund" transaction
    Frontend->>SmartContract: createAndFundAgreement(freelancer, arbitrator, termsHash, deadlines, ...) [ETH attached]
    SmartContract-->>SmartContract: Validate sum == msg.value, emit AgreementCreated & AgreementFunded
    Freelancer->>Frontend: Check dashboard -> Verifies funds locked in contract
```

### B. Milestone Delivery & Approval Flow
```mermaid
sequenceDiagram
    autonumber
    actor Freelancer
    participant Frontend
    participant SmartContract
    actor Client

    Freelancer->>Frontend: Enter submission reference (IPFS CID / URL)
    Freelancer->>SmartContract: submitMilestone(agreementId, milestoneIndex, ref)
    SmartContract-->>SmartContract: Set milestone status to Submitted, Agreement to InProgress
    Client->>Frontend: Reviews deliverable in Client Approvals queue
    Client->>SmartContract: approveMilestone(agreementId, milestoneIndex)
    SmartContract-->>SmartContract: Reentrancy check, decrement balance, transfer ETH to Freelancer
    SmartContract-->>Freelancer: ETH transferred directly to freelancer address
```

### C. Dispute & Settlement Flow
```mermaid
sequenceDiagram
    autonumber
    actor ClientOrFreelancer as Client / Freelancer
    participant SmartContract
    actor Arbitrator

    ClientOrFreelancer->>SmartContract: raiseDispute(agreementId, milestoneIndex, reason)
    SmartContract-->>SmartContract: Freeze remaining escrow funds, Agreement state = Disputed
    Arbitrator->>SmartContract: resolveDispute(agreementId, clientRefund, freelancerPayout, rationale)
    SmartContract-->>SmartContract: Validate (clientRefund + freelancerPayout == frozenBalance)
    SmartContract-->>ClientOrFreelancer: Disburse split funds
```
