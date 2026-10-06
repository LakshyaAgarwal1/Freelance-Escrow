import React from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  Scale,
  Code2,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { account, connectWallet, networkName } = useWeb3();

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[350px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Environment Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Academic Final-Year Demonstration</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-sky-400">{networkName}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Cryptographic Payment <br className="hidden sm:inline" />
          <span className="text-gradient-primary">Assurance for Freelancers</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Hold project funds safely in milestone-based smart contracts. Work begins when money is locked,
          and payments release instantly upon cryptographic acceptance.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {account ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-semibold text-sm transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Escrow Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-semibold text-sm transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              Connect MetaMask Wallet <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold text-sm transition-all"
          >
            Create Test Agreement
          </Link>
        </div>

        {/* Verification Pill */}
        <div className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-Custodial • Zero Third-Party Payment Hold • Verifiable On-Chain</span>
        </div>
      </section>

      {/* 3-Step Escrow Workflow */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How Escrow Assurance Works</h2>
          <p className="mt-2 text-sm text-slate-400">Deterministic smart contracts replace trust with verifiable cryptography</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-sky-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-5 font-mono text-lg font-bold">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Agree & Hash Specifications</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Client & freelancer agree on milestone amounts and deliverables. An immutable SHA-256 / Keccak-256
              terms hash is registered permanently on the blockchain.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative group hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-5 font-mono text-lg font-bold">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deposit Funds into Escrow</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Client deposits 100% of the agreed ETH into the smart contract. Freelancer can independently verify
              that funds are locked before writing a single line of code.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative group hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-5 font-mono text-lg font-bold">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deliver & Release Instantly</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Freelancer submits evidence references (IPFS / URLs). Client approves the milestone and funds transfer
              immediately to the freelancer wallet with zero processing delays.
            </p>
          </div>
        </div>
      </section>

      {/* Two-Sided Benefits */}
      <section className="py-16 bg-slate-950/40 border-y border-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Freelancers */}
            <div className="glass-panel p-8 rounded-2xl border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-teal-950 border border-teal-800/60 text-teal-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">For Freelancers</h3>
                  <p className="text-xs text-slate-400">Guaranteed payment for accepted deliverables</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                  <span><strong>Zero payment defaulting:</strong> Funds are locked in escrow prior to project kickoff.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                  <span><strong>No client ghosting:</strong> If work is submitted and unreviewed, milestone timeouts protect delivery.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                  <span><strong>Formal dispute recourse:</strong> Disputed work triggers designated arbitrator arbitration.</span>
                </li>
              </ul>
            </div>

            {/* For Clients */}
            <div className="glass-panel p-8 rounded-2xl border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-sky-950 border border-sky-800/60 text-sky-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">For Clients</h3>
                  <p className="text-xs text-slate-400">Milestone-level control and fund safety</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                  <span><strong>Pay only upon satisfaction:</strong> Escrow releases ETH only when you approve the milestone.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                  <span><strong>Timeout refund safeguard:</strong> Reclaim escrow balance if the freelancer fails to commence work.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                  <span><strong>Cryptographic terms binding:</strong> Deliverables are evaluated strictly against initial term hashes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Academic Notice */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-2xl border-amber-900/40 bg-gradient-to-br from-slate-900/90 to-amber-950/20">
          <div className="flex items-start gap-4">
            <Scale className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Academic & Real-World Trust Assumptions</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Smart contracts enforce mathematics and fund routing, but cannot objectively evaluate the creative or
                functional quality of off-chain code. Therefore, this platform utilizes explicit <strong>Client Acceptance</strong>
                and a transparent <strong>Predefined Arbitrator Resolution Protocol</strong> to ensure fairness.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  Solidity 0.8.24
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  ReentrancyGuard Protected
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  Hardhat Cancun EVM
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
