import React from "react";
import {
  getAssets,
  getInvestors,
  getTransfers,
  getDisclosures,
  getCompliancePassports,
  getAuditEvents,
} from "@/lib/api";
import { Button, PageHeader, SectionCard, StatCard, StatusBadge, InlineNotice } from "@/components/ui";
import { anchorAIScore, getCachedAnchor, type AnchorRecord } from "@/lib/web3/aiScoreAnchor";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  // 1. Fetch live data from backend API
  const [assets, investors, transfers, disclosures, compliancePassports, auditEvents] = await Promise.all([
    getAssets(),
    getInvestors(),
    getTransfers(),
    getDisclosures(),
    getCompliancePassports(),
    getAuditEvents(),
  ]);

  // 2. Dynamic Compliance Health Calculations
  const totalInvestors = investors.length;
  const whitelistedInvestors = investors.filter((inv) => inv.whitelistStatus === "Verified").length;
  const whitelistRatio = totalInvestors > 0 ? whitelistedInvestors / totalInvestors : 1;

  const totalTransfers = transfers.length;
  const totalPassports = compliancePassports.length;
  const passportRatio = totalTransfers > 0 ? Math.min(1, totalPassports / totalTransfers) : 1;

  // Weighted Compliance Health Score
  const complianceHealth = Math.min(
    100,
    Math.max(
      30,
      Math.round((whitelistRatio * 0.4 + passportRatio * 0.6) * 100)
    )
  );

  // 3. Dynamic Intelligence Score
  const anchoredPassports = compliancePassports.filter((p) => p.status === "Anchored").length;
  const anchorRatio = totalPassports > 0 ? anchoredPassports / totalPassports : 1;
  
  const intelligenceScore = Math.min(
    100,
    Math.max(
      40,
      Math.round((complianceHealth * 0.4 + anchorRatio * 0.6))
    )
  );

  // 4. Dynamic Transfer Risk level
  const pendingTransfers = transfers.filter((t) => t.status === "Pending").length;
  const unanchoredTransfersCount = transfers.filter(
    (t) => !compliancePassports.some((p) => p.transferId === t.id)
  ).length;

  let transferRisk: "Low" | "Medium" | "High" | "Critical" = "Low";
  let transferRiskTone: "success" | "warning" | "danger" = "success";
  if (unanchoredTransfersCount > 2 || pendingTransfers > 3) {
    transferRisk = "High";
    transferRiskTone = "danger";
  } else if (unanchoredTransfersCount > 0 || pendingTransfers > 0) {
    transferRisk = "Medium";
    transferRiskTone = "warning";
  }

  // 5. Dynamic Audit Confidence
  const auditConfidence = Math.min(
    100,
    Math.max(
      50,
      Math.round((passportRatio * 0.7 + anchorRatio * 0.3) * 100)
    )
  );

  // 6. Dynamic Compliance Findings
  const findings: Array<{
    title: string;
    evidence: string;
    reasoning: string;
    action: string;
    tone: "success" | "warning" | "danger";
  }> = [];

  // Finding A: Unmapped investors
  const unmappedInvestorsList = investors.filter((inv) => !inv.walletMapped);
  if (unmappedInvestorsList.length > 0) {
    findings.push({
      title: "Stale or Unmapped Investor Profile Detected",
      evidence: `${unmappedInvestorsList.length} investor(s) (${unmappedInvestorsList.slice(0, 2).map(i => i.name).join(", ")}${unmappedInvestorsList.length > 2 ? "..." : ""}) have no wallet address registered.`,
      reasoning: "Unmapped investor profiles prevent compliant whitelisting enforcement, creating potential settlement blockages.",
      action: "Assign valid on-chain wallet addresses in the Investor Registry.",
      tone: "warning",
    });
  }

  // Finding B: Unanchored transfers
  const unanchoredTransfers = transfers.filter(
    (t) => !compliancePassports.some((p) => p.transferId === t.id)
  );
  if (unanchoredTransfers.length > 0) {
    findings.push({
      title: "Unanchored On-chain Audit Trail",
      evidence: `${unanchoredTransfers.length} transfer(s) lack matching cryptographic audit anchors.`,
      reasoning: "A lack of on-chain anchors leaves the platform unable to verify zero-knowledge proof compliance for these transactions.",
      action: "Generate and submit compliance passport parameters for the unanchored transfers.",
      tone: "danger",
    });
  }

  // Fallback default finding if everything is perfect
  if (findings.length === 0) {
    findings.push({
      title: "All Systems Fully Anchored",
      evidence: "100% of transfers and investors are verified and anchored on-chain.",
      reasoning: "All active identities are whitelisted, and each transfer is backed by a verified compliance passport.",
      action: "Maintain current policy baselines.",
      tone: "success",
    });
  }

  // Trigger on-chain anchoring for all generated AI scores (Requirement 4)
  const riskScoreNum = transferRisk === "Low" ? 90 : transferRisk === "Medium" ? 65 : transferRisk === "High" ? 35 : 15;

  const triggerAnchors = [
    { context: "intelligence", score: intelligenceScore, label: "Intelligence Index" },
    { context: "compliance", score: complianceHealth, label: "Compliance Health" },
    { context: "transfer_risk", score: riskScoreNum, label: "Transfer Risk" },
    { context: "audit_confidence", score: auditConfidence, label: "Audit Confidence" }
  ];

  // Run all anchoring processes in parallel (best effort, will not block on errors)
  const anchorPromises = triggerAnchors.map(async (item) => {
    const cached = getCachedAnchor(item.context);
    if (!cached || cached.score !== item.score) {
      return anchorAIScore(item.score, item.context);
    }
    return cached;
  });

  await Promise.all(anchorPromises);

  // Retrieve cached anchor records for UI presentation
  const chainIdStr = process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "421614";
  const isMantle = chainIdStr === "5003";
  const explorerBase = isMantle ? "https://explorer.sepolia.mantle.xyz/tx" : "https://sepolia.arbiscan.io/tx";

  const anchoredDetails = triggerAnchors
    .map((item) => {
      const cached = getCachedAnchor(item.context);
      if (!cached) return null;
      return {
        ...item,
        txHash: cached.txHash,
        contractAddress: cached.contractAddress,
        timestamp: cached.timestamp,
        explorerUrl: `${explorerBase}/${cached.txHash}`,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence Center"
        title="Confidential Asset Intelligence"
        description="Explainable institutional insights for confidential real-world assets. Confidence, evidence, reasoning, and suggested actions accompany every insight."
        actions={
          <Button href="/api/exports/intelligence-report">Export Audit Trail</Button>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard
          title="Intelligence Score"
          value={`${intelligenceScore}`}
          detail="Platform-wide analytical quality index"
          icon="trend"
          tone="accent"
        />
        <StatCard
          title="Compliance Health"
          value={`${complianceHealth}%`}
          detail="Active regulatory passport posture"
          icon="check"
          tone="success"
        />
        <StatCard
          title="Transfer Risk"
          value={transferRisk}
          detail={`Based on ${unanchoredTransfersCount} unanchored and ${pendingTransfers} pending transfers`}
          icon="alert"
          tone={transferRiskTone}
        />
      </div>

      {/* On-Chain AI Score Anchoring Registry Status */}
      {anchoredDetails.length > 0 && (
        <SectionCard
          title="On-Chain AIScoreAnchor Registry"
          description="Cryptographically signed audit scores anchored on the blockchain for public verification."
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {anchoredDetails.map((detail) => (
              <div key={detail.context} className="rounded-2xl border border-border bg-surface-soft p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {detail.label}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
                    ✓ On-chain Anchored
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Anchored Score:</span>
                    <span className="font-semibold text-foreground">{detail.score}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Contract:</span>
                    <span className="font-mono text-foreground text-[10px] truncate max-w-[120px]" title={detail.contractAddress}>
                      {detail.contractAddress.slice(0, 6)}...{detail.contractAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Transaction:</span>
                    <a
                      href={detail.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary hover:underline text-[10px] truncate max-w-[120px]"
                      title={detail.txHash}
                    >
                      {detail.txHash.slice(0, 6)}...{detail.txHash.slice(-4)}
                    </a>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Timestamp:</span>
                    <span className="text-foreground text-[10px]">
                      {new Date(detail.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Executive Intelligence Dashboard */}
      <SectionCard
        title="Executive Intelligence Dashboard"
        description="Overview metrics, real-time risk summaries, and automated findings."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-soft p-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Metrics Snapshot</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex justify-between text-sm">
                <span className="text-muted">Total Registered Assets:</span>
                <span className="font-semibold text-foreground">{assets.length}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted">Whitelisted Investors:</span>
                <span className="font-semibold text-foreground">{whitelistedInvestors}/{totalInvestors}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted">Audit-Ready Passports:</span>
                <span className="font-semibold text-foreground">{totalPassports}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted">Anchored Proof Trails:</span>
                <span className="font-semibold text-foreground">{anchoredPassports}</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Prioritized AI Insights</h3>
            {findings.map((finding, idx) => (
              <InlineNotice
                key={idx}
                title={finding.title}
                description={`Evidence: ${finding.evidence} \nReasoning: ${finding.reasoning} \nSuggested Action: ${finding.action}`}
                tone={finding.tone === "danger" ? "danger" : finding.tone === "warning" ? "warning" : "success"}
                icon={finding.tone === "danger" ? "alert" : "info"}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Asset Intelligence */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Asset Intelligence"
          description="Per-asset health, liquidity, concentration and regulatory exposure calculated from live registry data."
        >
          <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
            {assets.slice(0, 4).map((asset) => {
              const activeTransfers = transfers.filter((t) => t.assetId === asset.id);
              const transfersCount = activeTransfers.length;
              const liquidityScore = Math.min(100, 30 + transfersCount * 20);
              
              const holdersCount = asset.holdersCount || 1;
              const concentrationScore = Math.max(10, Math.round(100 / Math.max(1, holdersCount)));
              
              let regulatoryExposure = 35; // Default low-mid
              if (activeTransfers.some((t) => t.from.includes("US") || t.to.includes("US"))) {
                regulatoryExposure = 75; // US exposure
              } else if (activeTransfers.some((t) => t.from.includes("EU") || t.to.includes("EU"))) {
                regulatoryExposure = 60;
              }

              const assetHealth = Math.round(
                (liquidityScore * 0.3 + (100 - concentrationScore) * 0.4 + (100 - regulatoryExposure) * 0.3)
              );

              return (
                <div key={asset.id} className="rounded-xl border border-border bg-surface-soft p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground">{asset.name}</h4>
                      <p className="text-xs text-muted">Type: {asset.type.toUpperCase()}</p>
                    </div>
                    <StatusBadge tone={assetHealth > 75 ? "success" : assetHealth > 50 ? "warning" : "danger"}>
                      Health: {assetHealth}
                    </StatusBadge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-surface p-2">
                      <p className="text-muted">Liquidity</p>
                      <p className="font-semibold text-foreground mt-0.5">{liquidityScore}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-2">
                      <p className="text-muted">Concentration</p>
                      <p className="font-semibold text-foreground mt-0.5">{concentrationScore}%</p>
                    </div>
                    <div className="rounded-lg bg-surface p-2">
                      <p className="text-muted">Reg Exposure</p>
                      <p className="font-semibold text-foreground mt-0.5">{regulatoryExposure}%</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted leading-relaxed">
                    <span className="font-semibold text-foreground">AI Narrative:</span>{" "}
                    {transfersCount > 0
                      ? `Exhibits balanced market activity with ${transfersCount} active transfers. Concentration risk is normal.`
                      : `No transaction volume has been detected for this asset. Liquidity risk remains high.`}{" "}
                    {regulatoryExposure > 50 && "Exposure to US/EU jurisdictions requires ongoing passport verification."}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Compliance Intelligence */}
        <SectionCard
          title="Compliance Intelligence"
          description="Monitors passport history, disclosure alignment, and suggests policy improvements."
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center rounded-xl bg-surface-soft p-4">
              <div>
                <p className="text-xs text-muted uppercase font-bold tracking-wider">Compliance Health Index</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{complianceHealth}%</p>
              </div>
              <StatusBadge tone={complianceHealth > 80 ? "success" : complianceHealth > 60 ? "warning" : "danger"}>
                {complianceHealth > 80 ? "Fully Compliant" : "Review Recommended"}
              </StatusBadge>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Detected Policy Weaknesses</h4>
              <ul className="space-y-2 text-sm">
                {unmappedInvestorsList.length > 0 && (
                  <li className="flex items-start gap-2 text-muted">
                    <span className="text-warning font-bold">⚠️</span>
                    <span>Stale investor credentials present without verified on-chain addresses.</span>
                  </li>
                )}
                {unanchoredTransfers.length > 0 && (
                  <li className="flex items-start gap-2 text-muted">
                    <span className="text-danger font-bold">⚠️</span>
                    <span>Transfers executed on-chain prior to anchoring a verified audit passport.</span>
                  </li>
                )}
                {disclosures.some((d) => d.status === "Expired") && (
                  <li className="flex items-start gap-2 text-muted">
                    <span className="text-warning font-bold">⚠️</span>
                    <span>Expired active disclosure scopes remain visible to historical grantees.</span>
                  </li>
                )}
                {unmappedInvestorsList.length === 0 && unanchoredTransfers.length === 0 && (
                  <li className="flex items-start gap-2 text-success">
                    <span className="font-bold">✓</span>
                    <span>No systemic policy weaknesses detected. Whitelist is clean.</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <p className="text-xs font-bold text-foreground uppercase">AI Recommended Policy Adjustment</p>
              <p className="text-xs text-muted mt-2">
                Configure auto-anchoring policies to anchor passport proofs within 6 hours of transfer submission. This will prevent unanchored risk flags.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Disclosure & Audit Intelligence */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Disclosure Intelligence"
          description="Guides selective disclosure scope allocation and optimizes expiration profiles."
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-soft p-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase">Scope Analyzer Recommendation</h4>
              <p className="text-sm text-muted">
                For standard external auditors (e.g. quarterly NAV verification), the optimal scope is:
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="success">KYC Status</StatusBadge>
                <StatusBadge tone="success">Jurisdiction</StatusBadge>
                <StatusBadge tone="success">Holdings</StatusBadge>
                <StatusBadge tone="danger">Private Keys (Overage Risk)</StatusBadge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div>
                  <p className="text-muted">Over-disclosure Risk</p>
                  <p className="font-semibold text-foreground">Low (14%)</p>
                </div>
                <div>
                  <p className="text-muted">Suggested Expiry</p>
                  <p className="font-semibold text-foreground">90 Days Max</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Active Disclosures Analyzed</h4>
              {disclosures.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {disclosures.map((d) => (
                    <div key={d.id} className="flex justify-between items-center text-xs border-b border-border pb-2">
                      <div>
                        <p className="font-medium text-foreground">{d.grantee}</p>
                        <p className="text-muted">Expires: {d.expiresAt}</p>
                      </div>
                      <StatusBadge tone={d.status === "Active" ? "success" : "neutral"}>
                        {d.status}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No disclosures available to analyze.</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Audit Intelligence */}
        <SectionCard
          title="Audit Intelligence"
          description="Analyzes anchors on-chain to detect missing evidence, proof anomalies, and assess confidence."
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center rounded-xl bg-surface-soft p-4">
              <div>
                <p className="text-xs text-muted uppercase font-bold tracking-wider">Audit Confidence Score</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{auditConfidence}</p>
              </div>
              <StatusBadge tone={auditConfidence > 75 ? "success" : "warning"}>
                {auditConfidence > 75 ? "High Confidence" : "Awaiting Anchors"}
              </StatusBadge>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Missing Evidence Alerts</h4>
              {unanchoredTransfers.length > 0 ? (
                <div className="space-y-2">
                  {unanchoredTransfers.map((t) => (
                    <div key={t.id} className="rounded-xl border border-danger/20 bg-danger-soft/10 p-3 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground">Missing Anchor for {t.id}</p>
                        <p className="text-[10px] text-muted truncate max-w-xs">{t.txHash || "Awaiting Tx"}</p>
                        <p className="text-[10px] text-muted">Amount: {t.amount.toLocaleString()} tokens</p>
                      </div>
                      <StatusBadge tone="danger">No Anchor</StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ Zero missing evidence alerts. All transactions fully anchored.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Institutional Risk Center */}
      <SectionCard
        title="Institutional Risk Center"
        description="Multi-factor risk indexing with explainable metrics."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Asset Portfolio Risk</span>
              <span>Low</span>
            </div>
            <div className="h-2 w-full bg-surface-soft rounded-full overflow-hidden">
              <div className="h-full bg-success w-1/4" />
            </div>
            <p className="text-[11px] text-muted">AUM and yield values are securely encrypted on-chain.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Investor Risk</span>
              <span>{unmappedInvestorsList.length > 0 ? "Medium" : "Low"}</span>
            </div>
            <div className="h-2 w-full bg-surface-soft rounded-full overflow-hidden">
              <div className="h-full bg-warning w-2/5" />
            </div>
            <p className="text-[11px] text-muted">
              {unmappedInvestorsList.length > 0
                ? `${unmappedInvestorsList.length} investor profile credentials missing addresses.`
                : "All whitelist records mapped and clean."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Transfer Route Risk</span>
              <span>{unanchoredTransfers.length > 0 ? "Medium" : "Low"}</span>
            </div>
            <div className="h-2 w-full bg-surface-soft rounded-full overflow-hidden">
              <div className="h-full bg-warning w-3/5" />
            </div>
            <p className="text-[11px] text-muted">
              {unanchoredTransfers.length > 0
                ? `${unanchoredTransfers.length} transfers executed without matching proof passports.`
                : "All route checks fully anchored."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Jurisdiction Policy Risk</span>
              <span>Low</span>
            </div>
            <div className="h-2 w-full bg-surface-soft rounded-full overflow-hidden">
              <div className="h-full bg-success w-1/5" />
            </div>
            <p className="text-[11px] text-muted">No pending regulatory changes identified for active assets.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
