import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { AgreementData, MilestoneData, AgreementState, MilestoneState } from "../contracts/escrowContract";
import { StatusBadge } from "../components/StatusBadge";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  Check,
  Scale,
  XCircle,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";

export const AgreementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { contract, account, connectWallet } = useWeb3();

  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [submissionModal, setSubmissionModal] = useState<{ open: boolean; milestoneIndex: number }>({
    open: false,
    milestoneIndex: 0,
  });
  const [evidenceInput, setEvidenceInput] = useState<string>("");

  const [disputeModal, setDisputeModal] = useState<{ open: boolean; milestoneIndex: number }>({
    open: false,
    milestoneIndex: 0,
  });
  const [disputeReasonInput, setDisputeReasonInput] = useState<string>("");

  const [resolveModal, setResolveModal] = useState<boolean>(false);
  const [clientRefundInput, setClientRefundInput] = useState<string>("0");
  const [freelancerPayoutInput, setFreelancerPayoutInput] = useState<string>("0");
  const [rulingDetailsInput, setRulingDetailsInput] = useState<string>("");

  const loadAgreementData = useCallback(async () => {
    if (!contract || !id) return;
    try {
      setLoading(true);
      setErrorMessage(null);

      const rawAg = await contract.getAgreement(id);
      const rawMs = await contract.getMilestones(id);

      const milestones: MilestoneData[] = rawMs.map((m: any) => ({
        title: m.title,
        amount: m.amount,
        deadline: m.deadline,
        state: Number(m.state),
        submissionReference: m.submissionReference,
        submittedAt: m.submittedAt,
        approvedAt: m.approvedAt,
      }));

      setAgreement({
        id: rawAg.id,
        client: rawAg.client,
        freelancer: rawAg.freelancer,
        arbitrator: rawAg.arbitrator,
        termsHash: rawAg.termsHash,
        totalAmount: rawAg.totalAmount,
        balance: rawAg.balance,
        totalPaid: rawAg.totalPaid,
        totalRefunded: rawAg.totalRefunded,
        createdAt: rawAg.createdAt,
        deadline: rawAg.deadline,
        state: Number(rawAg.state),
        isDisputed: rawAg.isDisputed,
        disputeInitiator: rawAg.disputeInitiator,
        disputeReason: rawAg.disputeReason,
        disputedMilestoneIndex: rawAg.disputedMilestoneIndex,
        milestones,
      });

      // Default split in resolve modal
      const balEth = ethers.formatEther(rawAg.balance);
      setClientRefundInput((parseFloat(balEth) / 2).toFixed(3));
      setFreelancerPayoutInput((parseFloat(balEth) / 2).toFixed(3));
    } catch (err: any) {
      console.error("Error loading agreement detail:", err);
      setErrorMessage(err?.message || "Failed to load agreement from smart contract.");
    } finally {
      setLoading(false);
    }
  }, [contract, id]);

  useEffect(() => {
    loadAgreementData();
  }, [loadAgreementData]);

  // Role Checks
  const isClient = account && agreement && account.toLowerCase() === agreement.client.toLowerCase();
  const isFreelancer = account && agreement && account.toLowerCase() === agreement.freelancer.toLowerCase();
  const isArbitrator = account && agreement && account.toLowerCase() === agreement.arbitrator.toLowerCase();

  // Handlers
  const handleFund = async () => {
    if (!contract || !agreement) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const tx = await contract.fundAgreement(agreement.id, { value: agreement.totalAmount });
      await tx.wait();
      setSuccessMessage("Escrow funded successfully!");
      loadAgreementData();
    } catch (err: any) {
      console.error("Fund error:", err);
      setErrorMessage(err?.reason || err?.message || "Funding failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMilestone = async () => {
    if (!contract || !agreement || !evidenceInput) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const tx = await contract.submitMilestone(agreement.id, submissionModal.milestoneIndex, evidenceInput);
      await tx.wait();
      setSuccessMessage("Milestone evidence submitted successfully!");
      setSubmissionModal({ open: false, milestoneIndex: 0 });
      setEvidenceInput("");
      loadAgreementData();
    } catch (err: any) {
      console.error("Submit error:", err);
      setErrorMessage(err?.reason || err?.message || "Milestone submission failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneIndex: number) => {
    if (!contract || !agreement) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const tx = await contract.approveMilestone(agreement.id, milestoneIndex);
      await tx.wait();
      setSuccessMessage("Milestone approved and payment released to freelancer!");
      loadAgreementData();
    } catch (err: any) {
      console.error("Approve error:", err);
      setErrorMessage(err?.reason || err?.message || "Milestone approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!contract || !agreement || !disputeReasonInput) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const tx = await contract.raiseDispute(agreement.id, disputeModal.milestoneIndex, disputeReasonInput);
      await tx.wait();
      setSuccessMessage("Dispute opened. Funds are locked pending arbitrator ruling.");
      setDisputeModal({ open: false, milestoneIndex: 0 });
      setDisputeReasonInput("");
      loadAgreementData();
    } catch (err: any) {
      console.error("Dispute error:", err);
      setErrorMessage(err?.reason || err?.message || "Failed to raise dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!contract || !agreement) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const clientWei = ethers.parseEther(clientRefundInput);
      const freelancerWei = ethers.parseEther(freelancerPayoutInput);

      const tx = await contract.resolveDispute(
        agreement.id,
        clientWei,
        freelancerWei,
        rulingDetailsInput || "Arbitrator decision executed."
      );
      await tx.wait();
      setSuccessMessage("Dispute resolved and funds distributed according to ruling.");
      setResolveModal(false);
      loadAgreementData();
    } catch (err: any) {
      console.error("Resolution error:", err);
      setErrorMessage(err?.reason || err?.message || "Dispute resolution failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAgreement = async () => {
    if (!contract || !agreement) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const tx = await contract.cancelAgreement(agreement.id);
      await tx.wait();
      setSuccessMessage("Agreement cancelled.");
      loadAgreementData();
    } catch (err: any) {
      console.error("Cancel error:", err);
      setErrorMessage(err?.reason || err?.message || "Failed to cancel agreement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimTimeoutRefund = async () => {
    if (!contract || !agreement) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const tx = await contract.claimTimeoutRefund(agreement.id);
      await tx.wait();
      setSuccessMessage("Timeout refund claimed successfully.");
      loadAgreementData();
    } catch (err: any) {
      console.error("Refund error:", err);
      setErrorMessage(err?.reason || err?.message || "Failed to claim timeout refund");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Querying smart contract agreement #{id}...</p>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Agreement Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">
          Could not find agreement #{id} on the connected smart contract.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-sky-400 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <button
          onClick={loadAgreementData}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Banner Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Overview Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border-slate-800 mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">Agreement #{agreement.id.toString()}</h1>
              <StatusBadge state={agreement.state} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on: {new Date(Number(agreement.createdAt) * 1000).toLocaleString()}
            </p>
          </div>

          {/* User Role Badge */}
          <div className="flex items-center gap-2">
            {isClient && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                You are the Client
              </span>
            )}
            {isFreelancer && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-950 text-teal-400 border border-teal-800">
                You are the Freelancer
              </span>
            )}
            {isArbitrator && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                You are the Designated Arbitrator
              </span>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Total Agreed Value</span>
            <span className="text-xl font-bold font-mono text-white">
              {ethers.formatEther(agreement.totalAmount)} <span className="text-xs text-sky-400">ETH</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Escrow Balance (Locked)</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {ethers.formatEther(agreement.balance)} <span className="text-xs text-slate-400">ETH</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Paid to Freelancer</span>
            <span className="text-xl font-bold font-mono text-slate-200">
              {ethers.formatEther(agreement.totalPaid)} <span className="text-xs text-slate-400">ETH</span>
            </span>
          </div>
        </div>

        {/* Parties & Terms Hash */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-slate-500 block">Client Address:</span>
              <span className="font-mono text-slate-300 break-all select-all">{agreement.client}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Freelancer Address:</span>
              <span className="font-mono text-slate-300 break-all select-all">{agreement.freelancer}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-500 block">Arbitrator Address:</span>
              <span className="font-mono text-slate-300 break-all select-all">{agreement.arbitrator}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Cryptographic Terms Hash (Keccak-256):</span>
              <span className="font-mono text-sky-300 break-all select-all">{agreement.termsHash}</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar for Agreement-Level actions */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
          {/* Fund button if created */}
          {isClient && agreement.state === AgreementState.Created && (
            <button
              onClick={handleFund}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow disabled:opacity-50"
            >
              <Lock className="w-4 h-4" /> Deposit {ethers.formatEther(agreement.totalAmount)} ETH into Escrow
            </button>
          )}

          {/* Cancel button if un-funded */}
          {isClient && agreement.state === AgreementState.Created && (
            <button
              onClick={handleCancelAgreement}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs"
            >
              Cancel Agreement
            </button>
          )}

          {/* Arbitrator Resolve button if Disputed */}
          {isArbitrator && agreement.state === AgreementState.Disputed && (
            <button
              onClick={() => setResolveModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-glow"
            >
              <Scale className="w-4 h-4" /> Issue Arbitrator Ruling
            </button>
          )}

          {/* Timeout refund for client if deadline passed */}
          {isClient &&
            (agreement.state === AgreementState.Funded || agreement.state === AgreementState.InProgress) && (
              <button
                onClick={handleClaimTimeoutRefund}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs"
              >
                Claim Timeout Refund (If Expired)
              </button>
            )}
        </div>
      </div>

      {/* Dispute Notice if active */}
      {agreement.isDisputed && (
        <div className="mb-8 p-6 rounded-2xl bg-rose-950/30 border border-rose-800/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-300">Active Dispute Under Arbitration</h3>
              <p className="text-xs text-rose-200/80 mt-1">
                <strong>Reason:</strong> {agreement.disputeReason}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Initiated by: {agreement.disputeInitiator} | Arbitrator: {agreement.arbitrator}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Timeline */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border-slate-800">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          Milestone Progression & Escrow Releases
        </h2>

        <div className="space-y-6">
          {agreement.milestones?.map((ms, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs"
            >
              {/* Left Info */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-mono font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">{ms.title}</h3>
                  <StatusBadge state={ms.state} isMilestone />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-slate-400">
                  <div>
                    Amount:{" "}
                    <span className="font-mono text-white font-semibold">{ethers.formatEther(ms.amount)} ETH</span>
                  </div>
                  <div>
                    Deadline:{" "}
                    <span className="text-slate-300">
                      {new Date(Number(ms.deadline) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Evidence link if submitted */}
                {ms.submissionReference && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 break-all flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Evidence / Deliverable: {ms.submissionReference}</span>
                  </div>
                )}
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                {/* Freelancer submit work */}
                {isFreelancer &&
                  (ms.state === MilestoneState.Pending || ms.state === MilestoneState.Submitted) &&
                  !agreement.isDisputed && (
                    <button
                      onClick={() => setSubmissionModal({ open: true, milestoneIndex: idx })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Submit Deliverable
                    </button>
                  )}

                {/* Client approve work */}
                {isClient && ms.state === MilestoneState.Submitted && !agreement.isDisputed && (
                  <button
                    onClick={() => handleApproveMilestone(idx)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Release {ethers.formatEther(ms.amount)} ETH
                  </button>
                )}

                {/* Raise dispute */}
                {(isClient || isFreelancer) &&
                  ms.state !== MilestoneState.Approved &&
                  !agreement.isDisputed && (
                    <button
                      onClick={() => setDisputeModal({ open: true, milestoneIndex: idx })}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 transition-colors"
                      title="Raise Dispute"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverable Submission Modal */}
      {submissionModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-teal-400" />
              Submit Milestone Deliverable #{submissionModal.milestoneIndex + 1}
            </h3>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Deliverable Reference (IPFS CID, GitHub PR URL, or Storage Link)
              </label>
              <input
                type="text"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="ipfs://bafybeig... or https://github.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSubmissionModal({ open: false, milestoneIndex: 0 })}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMilestone}
                disabled={actionLoading || !evidenceInput}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal */}
      {disputeModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-rose-900/60 space-y-4">
            <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Raise Formal Dispute on Milestone #{disputeModal.milestoneIndex + 1}
            </h3>

            <p className="text-xs text-slate-300">
              Opening a dispute will freeze remaining escrow funds. The designated arbitrator will be tasked to review
              deliverables and distribute funds fairly.
            </p>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Detailed Reason for Dispute</label>
              <textarea
                rows={3}
                value={disputeReasonInput}
                onChange={(e) => setDisputeReasonInput(e.target.value)}
                placeholder="Describe why acceptance criteria were not met or why payment was unfairly withheld..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDisputeModal({ open: false, milestoneIndex: 0 })}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDispute}
                disabled={actionLoading || !disputeReasonInput}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Freeze Funds & Raise Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arbitrator Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-amber-900/60 space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              Arbitrator Dispute Settlement Panel
            </h3>

            <p className="text-xs text-slate-300">
              Total frozen escrow balance:{" "}
              <strong className="text-white font-mono">{ethers.formatEther(agreement.balance)} ETH</strong>.
              Your ruling must allocate exactly 100% of this amount between the client and freelancer.
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Refund to Client (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={clientRefundInput}
                  onChange={(e) => setClientRefundInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Payout to Freelancer (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={freelancerPayoutInput}
                  onChange={(e) => setFreelancerPayoutInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Ruling Rationale / Decision Notes</label>
              <textarea
                rows={2}
                value={rulingDetailsInput}
                onChange={(e) => setRulingDetailsInput(e.target.value)}
                placeholder="State the justification for this allocation..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResolveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Execute Smart Contract Ruling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
