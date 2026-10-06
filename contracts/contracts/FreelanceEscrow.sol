// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FreelanceEscrow
 * @notice Multi-milestone escrow smart contract for freelance payment assurance.
 * Enforces verifiable fund locking, milestone submissions, client approvals,
 * and authorized arbitrator dispute resolution.
 */
contract FreelanceEscrow is ReentrancyGuard {
    enum AgreementState {
        Created,
        Funded,
        InProgress,
        Disputed,
        Completed,
        Refunded,
        Cancelled
    }

    enum MilestoneState {
        Pending,
        Submitted,
        Approved,
        Disputed,
        Refunded
    }

    struct Milestone {
        string title;
        uint256 amount;
        uint256 deadline;
        MilestoneState state;
        string submissionReference;
        uint256 submittedAt;
        uint256 approvedAt;
    }

    struct Agreement {
        uint256 id;
        address payable client;
        address payable freelancer;
        address arbitrator;
        bytes32 termsHash;
        uint256 totalAmount;
        uint256 balance;
        uint256 totalPaid;
        uint256 totalRefunded;
        uint256 createdAt;
        uint256 deadline;
        AgreementState state;
        bool isDisputed;
        address disputeInitiator;
        string disputeReason;
        uint256 disputedMilestoneIndex;
    }

    // Storage
    uint256 public nextAgreementId = 1;
    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => Milestone[]) private agreementMilestones;

    // Default platform arbitrator (fallback if not specified)
    address public immutable platformArbitrator;

    // Events
    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed client,
        address indexed freelancer,
        address arbitrator,
        uint256 totalAmount,
        bytes32 termsHash,
        uint256 milestoneCount
    );

    event AgreementFunded(
        uint256 indexed agreementId,
        address indexed client,
        uint256 amount
    );

    event WorkStarted(
        uint256 indexed agreementId,
        address indexed freelancer
    );

    event MilestoneSubmitted(
        uint256 indexed agreementId,
        uint256 indexed milestoneIndex,
        string submissionReference,
        uint256 submittedAt
    );

    event MilestoneApproved(
        uint256 indexed agreementId,
        uint256 indexed milestoneIndex,
        uint256 amountReleased,
        address indexed freelancer
    );

    event DisputeRaised(
        uint256 indexed agreementId,
        uint256 indexed milestoneIndex,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed agreementId,
        address indexed arbitrator,
        uint256 clientRefund,
        uint256 freelancerPayment,
        string rulingDetails
    );

    event AgreementRefunded(
        uint256 indexed agreementId,
        address indexed client,
        uint256 amount
    );

    event AgreementCancelled(
        uint256 indexed agreementId,
        address indexed client
    );

    // Custom Errors
    error Unauthorized();
    error InvalidState(AgreementState current, AgreementState expected);
    error InvalidMilestoneState(MilestoneState current, MilestoneState expected);
    error InvalidAddress();
    error InvalidAmount();
    error MilestoneSumMismatch(uint256 expected, uint256 actual);
    error InvalidMilestoneIndex(uint256 index, uint256 total);
    error InsufficientPayment(uint256 required, uint256 received);
    error Overpayment();
    error SettlementMismatch(uint256 totalRequired, uint256 totalProvided);
    error TransferFailed();
    error DeadlineNotPassed();

    modifier onlyClient(uint256 _agreementId) {
        if (msg.sender != agreements[_agreementId].client) revert Unauthorized();
        _;
    }

    modifier onlyFreelancer(uint256 _agreementId) {
        if (msg.sender != agreements[_agreementId].freelancer) revert Unauthorized();
        _;
    }

    modifier onlyParties(uint256 _agreementId) {
        if (
            msg.sender != agreements[_agreementId].client &&
            msg.sender != agreements[_agreementId].freelancer
        ) revert Unauthorized();
        _;
    }

    modifier onlyArbitrator(uint256 _agreementId) {
        if (msg.sender != agreements[_agreementId].arbitrator) revert Unauthorized();
        _;
    }

    modifier agreementExists(uint256 _agreementId) {
        if (agreements[_agreementId].id == 0) revert Unauthorized();
        _;
    }

    constructor(address _platformArbitrator) {
        if (_platformArbitrator == address(0)) revert InvalidAddress();
        platformArbitrator = _platformArbitrator;
    }

    /**
     * @notice Creates a new freelance agreement with defined milestones.
     */
    function createAgreement(
        address payable _freelancer,
        address _arbitrator,
        bytes32 _termsHash,
        uint256 _deadline,
        string[] calldata _milestoneTitles,
        uint256[] calldata _milestoneAmounts,
        uint256[] calldata _milestoneDeadlines
    ) external returns (uint256) {
        if (_freelancer == address(0) || _freelancer == msg.sender) revert InvalidAddress();
        if (_termsHash == bytes32(0)) revert InvalidAmount();
        if (_milestoneTitles.length == 0) revert InvalidAmount();
        if (
            _milestoneTitles.length != _milestoneAmounts.length ||
            _milestoneTitles.length != _milestoneDeadlines.length
        ) revert InvalidAmount();

        address designatedArbitrator = _arbitrator == address(0) ? platformArbitrator : _arbitrator;
        if (designatedArbitrator == msg.sender || designatedArbitrator == _freelancer) {
            revert InvalidAddress();
        }

        uint256 calculatedTotal = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            if (_milestoneAmounts[i] == 0) revert InvalidAmount();
            calculatedTotal += _milestoneAmounts[i];
        }

        uint256 agreementId = nextAgreementId++;
        Agreement storage ag = agreements[agreementId];
        ag.id = agreementId;
        ag.client = payable(msg.sender);
        ag.freelancer = _freelancer;
        ag.arbitrator = designatedArbitrator;
        ag.termsHash = _termsHash;
        ag.totalAmount = calculatedTotal;
        ag.createdAt = block.timestamp;
        ag.deadline = _deadline > 0 ? _deadline : block.timestamp + 30 days;
        ag.state = AgreementState.Created;

        for (uint256 i = 0; i < _milestoneTitles.length; i++) {
            agreementMilestones[agreementId].push(
                Milestone({
                    title: _milestoneTitles[i],
                    amount: _milestoneAmounts[i],
                    deadline: _milestoneDeadlines[i],
                    state: MilestoneState.Pending,
                    submissionReference: "",
                    submittedAt: 0,
                    approvedAt: 0
                })
            );
        }

        emit AgreementCreated(
            agreementId,
            msg.sender,
            _freelancer,
            designatedArbitrator,
            calculatedTotal,
            _termsHash,
            _milestoneTitles.length
        );

        return agreementId;
    }

    /**
     * @notice Deposits the full escrow amount for an agreement.
     */
    function fundAgreement(uint256 _agreementId)
        external
        payable
        nonReentrant
        agreementExists(_agreementId)
        onlyClient(_agreementId)
    {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Created) {
            revert InvalidState(ag.state, AgreementState.Created);
        }
        if (msg.value != ag.totalAmount) {
            revert InsufficientPayment(ag.totalAmount, msg.value);
        }

        ag.balance = msg.value;
        ag.state = AgreementState.Funded;

        emit AgreementFunded(_agreementId, msg.sender, msg.value);
    }

    /**
     * @notice Convenience function to create and immediately fund an agreement in a single transaction.
     */
    function createAndFundAgreement(
        address payable _freelancer,
        address _arbitrator,
        bytes32 _termsHash,
        uint256 _deadline,
        string[] calldata _milestoneTitles,
        uint256[] calldata _milestoneAmounts,
        uint256[] calldata _milestoneDeadlines
    ) external payable nonReentrant returns (uint256) {
        if (_freelancer == address(0) || _freelancer == msg.sender) revert InvalidAddress();
        if (_termsHash == bytes32(0)) revert InvalidAmount();
        if (_milestoneTitles.length == 0) revert InvalidAmount();
        if (
            _milestoneTitles.length != _milestoneAmounts.length ||
            _milestoneTitles.length != _milestoneDeadlines.length
        ) revert InvalidAmount();

        address designatedArbitrator = _arbitrator == address(0) ? platformArbitrator : _arbitrator;
        if (designatedArbitrator == msg.sender || designatedArbitrator == _freelancer) {
            revert InvalidAddress();
        }

        uint256 calculatedTotal = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            if (_milestoneAmounts[i] == 0) revert InvalidAmount();
            calculatedTotal += _milestoneAmounts[i];
        }

        if (msg.value != calculatedTotal) {
            revert InsufficientPayment(calculatedTotal, msg.value);
        }

        uint256 agreementId = nextAgreementId++;
        Agreement storage ag = agreements[agreementId];
        ag.id = agreementId;
        ag.client = payable(msg.sender);
        ag.freelancer = _freelancer;
        ag.arbitrator = designatedArbitrator;
        ag.termsHash = _termsHash;
        ag.totalAmount = calculatedTotal;
        ag.balance = msg.value;
        ag.createdAt = block.timestamp;
        ag.deadline = _deadline > 0 ? _deadline : block.timestamp + 30 days;
        ag.state = AgreementState.Funded;

        for (uint256 i = 0; i < _milestoneTitles.length; i++) {
            agreementMilestones[agreementId].push(
                Milestone({
                    title: _milestoneTitles[i],
                    amount: _milestoneAmounts[i],
                    deadline: _milestoneDeadlines[i],
                    state: MilestoneState.Pending,
                    submissionReference: "",
                    submittedAt: 0,
                    approvedAt: 0
                })
            );
        }

        emit AgreementCreated(
            agreementId,
            msg.sender,
            _freelancer,
            designatedArbitrator,
            calculatedTotal,
            _termsHash,
            _milestoneTitles.length
        );

        emit AgreementFunded(agreementId, msg.sender, msg.value);

        return agreementId;
    }

    /**
     * @notice Freelancer starts work on the agreement.
     */
    function startWork(uint256 _agreementId)
        external
        agreementExists(_agreementId)
        onlyFreelancer(_agreementId)
    {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Funded) {
            revert InvalidState(ag.state, AgreementState.Funded);
        }

        ag.state = AgreementState.InProgress;
        emit WorkStarted(_agreementId, msg.sender);
    }

    /**
     * @notice Freelancer submits deliverable for an active milestone.
     */
    function submitMilestone(
        uint256 _agreementId,
        uint256 _milestoneIndex,
        string calldata _submissionReference
    ) external agreementExists(_agreementId) onlyFreelancer(_agreementId) {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Funded && ag.state != AgreementState.InProgress) {
            revert InvalidState(ag.state, AgreementState.InProgress);
        }
        if (ag.isDisputed) revert InvalidState(AgreementState.Disputed, AgreementState.InProgress);

        Milestone[] storage milestones = agreementMilestones[_agreementId];
        if (_milestoneIndex >= milestones.length) {
            revert InvalidMilestoneIndex(_milestoneIndex, milestones.length);
        }

        Milestone storage ms = milestones[_milestoneIndex];
        if (ms.state != MilestoneState.Pending && ms.state != MilestoneState.Submitted) {
            revert InvalidMilestoneState(ms.state, MilestoneState.Pending);
        }

        // If it was just Funded, implicitly transition to InProgress upon submission
        if (ag.state == AgreementState.Funded) {
            ag.state = AgreementState.InProgress;
            emit WorkStarted(_agreementId, msg.sender);
        }

        ms.state = MilestoneState.Submitted;
        ms.submissionReference = _submissionReference;
        ms.submittedAt = block.timestamp;

        emit MilestoneSubmitted(_agreementId, _milestoneIndex, _submissionReference, block.timestamp);
    }

    /**
     * @notice Client approves deliverable and releases milestone payment to the freelancer.
     */
    function approveMilestone(uint256 _agreementId, uint256 _milestoneIndex)
        external
        nonReentrant
        agreementExists(_agreementId)
        onlyClient(_agreementId)
    {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Funded && ag.state != AgreementState.InProgress) {
            revert InvalidState(ag.state, AgreementState.InProgress);
        }
        if (ag.isDisputed) revert InvalidState(AgreementState.Disputed, AgreementState.InProgress);

        Milestone[] storage milestones = agreementMilestones[_agreementId];
        if (_milestoneIndex >= milestones.length) {
            revert InvalidMilestoneIndex(_milestoneIndex, milestones.length);
        }

        Milestone storage ms = milestones[_milestoneIndex];
        if (ms.state != MilestoneState.Submitted) {
            revert InvalidMilestoneState(ms.state, MilestoneState.Submitted);
        }

        uint256 payout = ms.amount;
        if (ag.balance < payout) revert InvalidAmount();

        // Checks-Effects-Interactions
        ms.state = MilestoneState.Approved;
        ms.approvedAt = block.timestamp;
        ag.balance -= payout;
        ag.totalPaid += payout;

        // Check if all milestones are approved
        bool allApproved = true;
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i].state != MilestoneState.Approved) {
                allApproved = false;
                break;
            }
        }

        if (allApproved) {
            ag.state = AgreementState.Completed;
        }

        emit MilestoneApproved(_agreementId, _milestoneIndex, payout, ag.freelancer);

        (bool success, ) = ag.freelancer.call{value: payout}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Client or Freelancer raises a dispute over a specific milestone or agreement.
     */
    function raiseDispute(
        uint256 _agreementId,
        uint256 _milestoneIndex,
        string calldata _reason
    ) external agreementExists(_agreementId) onlyParties(_agreementId) {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Funded && ag.state != AgreementState.InProgress) {
            revert InvalidState(ag.state, AgreementState.InProgress);
        }
        if (ag.isDisputed) revert InvalidState(AgreementState.Disputed, AgreementState.InProgress);

        Milestone[] storage milestones = agreementMilestones[_agreementId];
        if (_milestoneIndex >= milestones.length) {
            revert InvalidMilestoneIndex(_milestoneIndex, milestones.length);
        }

        ag.isDisputed = true;
        ag.disputeInitiator = msg.sender;
        ag.disputeReason = _reason;
        ag.disputedMilestoneIndex = _milestoneIndex;
        ag.state = AgreementState.Disputed;

        milestones[_milestoneIndex].state = MilestoneState.Disputed;

        emit DisputeRaised(_agreementId, _milestoneIndex, msg.sender, _reason);
    }

    /**
     * @notice Authorized arbitrator resolves the dispute, distributing remaining escrow funds.
     */
    function resolveDispute(
        uint256 _agreementId,
        uint256 _clientRefund,
        uint256 _freelancerPayment,
        string calldata _rulingDetails
    ) external nonReentrant agreementExists(_agreementId) onlyArbitrator(_agreementId) {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Disputed) {
            revert InvalidState(ag.state, AgreementState.Disputed);
        }

        uint256 remainingBalance = ag.balance;
        if (_clientRefund + _freelancerPayment != remainingBalance) {
            revert SettlementMismatch(remainingBalance, _clientRefund + _freelancerPayment);
        }

        // Checks-Effects
        ag.balance = 0;
        ag.totalRefunded += _clientRefund;
        ag.totalPaid += _freelancerPayment;
        ag.isDisputed = false;

        if (ag.disputedMilestoneIndex < agreementMilestones[_agreementId].length) {
            if (_freelancerPayment > 0) {
                agreementMilestones[_agreementId][ag.disputedMilestoneIndex].state = MilestoneState.Approved;
            } else {
                agreementMilestones[_agreementId][ag.disputedMilestoneIndex].state = MilestoneState.Refunded;
            }
        }

        ag.state = _freelancerPayment > 0 ? AgreementState.Completed : AgreementState.Refunded;

        emit DisputeResolved(_agreementId, msg.sender, _clientRefund, _freelancerPayment, _rulingDetails);

        // Interactions
        if (_clientRefund > 0) {
            (bool successClient, ) = ag.client.call{value: _clientRefund}("");
            if (!successClient) revert TransferFailed();
        }

        if (_freelancerPayment > 0) {
            (bool successFreelancer, ) = ag.freelancer.call{value: _freelancerPayment}("");
            if (!successFreelancer) revert TransferFailed();
        }
    }

    /**
     * @notice Client cancels an un-funded agreement.
     */
    function cancelAgreement(uint256 _agreementId)
        external
        agreementExists(_agreementId)
        onlyClient(_agreementId)
    {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Created) {
            revert InvalidState(ag.state, AgreementState.Created);
        }

        ag.state = AgreementState.Cancelled;
        emit AgreementCancelled(_agreementId, msg.sender);
    }

    /**
     * @notice Allows refund of remaining escrow funds to client if the overall agreement deadline passed
     * and no milestone work has been submitted or dispute opened.
     */
    function claimTimeoutRefund(uint256 _agreementId)
        external
        nonReentrant
        agreementExists(_agreementId)
        onlyClient(_agreementId)
    {
        Agreement storage ag = agreements[_agreementId];
        if (ag.state != AgreementState.Funded && ag.state != AgreementState.InProgress) {
            revert InvalidState(ag.state, AgreementState.Funded);
        }
        if (ag.isDisputed) revert InvalidState(AgreementState.Disputed, AgreementState.Funded);
        if (block.timestamp < ag.deadline) revert DeadlineNotPassed();

        // Check if any milestone is in submitted status
        Milestone[] storage milestones = agreementMilestones[_agreementId];
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i].state == MilestoneState.Submitted) {
                revert InvalidMilestoneState(milestones[i].state, MilestoneState.Pending);
            }
        }

        uint256 refundAmount = ag.balance;
        if (refundAmount == 0) revert InvalidAmount();

        ag.balance = 0;
        ag.totalRefunded += refundAmount;
        ag.state = AgreementState.Refunded;

        emit AgreementRefunded(_agreementId, msg.sender, refundAmount);

        (bool success, ) = ag.client.call{value: refundAmount}("");
        if (!success) revert TransferFailed();
    }

    // View Functions
    function getAgreement(uint256 _agreementId)
        external
        view
        returns (Agreement memory)
    {
        return agreements[_agreementId];
    }

    function getMilestones(uint256 _agreementId)
        external
        view
        returns (Milestone[] memory)
    {
        return agreementMilestones[_agreementId];
    }

    function getMilestoneCount(uint256 _agreementId)
        external
        view
        returns (uint256)
    {
        return agreementMilestones[_agreementId].length;
    }
}
