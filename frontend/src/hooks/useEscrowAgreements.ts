import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { AgreementData, MilestoneData } from "../contracts/escrowContract";

export const useEscrowAgreements = () => {
  const { contract, account, provider } = useWeb3();
  const [agreements, setAgreements] = useState<AgreementData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = useCallback(async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextId = await contract.nextAgreementId();
      const count = Number(nextId) - 1;

      const loaded: AgreementData[] = [];

      for (let id = 1; id <= count; id++) {
        try {
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

          loaded.push({
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
        } catch (err) {
          console.error(`Error loading agreement #${id}`, err);
        }
      }

      setAgreements(loaded.reverse()); // most recent first
    } catch (err: any) {
      console.error("Error fetching agreements:", err);
      setError(err?.message || "Failed to load escrow agreements from blockchain");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements, account]);

  return {
    agreements,
    loading,
    error,
    refresh: fetchAgreements,
  };
};
