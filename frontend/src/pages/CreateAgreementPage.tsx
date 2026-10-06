import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Hash,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface MilestoneDraft {
  title: string;
  amount: string; // ETH string
  deadlineDays: number;
}

export const CreateAgreementPage: React.FC = () => {
  const { account, contract, connectWallet } = useWeb3();
  const navigate = useNavigate();

  // Form State
  const [freelancerAddress, setFreelancerAddress] = useState<string>("");
  const [arbitratorAddress, setArbitratorAddress] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string>("");

  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: "Milestone 1: Architectural Design & Prototype", amount: "0.5", deadlineDays: 7 },
    { title: "Milestone 2: Final Implementation & Delivery", amount: "1.0", deadlineDays: 14 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute Total
  const totalAmountEth = useMemo(() => {
    return milestones.reduce((acc, m) => {
      const val = parseFloat(m.amount) || 0;
      return acc + val;
    }, 0);
  }, [milestones]);

  // Compute Keccak256 Terms Hash live
  const termsHash = useMemo(() => {
    try {
      const payload = JSON.stringify({
        title,
        description,
        acceptanceCriteria,
        freelancer: freelancerAddress.toLowerCase(),
        milestones: milestones.map((m) => ({ title: m.title, amount: m.amount, days: m.deadlineDays })),
      });
      return ethers.keccak256(ethers.toUtf8Bytes(payload));
    } catch {
      return "0x";
    }
  }, [title, description, acceptanceCriteria, freelancerAddress, milestones]);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}: Deliverable`,
        amount: "0.5",
        deadlineDays: 7 * (milestones.length + 1),
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneDraft, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleCreateAndFund = async (fundImmediately: boolean) => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!contract) {
      setErrorMessage("Escrow contract not connected.");
      return;
    }
    if (!ethers.isAddress(freelancerAddress)) {
      setErrorMessage("Please specify a valid Ethereum wallet address for the freelancer.");
      return;
    }
    if (freelancerAddress.toLowerCase() === account.toLowerCase()) {
      setErrorMessage("Freelancer cannot be the same address as the client.");
      return;
    }
    if (totalAmountEth <= 0) {
      setErrorMessage("Total escrow amount must be greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setTxHash(null);

      const msTitles = milestones.map((m) => m.title);
      const msAmounts = milestones.map((m) => ethers.parseEther(m.amount.toString() || "0"));

      const now = Math.floor(Date.now() / 1000);
      const msDeadlines = milestones.map((m) => BigInt(now + (m.deadlineDays || 7) * 86400));
      const overallDeadline = BigInt(now + Math.max(...milestones.map((m) => m.deadlineDays || 14)) * 86400);

      const arb = arbitratorAddress && ethers.isAddress(arbitratorAddress)
        ? arbitratorAddress
        : ethers.ZeroAddress;

      let tx;
      if (fundImmediately) {
        const totalWei = ethers.parseEther(totalAmountEth.toFixed(6));
        tx = await contract.createAndFundAgreement(
          freelancerAddress,
          arb,
          termsHash,
          overallDeadline,
          msTitles,
          msAmounts,
          msDeadlines,
          { value: totalWei }
        );
      } else {
        tx = await contract.createAgreement(
          freelancerAddress,
          arb,
          termsHash,
          overallDeadline,
          msTitles,
          msAmounts,
          msDeadlines
        );
      }

      setTxHash(tx.hash);
      const receipt = await tx.wait();

      // Find created agreement ID from event
      let createdId = "1";
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "AgreementCreated") {
            createdId = parsed.args[0].toString();
            break;
          }
        } catch {}
      }

      setTimeout(() => {
        navigate(`/agreements/${createdId}`);
      }, 1500);
    } catch (err: any) {
      console.error("Error creating agreement:", err);
      setErrorMessage(err?.reason || err?.message || "Transaction failed or was rejected by user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Escrow Agreement</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Define deliverables, lock payment guarantees, and anchor cryptographic terms on-chain.
        </p>
      </div>

      <div className="space-y-8">
        {/* Step 1: Parties */}
        <section className="glass-panel p-6 rounded-2xl border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 text-xs flex items-center justify-center font-mono">
              1
            </span>
            Contracting Parties
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Client Wallet (You)</label>
              <input
                type="text"
                disabled
                value={account || "Please connect your MetaMask wallet"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-300 select-all"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Freelancer Wallet Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={freelancerAddress}
                onChange={(e) => setFreelancerAddress(e.target.value)}
                placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Designated Arbitrator (Optional — defaults to platform arbitrator)
              </label>
              <input
                type="text"
                value={arbitratorAddress}
                onChange={(e) => setArbitratorAddress(e.target.value)}
                placeholder="0x000... (Leave blank to use default arbitrator)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-400 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Terms and Scope */}
        <section className="glass-panel p-6 rounded-2xl border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 text-xs flex items-center justify-center font-mono">
              2
            </span>
            Project Scope & Acceptance Criteria
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack Escrow Web Application"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Description & Deliverables</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide complete technical scope, deliverable formats, repository access..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Explicit Acceptance Criteria</label>
              <textarea
                rows={2}
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                placeholder="Define verifiable conditions for approval (e.g. 100% test pass rate, clean code, responsive UI)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Generated Terms Hash */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400 font-medium mb-1">
                <Hash className="w-3.5 h-3.5 text-sky-400" />
                <span>Deterministic Cryptographic Terms Hash (Keccak-256):</span>
              </div>
              <div className="font-mono text-[11px] text-sky-300 break-all select-all">{termsHash}</div>
              <p className="text-[10px] text-slate-500 mt-1">
                This hash is permanently anchored into the smart contract state for dispute verification.
              </p>
            </div>
          </div>
        </section>

        {/* Step 3: Milestones Breakdown */}
        <section className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 text-xs flex items-center justify-center font-mono">
                3
              </span>
              Milestone Breakdown & Payment Schedule
            </h2>

            <button
              onClick={addMilestone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((ms, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    value={ms.title}
                    onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                    placeholder="Milestone title"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="w-full sm:w-28 flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    value={ms.amount}
                    onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                    placeholder="ETH"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-right font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-400 font-mono">ETH</span>
                </div>

                <div className="w-full sm:w-28 flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={ms.deadlineDays}
                    onChange={(e) => updateMilestone(idx, "deadlineDays", parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-right font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-400">days</span>
                </div>

                <button
                  onClick={() => removeMilestone(idx)}
                  disabled={milestones.length <= 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Sum Summary */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total Escrow Commitment:</span>
            <span className="font-mono text-base font-bold text-white">
              {totalAmountEth.toFixed(4)} <span className="text-sky-400 text-xs">ETH</span>
            </span>
          </div>
        </section>

        {/* Feedback / Errors */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {txHash && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Transaction confirmed: {txHash.substring(0, 16)}...</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <button
            onClick={() => handleCreateAndFund(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
          >
            Create Agreement Only (Fund Later)
          </button>

          <button
            onClick={() => handleCreateAndFund(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing Transaction...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Create & Lock {totalAmountEth.toFixed(3)} ETH in Escrow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
