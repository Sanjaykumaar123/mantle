# AEGIS AI Database Schema & Migration Guide

## Database Overview

### Connection String
```
postgres://postgres:postgres@localhost:5432/aegisai_backend
```

### Schema Naming Convention
- Tables: `snake_case` (e.g., `asset_registry`, `transfer_operations`)
- Columns: `snake_case` (e.g., `created_at`, `holder_wallet`)
- Indexes: `idx_{table}_{column}` (e.g., `idx_transfers_status`)
- Foreign Keys: `fk_{table}_{ref_table}` (e.g., `fk_transfers_assets`)

---

## Existing Tables (Preserved from RWA OS)

### Core Tables

**institutions**
```sql
CREATE TABLE institutions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  wallet VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**asset_registry**
```sql
CREATE TABLE asset_registry (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  asset_type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'Active',
  issuer_id BIGINT NOT NULL REFERENCES institutions(id),
  jurisdiction VARCHAR,
  holders_count INT DEFAULT 0,
  confidential_aum DECIMAL(20,8),
  aum_visibility VARCHAR DEFAULT 'Restricted',
  yield DECIMAL(5,2),
  last_activity TIMESTAMP,
  metadata_uri VARCHAR,
  issuance_wallet VARCHAR,
  initial_supply DECIMAL(20,8),
  anchor_hash VARCHAR,
  anchor_tx_hash VARCHAR,
  issuance_tx_hash VARCHAR,
  created_at_unix BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**investor_registry**
```sql
CREATE TABLE investor_registry (
  id BIGSERIAL PRIMARY KEY,
  institution_id BIGINT NOT NULL REFERENCES institutions(id),
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  role VARCHAR,
  whitelist_status VARCHAR DEFAULT 'Pending review',
  assets_count INT DEFAULT 0,
  allocation DECIMAL(20,8),
  last_activity TIMESTAMP,
  jurisdiction VARCHAR,
  wallet_mapped BOOLEAN DEFAULT FALSE,
  sent_transfers INT DEFAULT 0,
  received_transfers INT DEFAULT 0,
  disclosure_grants INT DEFAULT 0,
  initial_holder_assets_count INT DEFAULT 0,
  readiness VARCHAR DEFAULT 'Needs wallet mapping',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**transfer_operations**
```sql
CREATE TABLE transfer_operations (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT NOT NULL REFERENCES asset_registry(id),
  from_investor_id BIGINT NOT NULL REFERENCES investor_registry(id),
  to_investor_id BIGINT NOT NULL REFERENCES investor_registry(id),
  amount DECIMAL(20,8),
  amount_visibility VARCHAR DEFAULT 'Hidden',
  status VARCHAR DEFAULT 'Submitted',
  submitted_at TIMESTAMP,
  reference VARCHAR,
  tx_hash VARCHAR,
  disclosure_data_id VARCHAR,
  sender_wallet VARCHAR,
  recipient_wallet VARCHAR,
  failure_reason VARCHAR,
  reference_note VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**disclosure_registry**
```sql
CREATE TABLE disclosure_registry (
  id BIGSERIAL PRIMARY KEY,
  grantee VARCHAR NOT NULL,
  grantee_address VARCHAR NOT NULL,
  asset_id BIGINT NOT NULL REFERENCES asset_registry(id),
  scope VARCHAR NOT NULL,
  granted_by VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**audit_events**
```sql
CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  actor VARCHAR NOT NULL,
  target VARCHAR NOT NULL,
  visibility VARCHAR DEFAULT 'Confidential',
  result VARCHAR DEFAULT 'Review required',
  timestamp TIMESTAMP,
  reference VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**compliance_passports**
```sql
CREATE TABLE compliance_passports (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT NOT NULL REFERENCES transfer_operations(id),
  transfer_id_onchain VARCHAR,
  status VARCHAR DEFAULT 'Anchored',
  policy_hash VARCHAR NOT NULL,
  disclosure_data_id VARCHAR NOT NULL,
  anchor_hash VARCHAR NOT NULL,
  transfer_tx_hash VARCHAR NOT NULL,
  anchor_tx_hash VARCHAR NOT NULL,
  disclosure_scope TEXT ARRAY,
  reason VARCHAR,
  created_by VARCHAR NOT NULL,
  created_by_role VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**institution_users**
```sql
CREATE TABLE institution_users (
  id BIGSERIAL PRIMARY KEY,
  institution_id BIGINT NOT NULL REFERENCES institutions(id),
  wallet_address VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**tenant_contracts**
```sql
CREATE TABLE tenant_contracts (
  id BIGSERIAL PRIMARY KEY,
  institution_id BIGINT NOT NULL REFERENCES institutions(id),
  contract_address VARCHAR NOT NULL UNIQUE,
  contract_name VARCHAR NOT NULL,
  abi JSONB,
  deployment_block BIGINT,
  deployment_tx VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## New Tables for Intelligence Center

### Intelligence Scoring & Analytics

**intelligence_scores**
```sql
CREATE TABLE intelligence_scores (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR NOT NULL, -- 'asset', 'investor', 'transfer', 'institution'
  entity_id BIGINT NOT NULL,
  score_type VARCHAR NOT NULL, -- 'health', 'liquidity', 'risk', 'compliance'
  score_value DECIMAL(5,2),
  confidence DECIMAL(5,2),
  calculation_data JSONB, -- Raw calculation metrics
  evidence TEXT ARRAY,
  reasoning TEXT,
  suggested_action TEXT,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intelligence_scores_entity ON intelligence_scores(entity_type, entity_id);
CREATE INDEX idx_intelligence_scores_type ON intelligence_scores(score_type);
CREATE INDEX idx_intelligence_scores_expires ON intelligence_scores(expires_at);
```

**asset_health_metrics**
```sql
CREATE TABLE asset_health_metrics (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT NOT NULL REFERENCES asset_registry(id),
  health_score DECIMAL(5,2),
  liquidity_score DECIMAL(5,2),
  concentration_score DECIMAL(5,2),
  regulatory_exposure_score DECIMAL(5,2),
  transfer_frequency INT, -- transfers per month
  unique_counterparties INT,
  avg_transfer_size DECIMAL(20,8),
  top_holder_percentage DECIMAL(5,2),
  jurisdiction_mix JSONB,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_health_asset ON asset_health_metrics(asset_id);
```

**compliance_violations**
```sql
CREATE TABLE compliance_violations (
  id BIGSERIAL PRIMARY KEY,
  violation_type VARCHAR NOT NULL,
  severity VARCHAR NOT NULL, -- 'low', 'medium', 'high', 'critical'
  entity_type VARCHAR NOT NULL,
  entity_id BIGINT,
  transfer_id BIGINT REFERENCES transfer_operations(id),
  description TEXT NOT NULL,
  evidence JSONB,
  remediation_suggested TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_violations_entity ON compliance_violations(entity_type, entity_id);
CREATE INDEX idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX idx_compliance_violations_resolved ON compliance_violations(resolved);
```

**risk_assessments**
```sql
CREATE TABLE risk_assessments (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR NOT NULL, -- 'asset', 'investor', 'transfer', 'institution', 'jurisdiction'
  entity_id BIGINT,
  risk_category VARCHAR NOT NULL, -- 'asset', 'investor', 'transfer', 'compliance', 'jurisdiction'
  risk_level VARCHAR NOT NULL, -- 'low', 'medium', 'high', 'critical'
  risk_score DECIMAL(5,2),
  confidence DECIMAL(5,2),
  factors JSONB, -- Risk component breakdown
  evidence TEXT ARRAY,
  mitigation_actions TEXT ARRAY,
  trend VARCHAR DEFAULT 'stable', -- 'improving', 'stable', 'worsening'
  assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_entity ON risk_assessments(entity_type, entity_id);
CREATE INDEX idx_risk_assessments_level ON risk_assessments(risk_level);
```

**audit_confidence_metrics**
```sql
CREATE TABLE audit_confidence_metrics (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT NOT NULL REFERENCES transfer_operations(id),
  confidence_score DECIMAL(5,2),
  anchor_frequency_adherence DECIMAL(5,2),
  proof_integrity DECIMAL(5,2),
  disclosure_continuity DECIMAL(5,2),
  missing_evidence_count INT DEFAULT 0,
  anomalies_detected JSONB,
  audit_summary TEXT,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_confidence_transfer ON audit_confidence_metrics(transfer_id);
```

**disclosure_recommendations**
```sql
CREATE TABLE disclosure_recommendations (
  id BIGSERIAL PRIMARY KEY,
  disclosure_id BIGINT NOT NULL REFERENCES disclosure_registry(id),
  recommended_scope TEXT ARRAY,
  recommended_expiry_days INT,
  over_disclosure_risk DECIMAL(5,2),
  under_disclosure_risk DECIMAL(5,2),
  evidence JSONB,
  reasoning TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disclosure_recommendations_disclosure ON disclosure_recommendations(disclosure_id);
```

**regulatory_events**
```sql
CREATE TABLE regulatory_events (
  id BIGSERIAL PRIMARY KEY,
  jurisdiction VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  impact_level VARCHAR NOT NULL, -- 'low', 'medium', 'high'
  effective_date TIMESTAMP,
  affected_assets BIGINT ARRAY,
  tracking_required BOOLEAN DEFAULT FALSE,
  event_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_regulatory_events_jurisdiction ON regulatory_events(jurisdiction);
CREATE INDEX idx_regulatory_events_effective ON regulatory_events(effective_date);
```

---

## Indexes (Performance Optimization)

### Required Indexes
```sql
-- Asset queries
CREATE INDEX idx_asset_status ON asset_registry(status);
CREATE INDEX idx_asset_issuer ON asset_registry(issuer_id);

-- Transfer queries
CREATE INDEX idx_transfer_asset ON transfer_operations(asset_id);
CREATE INDEX idx_transfer_status ON transfer_operations(status);
CREATE INDEX idx_transfer_from ON transfer_operations(from_investor_id);
CREATE INDEX idx_transfer_to ON transfer_operations(to_investor_id);

-- Investor queries
CREATE INDEX idx_investor_institution ON investor_registry(institution_id);
CREATE INDEX idx_investor_whitelist ON investor_registry(whitelist_status);

-- Disclosure queries
CREATE INDEX idx_disclosure_asset ON disclosure_registry(asset_id);
CREATE INDEX idx_disclosure_status ON disclosure_registry(status);
CREATE INDEX idx_disclosure_expires ON disclosure_registry(expires_at);

-- Audit queries
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);

-- Intelligence queries
CREATE INDEX idx_intelligence_entity ON intelligence_scores(entity_type, entity_id);
CREATE INDEX idx_intelligence_calculated ON intelligence_scores(calculated_at);
```

---

## Migrations

### Migration: Add Intelligence Center Tables (Version 001)
```sql
-- Create intelligence_scores table
CREATE TABLE intelligence_scores (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id BIGINT NOT NULL,
  score_type VARCHAR NOT NULL,
  score_value DECIMAL(5,2),
  confidence DECIMAL(5,2),
  calculation_data JSONB,
  evidence TEXT ARRAY,
  reasoning TEXT,
  suggested_action TEXT,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add other Intelligence tables...

-- Create indexes
CREATE INDEX idx_intelligence_scores_entity ON intelligence_scores(entity_type, entity_id);
-- ... additional indexes
```

### Rollback Strategy
Each migration includes a reverse migration:
```sql
-- Rollback version 001
DROP TABLE IF EXISTS intelligence_scores;
DROP TABLE IF EXISTS asset_health_metrics;
-- ... other tables
```

---

## Data Refresh Strategy

### Real-time Scores (Updated Every 5 Minutes)
- Asset liquidity metrics
- Compliance violation detection
- Transfer risk assessment

### Daily Scores (Batch Job)
- Asset health index
- Investor risk profile
- Institutional compliance score
- Audit confidence metrics

### Weekly Scores (Batch Job)
- Trend analysis
- Regulatory impact assessment
- Policy effectiveness review

### Monthly Scores (Manual Review)
- Jurisdictional risk assessment
- Long-term trend analysis
- Strategic recommendations

---

## Backup & Recovery

### Backup Strategy
```bash
# Daily backups
pg_dump aegisai_backend | gzip > aegisai_backup_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip < aegisai_backup_20260408.sql.gz | psql aegisai_backend
```

### Point-in-Time Recovery
```sql
-- Enable WAL archiving
-- Configure recovery target time/transaction

-- Perform recovery
pg_ctl stop
cp -r backup_data pg_wal/
pg_ctl start
```

---

## Performance Tuning

### Connection Pool Settings
```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 64MB
```

### Query Optimization
```sql
-- Enable query plan analysis
EXPLAIN ANALYZE SELECT ...

-- Vacuum & Analyze statistics
VACUUM ANALYZE intelligence_scores;
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
- Query performance (>1s alert)
- Index bloat (>20% alert)
- Table bloat (>30% alert)
- Connection usage (>80% alert)
- Disk usage (>85% alert)

### Recommended Monitoring Tools
- pg_stat_statements
- pgAdmin
- DataGrip
- CloudSQL Monitoring (if using Cloud)

---

## Conclusion
The AEGIS AI database architecture preserves the Confidential RWA OS schema while adding Intelligence Center tables for scoring, risk assessment, and compliance tracking. All new tables are fully indexed and designed for real-time analytical queries.

**Current Schema Version: 1.0 (Initial release)**
**Last Updated: 2026-06-08**
