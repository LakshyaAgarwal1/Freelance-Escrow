import React from "react";
import { AgreementState, MilestoneState } from "../contracts/escrowContract";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";

interface StatusBadgeProps {
  state: AgreementState | MilestoneState;
  isMilestone?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ state, isMilestone = false }) => {
  if (isMilestone) {
    switch (state as MilestoneState) {
      case MilestoneState.Pending:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Pending
          </span>
        );
      case MilestoneState.Submitted:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/60">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> Submitted (In Review)
          </span>
        );
      case MilestoneState.Approved:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Approved & Released
          </span>
        );
      case MilestoneState.Disputed:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-800/60">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Disputed
          </span>
        );
      case MilestoneState.Refunded:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3.5 h-3.5 text-slate-400" /> Refunded
          </span>
        );
      default:
        return null;
    }
  }

  // Agreement State
  switch (state as AgreementState) {
    case AgreementState.Created:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/40 text-sky-300 border border-sky-800/50">
          <Clock className="w-3.5 h-3.5" /> Created (Unfunded)
        </span>
      );
    case AgreementState.Funded:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-700/60">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Funded (Ready)
        </span>
      );
    case AgreementState.InProgress:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-950/40 text-teal-300 border border-teal-700/60">
          <span className="w-2 h-2 rounded-full bg-teal-400" /> In Progress
        </span>
      );
    case AgreementState.Disputed:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-700/70">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Disputed
        </span>
      );
    case AgreementState.Completed:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-700/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
        </span>
      );
    case AgreementState.Refunded:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700">
          <XCircle className="w-3.5 h-3.5" /> Refunded
        </span>
      );
    case AgreementState.Cancelled:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-700">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    default:
      return null;
  }
};
