import React from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { useEscrowAgreements } from "../hooks/useEscrowAgreements";
import { AgreementState } from "../contracts/escrowContract";
import { StatusBadge } from "../components/StatusBadge";
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Info,
} from "lucide-react";

export const DisputeCenterPage: React.FC = () => {
  const { account } = useWeb3();
  const { agreements, loading } = useEscrowAgreements();

  const disputedAgreements = agreements.filter((a) => a.state === AgreementState.Disputed);
  const resolvedAgreements = agreements.filter(
    (a) => a.totalRefunded > 0n && a.state !== AgreementState.Disputed
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Scale className="w-7 h-7 text-amber-400" /> Dispute Resolution Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fair settlement mechanism for non-delivery, missed deadlines, or acceptance criteria contestation
          </p>
        </div>
      </div>

      {/* Protocol Transparency Disclaimer */}
      <div className="mb-8 p-6 glass-panel rounded-2xl border-amber-900/50 bg-gradient-to-r from-slate-900/90 to-amber-950/20">
        <div className="flex items-start gap-4">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-2">
            <h3 className="font-bold text-white text-sm">Dispute Settlement Rules & Policy</h3>
            <p>
              1. <strong>Fund Freezing:</strong> When an agreement is disputed, remaining funds are frozen on-chain.
              Neither the client nor the freelancer can withdraw or release funds unilaterally.
            </p>
            <p>
              2. <strong>Arbitrator Authority:</strong> The designated arbitrator specified at agreement creation
              is authorized to divide the frozen funds between client refund and freelancer payout.
            </p>
            <p>
              3. <strong>Settlement Invariant:</strong> The smart contract strictly enforces that the sum of the
              client refund and freelancer payment equals 100% of the frozen balance.
            </p>
          </div>
        </div>
      </div>

      {/* Active Disputes Section */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          Active Disputes Requiring Ruling ({disputedAgreements.length})
        </h2>

        {disputedAgreements.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center border-slate-800 text-xs text-slate-400">
            No active disputes. All current agreements are proceeding smoothly or settled.
          </div>
        ) : (
          <div className="space-y-4">
            {disputedAgreements.map((ag) => {
              const isArbitrator = account && ag.arbitrator.toLowerCase() === account.toLowerCase();

              return (
                <div
                  key={ag.id.toString()}
                  className="glass-panel p-6 rounded-2xl border-rose-900/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                        Case #{ag.id.toString()}
                      </span>
                      <StatusBadge state={ag.state} />
                      {isArbitrator && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold border border-amber-800">
                          You are the Arbitrator
                        </span>
                      )}
                    </div>

                    <p className="text-rose-200">
                      <strong>Dispute Reason:</strong> {ag.disputeReason}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                      <div>
                        Initiated by: <span className="font-mono text-slate-300">{ag.disputeInitiator}</span>
                      </div>
                      <div>
                        Designated Arbitrator: <span className="font-mono text-slate-300">{ag.arbitrator}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Frozen Balance</span>
                      <span className="font-mono font-bold text-rose-400 text-base">
                        {ethers.formatEther(ag.balance)} ETH
                      </span>
                    </div>

                    <Link
                      to={`/agreements/${ag.id.toString()}`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-glow"
                    >
                      Inspect Case & Settle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved Cases */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Settled / Refunded Cases ({resolvedAgreements.length})
        </h2>

        {resolvedAgreements.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl text-center border-slate-800 text-xs text-slate-500">
            No historical settled dispute cases.
          </div>
        ) : (
          <div className="space-y-3">
            {resolvedAgreements.map((ag) => (
              <div
                key={ag.id.toString()}
                className="glass-panel p-4 rounded-xl border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-slate-400 font-bold">Agreement #{ag.id.toString()}</span>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Refunded: <span className="font-mono text-white">{ethers.formatEther(ag.totalRefunded)} ETH</span>{" "}
                    | Paid: <span className="font-mono text-white">{ethers.formatEther(ag.totalPaid)} ETH</span>
                  </div>
                </div>

                <Link
                  to={`/agreements/${ag.id.toString()}`}
                  className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  View Record <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
