# AEGIS AI — 100% Free Deployment Guide

This guide details how to deploy the entire AEGIS AI full-stack application (Next.js frontend, Rust backend, and PostgreSQL database) completely **for free** without needing a paid server.

---

## Step 1: Deploy the Database (Free PostgreSQL on Supabase)
We will use **Supabase** to host a free PostgreSQL database.

1. Go to [supabase.com](https://supabase.com) and sign up for a free account.
2. Click **New Project** and select the **Free tier**.
3. Set your project name (e.g., `aegis-db`) and database password.
4. Once the project is created, navigate to **Project Settings** -> **Database**.
5. Copy the **URI connection string** (make sure to choose the **Transaction** or **Session** pooler string, usually starting with `postgres://...`).
   * *Example:* `postgres://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
   * Replace `[YOUR-PASSWORD]` with the database password you chose.

---

## Step 2: Deploy the Backend (Free Rust Web Service on Render)
We will deploy your Rust backend on **Render** using the Docker configuration already present in the repository.

1. Go to [render.com](https://render.com) and sign up for a free account.
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/Sanjaykumaar123/TURING.git`.
4. Configure the Web Service settings:
   * **Name**: `aegis-backend`
   * **Region**: Choose the one closest to you.
   * **Branch**: `main`
   * **Runtime**: `Docker`
   * **Instance Type**: **Free** ($0/month)
5. Click **Advanced** to add the following **Environment Variables**:
   * `DATABASE_URL` = *(Paste your Supabase connection URI from Step 1)*
   * `BACKEND_PORT` = `8080`
   * `AUTH_ADMIN_WALLETS` = `0xf21b5742477a5e065ef86dedba40b34527ac93fd,0xEc08da877d409293C006523DB95BA291f43E3249`
6. Click **Deploy Web Service**. Render will automatically pull the code, build the Docker container, bootstrap the database schema, and launch the server.
7. Once deployed, copy your backend URL (e.g. `https://aegis-backend.onrender.com`).

---

## Step 3: Deploy the Frontend (Free Next.js on Vercel)
We will deploy the frontend on **Vercel** which is optimized for Next.js.

1. Go to [vercel.com](https://vercel.com) and sign up for a free Hobby account using your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your repository: `TURING`.
4. Configure the Project settings:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
5. Expand **Environment Variables** and add the following keys:
   * `NEXT_PUBLIC_API_BASE_URL` = *(Your Render backend URL from Step 2, e.g., `https://aegis-backend.onrender.com`)*
   * `INTERNAL_API_BASE_URL` = *(Your Render backend URL from Step 2)*
   * `NEXT_PUBLIC_CHAIN_ID` = `421614`
   * `NEXT_PUBLIC_RPC_URL` = `https://sepolia-rollup.arbitrum.io/rpc`
   * `NEXT_PUBLIC_CONTRACT_CONFIDENTIAL_RWA_TOKEN` = `0x00094fc240029a342fB1152bBc7a15F73C7142C2`
   * `NEXT_PUBLIC_CONTRACT_DISCLOSURE_REGISTRY` = `0x5118aEC317dC21361Cad981944532F1f90D7aBb8`
   * `NEXT_PUBLIC_CONTRACT_TRANSFER_CONTROLLER` = `0x049B1712B9E624a01Eb4C40d10aBF42E89a14314`
   * `NEXT_PUBLIC_CONTRACT_AUDIT_ANCHOR` = `0x79279257A998d3a5E26B70cb538b09fEe2f90174`
   * `NEXT_PUBLIC_CONTRACT_TENANT_FACTORY` = `0x7925dA6c8376D5D9a0A62fe9242f7542f9e3307d`
6. Click **Deploy**. Vercel will build your Next.js application and host it on a free `.vercel.app` subdomain!

---

## 🎉 Done!
Your full-stack application is now deployed:
* Supabase handles the database storage.
* Render runs the Rust API server.
* Vercel hosts the Next.js frontend dashboard.
* **Auto-deployments**: Whenever you push updates to GitHub, both Render and Vercel will automatically fetch the changes and redeploy them.
