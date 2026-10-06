const PACKAGES = [
  { name: "gitcontrol-web", type: "container" },
  { name: "@acme/ui", type: "npm" },
  { name: "acme-core", type: "maven" },
];

const PROJECTS = [
  { name: "Q2 roadmap", items: 12 },
  { name: "Bug triage", items: 47 },
  { name: "MVP backlog", items: 8 },
  { name: "Wave 6", items: 23 },
];

export function DiscoveryMockup() {
  return (
    <div className="grid gap-3 rounded-none bg-background p-3 sm:p-4 sm:grid-cols-2">
      <div className="rounded-none border border-border bg-card p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Packages
        </p>
        <div className="space-y-2">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <span className="font-mono text-xs text-foreground">{pkg.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                {pkg.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Projects v2
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROJECTS.map((p) => (
            <div
              key={p.name}
              className="rounded-none border border-border bg-background p-2"
            >
              <p className="font-sans text-xs text-foreground">{p.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                {p.items} items
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
