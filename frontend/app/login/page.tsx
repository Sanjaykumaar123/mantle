import { Icon } from "@/components/icons";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Button, SectionCard, StatusBadge } from "@/components/ui";
import { organization } from "@/lib/site-data";

export default function LoginPage() {
  return (
    <main className="grain-overlay relative min-h-screen overflow-hidden bg-background">
      <header className="relative border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Icon name="shield" className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-foreground">AEGIS AI</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                iExec NOX + ERC-7984 operating layer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="success" className="hidden sm:inline-flex">{organization.networkName}</StatusBadge>
            <Button href="/" variant="secondary">Back to landing</Button>
          </div>
        </div>
      </header>

      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="space-y-6 sm:space-y-8">
            <StatusBadge tone="accent">iExec NOX Protocol + ERC-7984 confidential tokens</StatusBadge>
            <div className="space-y-4 sm:space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Connect to the organization console.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
                Connect wallet to create a new institutional tenant automatically,
                or continue into your existing tenant if your wallet is already registered.
                After login, role mapping determines visibility for transfers, disclosures,
                audit logs, and reports.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge tone="success">Auto tenant onboarding</StatusBadge>
              <StatusBadge tone="neutral">Role mapping from backend</StatusBadge>
              <StatusBadge tone="neutral">Confidential operations enabled</StatusBadge>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -translate-y-3 translate-x-2 rounded-[2rem] bg-accent blur-3xl sm:-translate-y-6 sm:translate-x-6 opacity-60" />
            <div className="relative rounded-[2rem] border border-border bg-surface p-5 shadow-soft">
              <div className="space-y-5 sm:space-y-6">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-muted text-foreground">
                    <Icon name="wallet" className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Connect wallet</h2>
                    <p className="text-sm leading-6 text-muted">
                      Access the institutional confidential asset operating system.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-soft p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                        Target network
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {organization.networkName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
                      <span className="size-2 rounded-full bg-success" />
                      Live
                    </div>
                  </div>
                </div>

                <WalletConnectButton mode="login" />

                <div className="rounded-2xl border border-danger/15 bg-danger-soft p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-white p-2 text-danger shadow-sm">
                      <Icon name="lock" className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Tenant-aware access</p>
                      <p className="text-sm leading-6 text-muted">
                        New wallet creates a tenant automatically. Existing wallet enters its existing tenant.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Post-connection preview
                  </p>
                  <div className="mt-4 flex items-center gap-4 rounded-2xl bg-surface-soft p-4 opacity-85">
                    <div className="size-10 rounded-full bg-surface shadow-sm" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded-full bg-surface-strong" />
                      <div className="h-3 w-20 rounded-full bg-surface-strong" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-surface-strong" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
