import EscrowABI from "./FreelanceEscrowABI.json";

// Default localhost contract address deployed on Hardhat node
export const DEFAULT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const FREELANCE_ESCROW_ABI = EscrowABI;

export enum AgreementState {
  Created = 0,
  Funded = 1,
  InProgress = 2,
  Disputed = 3,
  Completed = 4,
  Refunded = 5,
  Cancelled = 6,
}

export enum MilestoneState {
  Pending = 0,
  Submitted = 1,
  Approved = 2,
  Disputed = 3,
  Refunded = 4,
}

export interface MilestoneData {
  title: string;
  amount: bigint;
  deadline: bigint;
  state: MilestoneState;
  submissionReference: string;
  submittedAt: bigint;
  approvedAt: bigint;
}

export interface AgreementData {
  id: bigint;
  client: string;
  freelancer: string;
  arbitrator: string;
  termsHash: string;
  totalAmount: bigint;
  balance: bigint;
  totalPaid: bigint;
  totalRefunded: bigint;
  createdAt: bigint;
  deadline: bigint;
  state: AgreementState;
  isDisputed: boolean;
  disputeInitiator: string;
  disputeReason: string;
  disputedMilestoneIndex: bigint;
  milestones?: MilestoneData[];
}
