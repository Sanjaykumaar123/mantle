// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

import {ConfidentialRWAToken} from "./ConfidentialRWAToken.sol";

/// @title SettlementVault
/// @notice Locks public settlement tokens and mints/burns their confidential representation.
/// @dev The encrypted amount is validated by NOX inside this vault. Equality between
///      publicAmount and encryptedAmount is enforced by the product flow until a public equality
///      proof circuit is added.
contract SettlementVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable settlementAsset;
    ConfidentialRWAToken public immutable confidentialToken;

    event DepositedAndMinted(
        address indexed account,
        uint256 publicAmount,
        bytes32 indexed encryptedAmount
    );
    event BurnedAndWithdrawn(
        address indexed account,
        uint256 publicAmount,
        bytes32 indexed encryptedAmount
    );

    constructor(address settlementAssetAddress, address confidentialTokenAddress) {
        require(settlementAssetAddress != address(0), "SettlementVault: zero settlement asset");
        require(confidentialTokenAddress != address(0), "SettlementVault: zero confidential token");

        settlementAsset = IERC20(settlementAssetAddress);
        confidentialToken = ConfidentialRWAToken(confidentialTokenAddress);
    }

    function depositAndMint(
        uint256 publicAmount,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external nonReentrant returns (euint256 minted) {
        require(publicAmount > 0, "SettlementVault: zero amount");

        settlementAsset.safeTransferFrom(msg.sender, address(this), publicAmount);
        euint256 amount = _toVaultAmount(encryptedAmount, inputProof);
        if (block.chainid != 31337 && block.chainid != 5003) {
            Nox.allowTransient(amount, address(confidentialToken));
        }
        minted = confidentialToken.mint(msg.sender, amount);

        emit DepositedAndMinted(msg.sender, publicAmount, externalEuint256.unwrap(encryptedAmount));
    }

    function burnAndWithdraw(
        uint256 publicAmount,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external nonReentrant returns (euint256 burned) {
        require(publicAmount > 0, "SettlementVault: zero amount");

        euint256 amount = _toVaultAmount(encryptedAmount, inputProof);
        if (block.chainid != 31337 && block.chainid != 5003) {
            Nox.allowTransient(amount, address(confidentialToken));
        }
        burned = confidentialToken.burn(msg.sender, amount);
        settlementAsset.safeTransfer(msg.sender, publicAmount);

        emit BurnedAndWithdrawn(msg.sender, publicAmount, externalEuint256.unwrap(encryptedAmount));
    }

    function lockedBalance() external view returns (uint256) {
        return settlementAsset.balanceOf(address(this));
    }

    function _toVaultAmount(
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) private returns (euint256) {
        if (block.chainid == 31337 || block.chainid == 5003) {
            return euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        }
        return Nox.fromExternal(encryptedAmount, inputProof);
    }
}
