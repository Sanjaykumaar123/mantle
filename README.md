# AEGIS AI — Confidential Asset Intelligence Network

AEGIS AI is a confidential operating system for tokenized real-world assets. It preserves the core Confidential RWA workflow (Institution Onboarding → Asset Issuance → Investor Registry → Confidential Transfers → Disclosure Management → Audit Anchoring → Compliance Passports) and adds a platform-wide Confidential Asset Intelligence Layer that provides explainable institutional decision support.

The demo targets Arbitrum Sepolia and uses iExec NOX confidential token primitives for encrypted amounts and browser-generated proof payloads.

## What Is Included

- Next.js frontend with RainbowKit wallet login.
- Rust/Axum backend with PostgreSQL persistence.
- Solidity/Hardhat contracts for confidential RWA tokens, disclosure registry, transfer controller, audit anchor, tenant factory, settlement vault, and demo RWAUSD.
- Docker Compose local runtime.
- Arbitrum Sepolia contract configuration for the hosted demo flow.

## Requirements

- Docker and Docker Compose.
- Node.js 20+ for frontend/contracts development outside Docker.
- Rust 1.88+ only if running the backend outside Docker.
- A browser wallet on Arbitrum Sepolia for on-chain flows.

## Quick Start With Docker

```bash
git clone https://github.com/pandu926/rwaOS-mvp.git
cd rwaOS-mvp
docker compose up -d --build
```

Open the app:

```text
http://localhost:3389
```

The backend is available inside Docker as `http://backend:8080`. PostgreSQL is started automatically by Compose.

## Local Demo Flow

1. Open `http://localhost:3389`.
2. Connect a wallet on Arbitrum Sepolia.
3. Create or load a tenant from Onboarding.
4. Mint demo RWAUSD from the onboarding faucet if needed.
5. Create an asset and issue confidential supply to the connected wallet.
6. Add an investor/recipient wallet.
7. Grant disclosure for the sender wallet.
8. Set the transfer controller as operator when prompted.
9. Initiate a confidential transfer.
10. Review Audit and Passports for proof references and visibility-gated amount display.

## Frontend Development

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Default dev URL:

```text
http://localhost:3000
```

Build and lint:

```bash
npm run build
npm run lint
```

## Backend Development

```bash
cd backend
cargo test
```

To run the backend manually, provide a PostgreSQL `DATABASE_URL` and `BACKEND_PORT`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/aegisai_backend \
BACKEND_PORT=8080 \
cargo run
```

For most reviewers, Docker Compose is the simplest path because it starts PostgreSQL and wires the frontend to the backend automatically.

## Smart Contracts

```bash
cd contracts
cp .env.example .env
npm install
npm run compile
npm test
```

Deploying to Arbitrum Sepolia requires a funded deployer key in `contracts/.env`:

```text
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

Never commit real private keys. `.env` files are ignored by Git.

## Useful Commands

```bash
# Build and start everything
docker compose up -d --build

# Show containers
docker compose ps

# Frontend logs
docker compose logs -f frontend

# Backend logs
docker compose logs -f backend

# Stop local runtime
docker compose stop
```

## Public Repository Notes

This public repo intentionally excludes internal planning documents, Stitch design exports, local `.env` files, and private proof notes. The code, public examples, Docker setup, and contract ABIs needed to build and run the MVP are included.
