import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { useEscrowAgreements } from "../hooks/useEscrowAgreements";
import { AgreementState, MilestoneState } from "../contracts/escrowContract";
import { StatusBadge } from "../components/StatusBadge";
import {
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Wallet,
  ExternalLink,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { account, connectWallet } = useWeb3();
  const { agreements, loading, refresh } = useEscrowAgreements();
  const [filter, setFilter] = useState<"all" | "client" | "freelancer">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Aggregate Metrics
  const totalLockedWei = agreements.reduce((acc, curr) => acc + curr.balance, 0n);
  const totalPaidWei = agreements.reduce((acc, curr) => acc + curr.totalPaid, 0n);

  const activeCount = agreements.filter(
    (a) => a.state === AgreementState.Funded || a.state === AgreementState.InProgress
  ).length;

  const completedCount = agreements.filter((a) => a.state === AgreementState.Completed).length;
  const disputedCount = agreements.filter((a) => a.state === AgreementState.Disputed).length;

  // Filter agreements
  const filtered = agreements.filter((a) => {
    if (filter === "client" && account && a.client.toLowerCase() !== account.toLowerCase()) return false;
    if (filter === "freelancer" && account && a.freelancer.toLowerCase() !== account.toLowerCase()) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = a.id.toString() === q;
      const matchClient = a.client.toLowerCase().includes(q);
      const matchFreelancer = a.freelancer.toLowerCase().includes(q);
      const matchTerms = a.termsHash.toLowerCase().includes(q);
      return matchId || matchClient || matchFreelancer || matchTerms;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Escrow Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-milestone smart contract state & settlement tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Refresh on-chain data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-glow transition-all"
          >
            <PlusCircle className="w-4 h-4" /> New Agreement
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Funds Locked</span>
            <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {ethers.formatEther(totalLockedWei)} <span className="text-sm text-sky-400">ETH</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">In active escrow contracts</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Payments Released</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {ethers.formatEther(totalPaidWei)} <span className="text-sm text-emerald-400">ETH</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Settled to freelancers</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Agreements</span>
            <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{activeCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Funded or in-progress</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Disputed / Cases</span>
            <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{disputedCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires arbitrator ruling</span>
        </div>
      </div>

      {/* Wallet Banner if not connected */}
      {!account && (
        <div className="mb-8 p-4 rounded-2xl bg-sky-950/30 border border-sky-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-sky-400 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-300">
              Connect your MetaMask wallet to view agreements tailored to your address and perform actions.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-all shrink-0"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Agreements ({agreements.length})
          </button>
          <button
            onClick={() => setFilter("client")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "client" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            As Client
          </button>
          <button
            onClick={() => setFilter("freelancer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "freelancer" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            As Freelancer
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, address, terms hash..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
          />
        </div>
      </div>

      {/* Agreements Listing */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading blockchain agreements...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border-slate-800">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No agreements found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            There are currently no agreements matching your filters. Create your first smart contract agreement to begin.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-all shadow-glow"
          >
            <PlusCircle className="w-4 h-4" /> Create Agreement
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ag) => {
            const total = Number(ethers.formatEther(ag.totalAmount));
            const paid = Number(ethers.formatEther(ag.totalPaid));
            const progressPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

            return (
              <div
                key={ag.id.toString()}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Details */}
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-md border border-sky-800/40">
                      Agreement #{ag.id.toString()}
                    </span>
                    <StatusBadge state={ag.state} />
                    {ag.isDisputed && (
                      <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500">Client: </span>
                      <span className="font-mono text-slate-300">
                        {ag.client.substring(0, 6)}...{ag.client.substring(ag.client.length - 4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Freelancer: </span>
                      <span className="font-mono text-slate-300">
                        {ag.freelancer.substring(0, 6)}...{ag.freelancer.substring(ag.freelancer.length - 4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Milestones: </span>
                      <span className="text-slate-300 font-semibold">
                        {ag.milestones?.filter((m) => m.state === MilestoneState.Approved).length || 0} /{" "}
                        {ag.milestones?.length || 0} completed
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Terms Hash: </span>
                      <span className="font-mono text-slate-400">
                        {ag.termsHash.substring(0, 8)}...{ag.termsHash.substring(ag.termsHash.length - 6)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Financials & Action */}
                <div className="flex sm:flex-row lg:flex-col items-end justify-between w-full lg:w-auto gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-white">
                      {ethers.formatEther(ag.totalAmount)} <span className="text-xs text-sky-400">ETH</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Balance: <span className="font-mono text-slate-200">{ethers.formatEther(ag.balance)} ETH</span>
                    </div>
                  </div>

                  <Link
                    to={`/agreements/${ag.id.toString()}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold transition-all hover:gap-2.5"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
