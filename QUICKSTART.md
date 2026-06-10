# AEGIS AI — Quick Start Guide

## What's New
**AEGIS AI** is a renamed and enhanced version of the Confidential RWA OS with an all-new **Confidential Asset Intelligence Center** module that provides explainable institutional insights on every aspect of the platform.

---

## Platform Modules

### Core Modules (Preserved from RWA OS)
1. **Dashboard** — Live operational metrics
2. **Onboarding** — Institution wallet registration
3. **Assets** — Tokenized RWA registry
4. **Investors** — Investor wallet mapping
5. **Settlement** — Settlement vault operations
6. **Transfers** — Confidential transfer execution
7. **Disclosures** — Selective disclosure grants
8. **Audit** — Audit trail and anchoring
9. **Compliance** — Compliance passport center
10. **Settings** — Configuration and policies

### New Module
**⭐ Intelligence Center** — Explainable institutional intelligence layer
- Executive Intelligence Dashboard
- Asset Intelligence (health, liquidity, concentration, regulatory exposure)
- Compliance Intelligence (violations, policy weaknesses)
- Disclosure Intelligence (scope recommendations, expiration guidance)
- Audit Intelligence (confidence scores, anomaly detection)
- Institutional Risk Center (asset, investor, transfer, compliance risk)

---

## Local Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Rust 1.88+ (for backend development)
- PostgreSQL 16 (or use Docker)

### Environment Variables

#### Backend (`.env`)
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/aegisai_backend
BACKEND_PORT=8080
AUTH_TOKEN_SECRET=dev-secret-change-me
AUTH_ADMIN_WALLETS=0x...
AUTH_OPERATOR_WALLETS=0x...
AUTH_AUDITOR_WALLETS=0x...
```

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_ORGANIZATION_NAME=AEGIS Organization
NEXT_PUBLIC_PRODUCT_NAME=AEGIS AI — Confidential Asset Intelligence Network
NEXT_PUBLIC_NETWORK_NAME=Arbitrum Sepolia
NEXT_PUBLIC_ENVIRONMENT_LABEL=Development
NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
NEXT_PUBLIC_CONTRACT_CONFIDENTIAL_RWA_TOKEN=0x...
```

### Start Development Environment

**Option 1: Docker Compose (Recommended)**
```bash
cd rwaOS-mvp
docker-compose up
```

This will start:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8080
- **PostgreSQL:** localhost:5432 (aegisai_backend)

**Option 2: Manual Local Development**

**Start PostgreSQL:**
```bash
createdb aegisai_backend
```

**Start Backend:**
```bash
cd backend
export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/aegisai_backend
cargo run
```

**Start Frontend (in new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## Platform Workflows

### 1. Institutional Onboarding
Navigate to **Onboarding** to register new institutions and map wallets to roles:
- Admin: Full platform access
- Operator: Asset management, transfer execution
- Auditor: Audit trail review, compliance verification

### 2. Asset Issuance
In **Assets**, create and manage tokenized RWA:
- Define asset properties (name, symbol, type)
- Set initial supply
- Configure disclosure visibility

### 3. Investor Registration
In **Investors**, register and whitelist investors:
- Verify KYC status
- Map wallet addresses
- Set allocation limits

### 4. Confidential Transfers
In **Transfers**, execute private asset transfers:
- Select sender and recipient from registered investors
- Specify amount (confidential by default)
- Generate disclosure grants automatically

### 5. Disclosure Management
In **Disclosures**, manage who can see what:
- Grant temporary access to auditors
- Set expiration dates
- Define scope (operational, compliance, regulatory)

### 6. Audit & Compliance
- **Audit:** Review complete event trail with proof anchors
- **Compliance:** Issue and verify compliance passports

### 7. Intelligence Center (NEW)
In **⭐ Intelligence Center**, get institutional insights:
- View executive dashboard with key metrics
- Analyze asset health and risk exposure
- Review compliance posture
- Check audit confidence scores
- Identify policy weaknesses
- Get evidence-based recommendations

---

## Navigation

**Sidebar Menu (Left):**
- 🏠 Dashboard
- ⭐ **Intelligence Center** (NEW)
- ✨ Onboarding
- 🏢 Assets
- 👥 Investors
- 💰 Settlement
- ↔️ Transfers
- 👁️ Disclosures
- 🔐 Audit
- 🔑 Compliance Passports
- ⚙️ Settings

---

## Key Features

### Explainable Intelligence
Every insight in the Intelligence Center includes:
- ✅ **Confidence Score** — How certain is this analysis?
- ✅ **Evidence** — What data supports this finding?
- ✅ **Reasoning** — Why is this insight important?
- ✅ **Action** — What should the user do next?

### Enterprise Security
- Role-based access control (RBAC)
- Wallet-based authentication with signature verification
- Confidential transfer amounts (ERC-7984)
- Audit-ready compliance trails
- Tenant-isolated contracts

### Institutional Grade
- Bloomberg-style analytics dashboards
- Palantir-inspired intelligence views
- Glassmorphic dark enterprise design
- Responsive layout for all devices

---

## Development Commands

### Backend
```bash
cd backend

# Run tests
cargo test

# Build release
cargo build --release

# Check formatting
cargo fmt

# Run linter
cargo clippy
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Check types
npm run type-check
```

### Docker
```bash
# Build all images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Database

**Default Connection String:**
```
postgres://postgres:postgres@localhost:5432/aegisai_backend
```

**Reset Database (Local):**
```bash
dropdb aegisai_backend
createdb aegisai_backend
```

Backend automatically runs migrations on startup.

---

## Authentication

### Built-in Test Users
- **Username:** `admin_user` → Token: `admin-token` (Admin role)
- **Username:** `operator_user` → Token: `operator-token` (Operator role)
- **Username:** `auditor_user` → Token: `auditor-token` (Auditor role)

### Wallet Login (Web3)
1. Click "Connect wallet" on login page
2. Approve challenge signature in wallet
3. Backend verifies signature and issues session token
4. Role determined by wallet allowlist

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000 (frontend)
lsof -i :3000
kill -9 <PID>

# Or change frontend port
npm run dev -- -p 3001
```

### Database Connection Failed
```bash
# Verify PostgreSQL is running
docker-compose ps

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Package Build Fails
```bash
# Backend: Clear cache
cd backend && cargo clean && cargo build

# Frontend: Clear cache
cd frontend && rm -rf node_modules .next && npm install
```

---

## Production Deployment

### Environment Setup
```bash
# Use strong values in production
export AUTH_TOKEN_SECRET=$(openssl rand -hex 32)
export DATABASE_URL=postgres://prod_user:secure_password@prod_host:5432/aegisai_backend
export BACKEND_PORT=8080
```

### Docker Build
```bash
docker build -t aegisai-backend:latest ./backend
docker build -t aegisai-frontend:latest ./frontend
```

### Deployment
```bash
# Update docker-compose.yml with production values
docker-compose -f docker-compose.prod.yml up -d
```

---

## Support & Documentation

- **Backend Docs:** `backend/README.md`
- **Frontend Docs:** `frontend/README.md`
- **Smart Contracts:** `contracts/README.md`
- **Transformation Summary:** `AEGIS_AI_TRANSFORMATION.md`

---

## Architecture Overview

```
AEGIS AI
├── Frontend (Next.js + TypeScript)
│   ├── Dashboard
│   ├── ⭐ Intelligence Center (NEW)
│   ├── Onboarding
│   ├── Asset Management
│   ├── Investor Registry
│   ├── Transfer Execution
│   ├── Disclosure Management
│   ├── Audit Center
│   └── Compliance Passports
├── Backend (Rust + Axum)
│   ├── Asset Registry Module
│   ├── Investor Registry Module
│   ├── Transfer Operations Module
│   ├── Disclosure Management Module
│   ├── Audit Reporting Module
│   ├── Compliance Passports Module
│   ├── Identity & Access Module
│   └── Tenant Contracts Module
├── Database (PostgreSQL)
│   └── aegisai_backend
├── Smart Contracts (Solidity/Hardhat)
│   ├── ConfidentialRWAToken (ERC-7984)
│   ├── TransferController
│   ├── DisclosureRegistry
│   ├── AuditAnchor
│   └── Settlement Vault
└── Test Suite
    ├── Integration Tests (Rust)
    ├── E2E Tests (Playwright)
    └── Contract Tests (Hardhat/Chai)
```

---

**AEGIS AI is ready for institutional use. Start exploring the Intelligence Center to unlock confidential asset insights!**
