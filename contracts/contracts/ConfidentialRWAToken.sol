// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";

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

    function confidentialTransferAndCall(
        address to,
        externalEuint256 encryptedAmount,
        bytes calldata inputProof,
        bytes calldata data
    ) public override returns (euint256 transferred) {
        euint256 amount;
        if (block.chainid == 31337 || block.chainid == 5003) {
            amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        } else {
            amount = Nox.fromExternal(encryptedAmount, inputProof);
        }
        transferred = _transferAndCall(msg.sender, to, amount, data);
        if (block.chainid != 31337 && block.chainid != 5003) {
            Nox.allowTransient(transferred, msg.sender);
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
        euint256 amount;
        if (block.chainid == 31337 || block.chainid == 5003) {
            amount = euint256.wrap(externalEuint256.unwrap(encryptedAmount));
        } else {
            amount = Nox.fromExternal(encryptedAmount, inputProof);
        }
        transferred = _transferAndCall(from, to, amount, data);
        if (block.chainid != 31337 && block.chainid != 5003) {
            Nox.allowTransient(transferred, msg.sender);
        }
    }
}
