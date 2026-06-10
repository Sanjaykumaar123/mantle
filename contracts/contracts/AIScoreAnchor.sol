// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AIScoreAnchor
/// @notice Lightweight on-chain anchor for AI-generated scores produced by the
///         AEGIS AI Intelligence Center. The score is computed entirely off-chain;
///         only the final result is written here for tamper-proof verification.
///
/// Compatible with both Arbitrum Sepolia (chainId 421614) and
/// Mantle Testnet (chainId 5003) — deploy with:
///   npx hardhat run scripts/deploy.ts --network arbitrumSepolia
///   npx hardhat run scripts/deploy.ts --network mantleTestnet
contract AIScoreAnchor is Ownable {
    /// @dev Stores the latest anchored AI score (0–100).
    uint256 public latestScore;

    /// @dev Monotonically increasing sequence number for each anchoring event.
    uint256 public anchorCount;

    struct ScoreRecord {
        uint256 score;
        uint64  timestamp;
        address submitter;
        string  context; // e.g. "intelligence", "compliance", "transfer_risk"
    }

    /// @dev Full history of all anchored scores.
    mapping(uint256 => ScoreRecord) public scoreHistory;

    /// @notice Emitted whenever a new AI score is anchored on-chain.
    event AIScoreAnchored(
        uint256 indexed anchorId,
        uint256 indexed score,
        address indexed submitter,
        string  context,
        uint64  timestamp
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Store an AI-generated score on-chain.
    /// @param score    The computed intelligence / compliance score (0–100).
    /// @param context  Human-readable label for the score type.
    /// @return anchorId  The sequence number of this anchoring event.
    function storeAIScore(
        uint256 score,
        string calldata context
    ) external returns (uint256 anchorId) {
        require(score <= 100, "AIScoreAnchor: score must be 0-100");
        require(bytes(context).length > 0, "AIScoreAnchor: context required");

        latestScore = score;
        anchorId    = ++anchorCount;

        scoreHistory[anchorId] = ScoreRecord({
            score:     score,
            timestamp: uint64(block.timestamp),
            submitter: msg.sender,
            context:   context
        });

        emit AIScoreAnchored(anchorId, score, msg.sender, context, uint64(block.timestamp));
    }

    /// @notice Convenience getter – returns the full latest record.
    function getLatestRecord() external view returns (ScoreRecord memory) {
        require(anchorCount > 0, "AIScoreAnchor: no scores anchored yet");
        return scoreHistory[anchorCount];
    }
}
