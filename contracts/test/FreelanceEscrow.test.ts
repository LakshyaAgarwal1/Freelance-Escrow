import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { FreelanceEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FreelanceEscrow Smart Contract Suite", function () {
  let escrow: FreelanceEscrow;
  let owner: SignerWithAddress;
  let client: SignerWithAddress;
  let freelancer: SignerWithAddress;
  let arbitrator: SignerWithAddress;
  let stranger: SignerWithAddress;

  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("FREELANCE_SPECIFICATION_V1"));
  const msTitles = ["Milestone 1: Prototype", "Milestone 2: Final Delivery"];
  const msAmounts = [ethers.parseEther("1.0"), ethers.parseEther("2.0")];
  const totalAmount = ethers.parseEther("3.0");

  beforeEach(async function () {
    [owner, client, freelancer, arbitrator, stranger] = await ethers.getSigners();

    const FreelanceEscrowFactory = await ethers.getContractFactory("FreelanceEscrow");
    escrow = await FreelanceEscrowFactory.deploy(arbitrator.address);
    await escrow.waitForDeployment();
  });

  describe("1. Agreement Creation & Funding Lifecycle", function () {
    it("Should allow a client to create an agreement with defined milestones", async function () {
      const now = await time.latest();
      const deadlines = [now + 86400, now + 172800];

      const tx = await escrow.connect(client).createAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 259200,
        msTitles,
        msAmounts,
        deadlines
      );

      await expect(tx)
        .to.emit(escrow, "AgreementCreated")
        .withArgs(1, client.address, freelancer.address, arbitrator.address, totalAmount, termsHash, 2);

      const ag = await escrow.getAgreement(1);
      expect(ag.id).to.equal(1n);
      expect(ag.client).to.equal(client.address);
      expect(ag.freelancer).to.equal(freelancer.address);
      expect(ag.arbitrator).to.equal(arbitrator.address);
      expect(ag.totalAmount).to.equal(totalAmount);
      expect(ag.balance).to.equal(0n);
      expect(ag.state).to.equal(0n); // Created
    });

    it("Should allow client to fund an agreement with exact ETH", async function () {
      const now = await time.latest();
      await escrow.connect(client).createAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 3,
        msTitles,
        msAmounts,
        [now + 86400, now + 172800]
      );

      const fundTx = await escrow.connect(client).fundAgreement(1, { value: totalAmount });
      await expect(fundTx)
        .to.emit(escrow, "AgreementFunded")
        .withArgs(1, client.address, totalAmount);

      const ag = await escrow.getAgreement(1);
      expect(ag.balance).to.equal(totalAmount);
      expect(ag.state).to.equal(1n); // Funded
    });

    it("Should support atomic createAndFundAgreement in a single transaction", async function () {
      const now = await time.latest();
      const tx = await escrow.connect(client).createAndFundAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 3,
        msTitles,
        msAmounts,
        [now + 86400, now + 172800],
        { value: totalAmount }
      );

      await expect(tx).to.emit(escrow, "AgreementFunded").withArgs(1, client.address, totalAmount);
      const ag = await escrow.getAgreement(1);
      expect(ag.balance).to.equal(totalAmount);
      expect(ag.state).to.equal(1n); // Funded
    });

    it("Should reject funding with insufficient or excess ETH", async function () {
      const now = await time.latest();
      await escrow.connect(client).createAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 3,
        msTitles,
        msAmounts,
        [now + 86400, now + 172800]
      );

      await expect(
        escrow.connect(client).fundAgreement(1, { value: ethers.parseEther("2.5") })
      ).to.be.revertedWithCustomError(escrow, "InsufficientPayment");

      await expect(
        escrow.connect(client).fundAgreement(1, { value: ethers.parseEther("3.5") })
      ).to.be.revertedWithCustomError(escrow, "InsufficientPayment");
    });
  });

  describe("2. Work Submission and Milestone Approval", function () {
    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(client).createAndFundAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 7,
        msTitles,
        msAmounts,
        [now + 86400 * 2, now + 86400 * 5],
        { value: totalAmount }
      );
    });

    it("Should allow freelancer to submit milestone evidence and transition state to InProgress", async function () {
      const evidence = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const tx = await escrow.connect(freelancer).submitMilestone(1, 0, evidence);

      await expect(tx).to.emit(escrow, "MilestoneSubmitted");

      const milestones = await escrow.getMilestones(1);
      expect(milestones[0].state).to.equal(1n); // Submitted
      expect(milestones[0].submissionReference).to.equal(evidence);

      const ag = await escrow.getAgreement(1);
      expect(ag.state).to.equal(2n); // InProgress
    });

    it("Should release payment to freelancer upon client milestone approval", async function () {
      const evidence = "ipfs://deliverable-ms1";
      await escrow.connect(freelancer).submitMilestone(1, 0, evidence);

      const freelancerInitialBalance = await ethers.provider.getBalance(freelancer.address);

      const tx = await escrow.connect(client).approveMilestone(1, 0);
      await expect(tx)
        .to.emit(escrow, "MilestoneApproved")
        .withArgs(1, 0, msAmounts[0], freelancer.address);

      const freelancerFinalBalance = await ethers.provider.getBalance(freelancer.address);
      expect(freelancerFinalBalance - freelancerInitialBalance).to.equal(msAmounts[0]);

      const ag = await escrow.getAgreement(1);
      expect(ag.balance).to.equal(ethers.parseEther("2.0"));
      expect(ag.totalPaid).to.equal(ethers.parseEther("1.0"));
    });

    it("Should transition agreement to Completed when all milestones are approved", async function () {
      // Milestone 0
      await escrow.connect(freelancer).submitMilestone(1, 0, "ipfs://ms0");
      await escrow.connect(client).approveMilestone(1, 0);

      // Milestone 1
      await escrow.connect(freelancer).submitMilestone(1, 1, "ipfs://ms1");
      await escrow.connect(client).approveMilestone(1, 1);

      const ag = await escrow.getAgreement(1);
      expect(ag.state).to.equal(4n); // Completed
      expect(ag.balance).to.equal(0n);
      expect(ag.totalPaid).to.equal(totalAmount);
    });
  });

  describe("3. Access Control & Authorization Safeguards", function () {
    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(client).createAndFundAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 7,
        msTitles,
        msAmounts,
        [now + 86400 * 2, now + 86400 * 5],
        { value: totalAmount }
      );
    });

    it("Should reject milestone submission from strangers or client", async function () {
      await expect(
        escrow.connect(stranger).submitMilestone(1, 0, "ipfs://fake")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");

      await expect(
        escrow.connect(client).submitMilestone(1, 0, "ipfs://fake")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("Should reject milestone approval from non-client accounts", async function () {
      await escrow.connect(freelancer).submitMilestone(1, 0, "ipfs://work");

      await expect(
        escrow.connect(stranger).approveMilestone(1, 0)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");

      await expect(
        escrow.connect(freelancer).approveMilestone(1, 0)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("Should reject approval of milestone that has not been submitted yet", async function () {
      await expect(
        escrow.connect(client).approveMilestone(1, 0)
      ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneState");
    });
  });

  describe("4. Dispute Handling & Arbitrator Resolution", function () {
    beforeEach(async function () {
      const now = await time.latest();
      await escrow.connect(client).createAndFundAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 7,
        msTitles,
        msAmounts,
        [now + 86400 * 2, now + 86400 * 5],
        { value: totalAmount }
      );
      await escrow.connect(freelancer).submitMilestone(1, 0, "ipfs://disputed-deliverable");
    });

    it("Should allow client or freelancer to raise a dispute", async function () {
      const tx = await escrow.connect(client).raiseDispute(1, 0, "Deliverable does not match specs");
      await expect(tx)
        .to.emit(escrow, "DisputeRaised")
        .withArgs(1, 0, client.address, "Deliverable does not match specs");

      const ag = await escrow.getAgreement(1);
      expect(ag.isDisputed).to.be.true;
      expect(ag.state).to.equal(3n); // Disputed
    });

    it("Should freeze milestone actions while a dispute is active", async function () {
      await escrow.connect(client).raiseDispute(1, 0, "Deliverable does not match specs");

      // Approval blocked
      await expect(
        escrow.connect(client).approveMilestone(1, 0)
      ).to.be.revertedWithCustomError(escrow, "InvalidState");

      // Submission blocked
      await expect(
        escrow.connect(freelancer).submitMilestone(1, 1, "ipfs://next")
      ).to.be.revertedWithCustomError(escrow, "InvalidState");
    });

    it("Should prevent non-arbitrator from executing dispute ruling", async function () {
      await escrow.connect(client).raiseDispute(1, 0, "Dispute");

      await expect(
        escrow.connect(stranger).resolveDispute(
          1,
          ethers.parseEther("1.0"),
          ethers.parseEther("2.0"),
          "Ruling"
        )
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("Should enforce that settlement amounts equal total frozen escrow balance", async function () {
      await escrow.connect(client).raiseDispute(1, 0, "Dispute");

      // Balance is 3.0 ETH; providing 2.0 ETH total should revert
      await expect(
        escrow.connect(arbitrator).resolveDispute(
          1,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.0"),
          "Invalid split"
        )
      ).to.be.revertedWithCustomError(escrow, "SettlementMismatch");
    });

    it("Should execute arbitrator ruling and distribute funds to client and freelancer", async function () {
      await escrow.connect(client).raiseDispute(1, 0, "Quality dispute");

      const clientInitial = await ethers.provider.getBalance(client.address);
      const freelancerInitial = await ethers.provider.getBalance(freelancer.address);

      // Ruling: 1.0 ETH refund to client, 2.0 ETH awarded to freelancer
      const clientRefund = ethers.parseEther("1.0");
      const freelancerPayout = ethers.parseEther("2.0");

      const tx = await escrow.connect(arbitrator).resolveDispute(
        1,
        clientRefund,
        freelancerPayout,
        "Freelancer delivered partial work; 33% refunded to client"
      );

      await expect(tx).to.emit(escrow, "DisputeResolved");

      const clientFinal = await ethers.provider.getBalance(client.address);
      const freelancerFinal = await ethers.provider.getBalance(freelancer.address);

      expect(clientFinal - clientInitial).to.equal(clientRefund);
      expect(freelancerFinal - freelancerInitial).to.equal(freelancerPayout);

      const ag = await escrow.getAgreement(1);
      expect(ag.balance).to.equal(0n);
      expect(ag.isDisputed).to.be.false;
      expect(ag.totalRefunded).to.equal(clientRefund);
      expect(ag.totalPaid).to.equal(freelancerPayout);
    });
  });

  describe("5. Refunds & Cancellation Conditions", function () {
    it("Should allow client to cancel an un-funded agreement", async function () {
      const now = await time.latest();
      await escrow.connect(client).createAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        now + 86400 * 3,
        msTitles,
        msAmounts,
        [now + 86400, now + 172800]
      );

      const tx = await escrow.connect(client).cancelAgreement(1);
      await expect(tx).to.emit(escrow, "AgreementCancelled").withArgs(1, client.address);

      const ag = await escrow.getAgreement(1);
      expect(ag.state).to.equal(6n); // Cancelled
    });

    it("Should allow client to claim timeout refund if deadline expired and no work submitted", async function () {
      const now = await time.latest();
      const deadline = now + 86400; // 1 day

      await escrow.connect(client).createAndFundAgreement(
        freelancer.address,
        arbitrator.address,
        termsHash,
        deadline,
        msTitles,
        msAmounts,
        [now + 43200, deadline],
        { value: totalAmount }
      );

      // Attempt refund before deadline -> should revert
      await expect(
        escrow.connect(client).claimTimeoutRefund(1)
      ).to.be.revertedWithCustomError(escrow, "DeadlineNotPassed");

      // Advance time past deadline
      await time.increase(86401);

      const clientInitial = await ethers.provider.getBalance(client.address);
      const tx = await escrow.connect(client).claimTimeoutRefund(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const clientFinal = await ethers.provider.getBalance(client.address);
      expect(clientFinal - clientInitial + gasCost).to.equal(totalAmount);

      const ag = await escrow.getAgreement(1);
      expect(ag.state).to.equal(5n); // Refunded
      expect(ag.balance).to.equal(0n);

      // Double-claim should revert
      await expect(
        escrow.connect(client).claimTimeoutRefund(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidState");
    });
  });
});
