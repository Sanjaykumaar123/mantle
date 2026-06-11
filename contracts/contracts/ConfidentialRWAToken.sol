// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nox, euint256, externalEuint256, ebool} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";
import {IERC7984Receiver} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984Receiver.sol";

/// @title ConfidentialRWAToken
/// @notice Native confidential token based on iExec NOX ERC-7984 implementation.
contract ConfidentialRWAToken is ERC7984, Ownable {
    mapping(address => bool) private authorizedMinters;

    event AuthorizedMinterUpdated(address indexed minter, bool authorized);

    constructor() ERC7984("Confidential RWA Token", "cRWA", "") Ownable(msg.sender) {}

    modifier onlyOwnerOrAuthorizedMinter() {
        require(owner() == msg.sender || authorizedMinters[msg.sender], "ConfidentialRWAToken: not minter");
        _;
    }

    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "ConfidentialRWAToken: zero minter");
        authorizedMinters[minter] = authorized;
        emit AuthorizedMinterUpdated(minter, authorized);
    }

    function isAuthorizedMinter(address minter) external view returns (bool) {
        return authorizedMinters[minter];
    }

    function mint(
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwnerOrAuthorizedMinter returns (euint256) {
        euint256 amount;
        if (block.chainid == 31337 || block.chainid == 5003) {
            amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        } else {
            amount = Nox.fromExternal(encryptedAmount, inputProof);
        }
        return _mint(to, amount);
    }

    function mint(
        address to,
        euint256 amount
    ) external onlyOwnerOrAuthorizedMinter returns (euint256) {
        return _mint(to, amount);
    }

    function burn(
        address from,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwnerOrAuthorizedMinter returns (euint256) {
        euint256 amount;
        if (block.chainid == 31337 || block.chainid == 5003) {
            amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        } else {
            amount = Nox.fromExternal(encryptedAmount, inputProof);
        }
        return _burn(from, amount);
    }

    function burn(
        address from,
        euint256 amount
    ) external onlyOwnerOrAuthorizedMinter returns (euint256) {
        return _burn(from, amount);
    }

    function confidentialTransfer(
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) public override returns (euint256) {
        euint256 amount;
        if (block.chainid == 31337 || block.chainid == 5003) {
            amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        } else {
            amount = Nox.fromExternal(encryptedAmount, inputProof);
        }
        return _transfer(msg.sender, to, amount);
    }

    function confidentialTransfer(
        address to,
        euint256 amount
    ) public override returns (euint256) {
        return _transfer(msg.sender, to, amount);
    }

    function confidentialTransferFrom(
        address from,
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) public override returns (euint256) {
        require(isOperator(from, msg.sender), ERC7984UnauthorizedSpender(from, msg.sender));
        euint256 amount;
        if (block.chainid == 31337 || block.chainid == 5003) {
            amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        } else {
            amount = Nox.fromExternal(encryptedAmount, inputProof);
        }
        euint256 transferred = _transfer(from, to, amount);
        if (block.chainid != 31337 && block.chainid != 5003) {
            Nox.allowTransient(transferred, msg.sender);
        }
        return transferred;
    }

    function confidentialTransferFrom(
        address from,
        address to,
        euint256 amount
    ) public override returns (euint256) {
        require(isOperator(from, msg.sender), ERC7984UnauthorizedSpender(from, msg.sender));
        euint256 transferred = _transfer(from, to, amount);
        if (block.chainid != 31337 && block.chainid != 5003) {
            Nox.allowTransient(transferred, msg.sender);
        }
        return transferred;
    }

    function confidentialTransferAndCall(
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof,
        bytes calldata data
    ) public override returns (euint256 transferred) {
        if (block.chainid == 31337 || block.chainid == 5003) {
            euint256 amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
            transferred = _transfer(msg.sender, to, amount);
            if (to.code.length > 0) {
                try
                    IERC7984Receiver(to).onConfidentialTransferReceived(msg.sender, msg.sender, amount, data)
                returns (ebool retval) {
                    bool success = ebool.unwrap(retval) != bytes32(0);
                    if (!success) {
                        _transfer(to, msg.sender, amount);
                        transferred = euint256.wrap(bytes32(0));
                    }
                } catch (bytes memory reason) {
                    if (reason.length == 0) {
                        revert ERC7984InvalidReceiver(to);
                    } else {
                        assembly ("memory-safe") {
                            revert(add(32, reason), mload(reason))
                        }
                    }
                }
            }
        } else {
            transferred = super.confidentialTransferAndCall(to, encryptedAmount, inputProof, data);
        }
    }

    function confidentialTransferFromAndCall(
        address from,
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof,
        bytes calldata data
    ) public override returns (euint256 transferred) {
        require(isOperator(from, msg.sender), ERC7984UnauthorizedSpender(from, msg.sender));
        if (block.chainid == 31337 || block.chainid == 5003) {
            euint256 amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
            transferred = _transfer(from, to, amount);
            if (to.code.length > 0) {
                try
                    IERC7984Receiver(to).onConfidentialTransferReceived(msg.sender, from, amount, data)
                returns (ebool retval) {
                    bool success = ebool.unwrap(retval) != bytes32(0);
                    if (!success) {
                        _transfer(to, from, amount);
                        transferred = euint256.wrap(bytes32(0));
                    }
                } catch (bytes memory reason) {
                    if (reason.length == 0) {
                        revert ERC7984InvalidReceiver(to);
                    } else {
                        assembly ("memory-safe") {
                            revert(add(32, reason), mload(reason))
                        }
                    }
                }
            }
        } else {
            transferred = super.confidentialTransferFromAndCall(from, to, encryptedAmount, inputProof, data);
        }
    }

    function _update(
        address from,
        address to,
        euint256 amount
    ) internal override returns (euint256 transferred) {
        if (block.chainid == 31337 || block.chainid == 5003) {
            ERC7984Storage storage $ = _getERC7984Storage();
            uint256 cleanAmount = uint256(euint256.unwrap(amount));
            
            if (from == address(0)) {
                // Mint
                uint256 cleanTotalSupply = uint256(euint256.unwrap($._totalSupply));
                $._totalSupply = euint256.wrap(bytes32(cleanTotalSupply + cleanAmount));
            } else {
                // Transfer/burn
                uint256 cleanFromBalance = uint256(euint256.unwrap($._balances[from]));
                require(cleanFromBalance >= cleanAmount, "ConfidentialRWAToken: insufficient balance");
                $._balances[from] = euint256.wrap(bytes32(cleanFromBalance - cleanAmount));
            }

            transferred = amount;

            if (to == address(0)) {
                // Burn
                uint256 cleanTotalSupply = uint256(euint256.unwrap($._totalSupply));
                $._totalSupply = euint256.wrap(bytes32(cleanTotalSupply - cleanAmount));
            } else {
                // Mint/transfer
                uint256 cleanToBalance = uint256(euint256.unwrap($._balances[to]));
                $._balances[to] = euint256.wrap(bytes32(cleanToBalance + cleanAmount));
            }
            emit ConfidentialTransfer(from, to, transferred);
        } else {
            transferred = super._update(from, to, amount);
        }
    }
}
