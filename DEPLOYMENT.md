# AEGIS AI — Full-Stack Deployment Guide

This guide details the steps to deploy the AEGIS AI platform (Next.js frontend, Rust backend, PostgreSQL database, and Web3 configurations) to a production environment.

---

## Deployment Option A: Single-Server VPS (Recommended)
This is the simplest and most cost-effective method. It uses your existing `docker-compose.yml` configuration to run the database, backend, and frontend inside a virtual private server (e.g., DigitalOcean Droplet, Linode, AWS EC2, or Hetzner).

### Step 1: Set up your Server (VPS)
1. Launch a Linux server running **Ubuntu 22.04 LTS** (minimum 2 GB RAM recommended).
2. SSH into your server:
   ```bash
   ssh root@your_server_ip
   ```
3. Update system packages and install Docker + Docker Compose:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install docker.io docker-compose-v2 git -y
   ```
4. Verify the installations:
   ```bash
   docker --version
   docker compose version
   ```

### Step 2: Clone the Codebase
1. Clone your GitHub repository on the VPS:
   ```bash
   git clone https://github.com/Sanjaykumaar123/TURING.git
   cd TURING
   ```

### Step 3: Run the Services
1. Start the entire application suite in the background:
   ```bash
   docker compose up --build -d
   ```
2. Check that all containers are healthy:
   ```bash
   docker compose ps
   ```
3. View runtime logs:
   ```bash
   docker compose logs -f
   ```

### Step 4: Configure Domain and SSL (Nginx Reverse Proxy)
To securely serve the frontend on a domain over HTTPS (`https://yourdomain.com`):
1. Install Nginx:
   ```bash
   sudo apt install nginx -y
   ```
2. Configure Nginx to forward traffic to `http://localhost:3389`:
   Create `/etc/nginx/sites-available/aegis` and add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3389;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Enable the config and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/aegis /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. Secure with free SSL using Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Deployment Option B: Managed PaaS (Render / Railway / fly.io)
If you prefer not to manage server instances, you can deploy the services individually on PaaS platforms.

### 1. Database (PostgreSQL)
* Create a **Managed PostgreSQL Database** on Render, Railway, or Supabase.
* Copy the external Database connection string: `postgres://user:password@host:port/database_name`

### 2. Backend (Rust App)
* **Platform**: Render (Web Service) or Railway.
* **Build Command**: `cargo build --release` (or use the `backend/Dockerfile`).
* **Start Command**: `./target/release/aegis_ai_backend`
* **Port**: `8080`
* **Environment Variables**:
  * `DATABASE_URL`: Your managed Postgres URL.
  * `BACKEND_PORT`: `8080`
  * `AUTH_ADMIN_WALLETS`: Admin addresses (separated by commas).

### 3. Frontend (Next.js App)
* **Platform**: Vercel (recommended) or Render (Web Service).
* **Build Command**: `npm run build`
* **Start Command**: `npm run start`
* **Environment Variables**:
  * `NEXT_PUBLIC_API_BASE_URL`: URL of your deployed Rust backend (e.g. `https://your-backend.onrender.com`).
  * `INTERNAL_API_BASE_URL`: URL of your deployed Rust backend.
  * `NEXT_PUBLIC_CHAIN_ID`: `421614` (Arbitrum Sepolia).
  * `NEXT_PUBLIC_RPC_URL`: `https://sepolia-rollup.arbitrum.io/rpc`.
  * `NEXT_PUBLIC_CONTRACT_CONFIDENTIAL_RWA_TOKEN`: Deployed contract address.
  * `NEXT_PUBLIC_CONTRACT_DISCLOSURE_REGISTRY`: Deployed contract address.
  * `NEXT_PUBLIC_CONTRACT_TRANSFER_CONTROLLER`: Deployed contract address.
  * `NEXT_PUBLIC_CONTRACT_AUDIT_ANCHOR`: Deployed contract address.
  * `NEXT_PUBLIC_CONTRACT_TENANT_FACTORY`: Deployed contract address.
