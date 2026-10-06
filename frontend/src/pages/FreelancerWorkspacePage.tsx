import React from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { useEscrowAgreements } from "../hooks/useEscrowAgreements";
import { MilestoneState } from "../contracts/escrowContract";
import { StatusBadge } from "../components/StatusBadge";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wallet,
  Sparkles,
} from "lucide-react";

export const FreelancerWorkspacePage: React.FC = () => {
  const { account, connectWallet } = useWeb3();
  const { agreements, loading } = useEscrowAgreements();

  const myFreelanceAgreements = agreements.filter(
    (a) => account && a.freelancer.toLowerCase() === account.toLowerCase()
  );

  const totalEarnedWei = myFreelanceAgreements.reduce((acc, a) => acc + a.totalPaid, 0n);
  const totalPendingWei = myFreelanceAgreements.reduce((acc, a) => acc + a.balance, 0n);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-teal-400" /> Freelancer Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deliver verified milestones, track approvals, and receive guaranteed smart contract payouts
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Earnings Received</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {ethers.formatEther(totalEarnedWei)} <span className="text-sm">ETH</span>
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Directly transferred to your wallet</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Escrow Funds Reserved for You</span>
          <span className="text-2xl font-bold font-mono text-teal-400">
            {ethers.formatEther(totalPendingWei)} <span className="text-sm">ETH</span>
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Locked in contract awaiting milestone approval</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Active Contracts</span>
          <span className="text-2xl font-bold font-mono text-white">{myFreelanceAgreements.length}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Where you are the designated freelancer</span>
        </div>
      </div>

      {!account && (
        <div className="p-8 glass-panel rounded-2xl text-center border-slate-800 mb-8">
          <Wallet className="w-10 h-10 text-teal-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Connect Your Freelancer Wallet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Connect the wallet designated in your freelance agreements to submit deliverable evidence and track payouts.
          </p>
          <button
            onClick={connectWallet}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
          >
            Connect MetaMask
          </button>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {myFreelanceAgreements.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl text-center border-slate-800">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">No Assigned Projects</h3>
            <p className="text-xs text-slate-400">
              When a client creates an escrow agreement with your wallet address, it will appear here.
            </p>
          </div>
        ) : (
          myFreelanceAgreements.map((ag) => (
            <div
              key={ag.id.toString()}
              className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                    Agreement #{ag.id.toString()}
                  </span>
                  <StatusBadge state={ag.state} />
                </div>
                <div className="text-xs text-slate-400">
                  Client: <span className="font-mono text-slate-300">{ag.client}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span>
                    Locked Balance:{" "}
                    <strong className="font-mono text-teal-300">{ethers.formatEther(ag.balance)} ETH</strong>
                  </span>
                  <span>
                    Approved:{" "}
                    <strong className="font-mono text-emerald-300">{ethers.formatEther(ag.totalPaid)} ETH</strong>
                  </span>
                </div>
              </div>

              <Link
                to={`/agreements/${ag.id.toString()}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-700 text-xs font-semibold"
              >
                Open Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
