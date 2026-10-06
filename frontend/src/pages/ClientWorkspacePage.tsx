import React from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { useEscrowAgreements } from "../hooks/useEscrowAgreements";
import { MilestoneState } from "../contracts/escrowContract";
import { StatusBadge } from "../components/StatusBadge";
import {
  CheckSquare,
  AlertCircle,
  Clock,
  ArrowRight,
  Wallet,
  PlusCircle,
} from "lucide-react";

export const ClientWorkspacePage: React.FC = () => {
  const { account, connectWallet } = useWeb3();
  const { agreements, loading } = useEscrowAgreements();

  const myClientAgreements = agreements.filter(
    (a) => account && a.client.toLowerCase() === account.toLowerCase()
  );

  // Pending reviews
  const pendingReviewMilestones: { agreementId: bigint; milestoneIndex: number; title: string; amount: bigint }[] = [];
  myClientAgreements.forEach((ag) => {
    ag.milestones?.forEach((ms, idx) => {
      if (ms.state === MilestoneState.Submitted) {
        pendingReviewMilestones.push({
          agreementId: ag.id,
          milestoneIndex: idx,
          title: ms.title,
          amount: ms.amount,
        });
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-sky-400" /> Client Review & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review submitted work, verify against acceptance criteria, and authorize cryptographic payment releases
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow"
        >
          <PlusCircle className="w-4 h-4" /> New Agreement
        </Link>
      </div>

      {/* Review Queue Alerts */}
      {pendingReviewMilestones.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-amber-950/30 border border-amber-800/60">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300">
              {pendingReviewMilestones.length} Deliverable(s) Awaiting Your Review
            </h2>
          </div>

          <div className="space-y-3">
            {pendingReviewMilestones.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono text-sky-400 font-semibold">
                    Agreement #{item.agreementId.toString()}
                  </span>
                  <p className="text-white font-medium mt-0.5">{item.title}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-white">
                    {ethers.formatEther(item.amount)} ETH
                  </span>
                  <Link
                    to={`/agreements/${item.agreementId.toString()}`}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                  >
                    Inspect & Approve
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Client Projects */}
      <div className="space-y-4">
        {myClientAgreements.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl text-center border-slate-800">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">No Client Contracts Created</h3>
            <p className="text-xs text-slate-400 mb-4">
              You haven't initiated any agreements yet. Create your first contract to lock funds and hire freelancers safely.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" /> Create Agreement
            </Link>
          </div>
        ) : (
          myClientAgreements.map((ag) => (
            <div
              key={ag.id.toString()}
              className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                    Agreement #{ag.id.toString()}
                  </span>
                  <StatusBadge state={ag.state} />
                </div>
                <div className="text-xs text-slate-400">
                  Freelancer: <span className="font-mono text-slate-300">{ag.freelancer}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span>
                    Total Escrow:{" "}
                    <strong className="font-mono text-white">{ethers.formatEther(ag.totalAmount)} ETH</strong>
                  </span>
                  <span>
                    Remaining Balance:{" "}
                    <strong className="font-mono text-emerald-300">{ethers.formatEther(ag.balance)} ETH</strong>
                  </span>
                </div>
              </div>

              <Link
                to={`/agreements/${ag.id.toString()}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-semibold"
              >
                Manage Agreement <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
