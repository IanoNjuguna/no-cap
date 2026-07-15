import { useEffect, useRef, useState } from 'react';
import { Layers3, Scale } from 'lucide-react';
import { useCapTable } from './hooks/useCapTable';
import { Ledger } from './components/Ledger';
import { DonutChart } from './components/DonutChart';
import { StatsCard } from './components/StatsCard';
import { ExitSimulator } from './components/ExitSimulator';
import { HealthBadge } from './components/HealthBadge';
import type { Stakeholder } from './types';

function App() {
  const cap = useCapTable();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMode = useRef(cap.mode);

  // Transient badge when dilution mode changes
  useEffect(() => {
    if (prevMode.current !== cap.mode) {
      prevMode.current = cap.mode;
      const msg =
        cap.mode === 'fullyDiluted'
          ? 'Now showing: Fully Diluted (includes pool)'
          : 'Now showing: Active Shares (excludes unallocated pool)';
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2600);
    }
  }, [cap.mode]);

  function handleSelectSlice(id: string) {
    // Toggle selection; clicking the selected slice again deselects.
    cap.setSelectedId(cap.selectedId === id ? null : id);
  }

  function handleEditFocus(id: string) {
    // The Ledger owns the actual modal; here we just mark selection for highlight.
    cap.setSelectedId(id);
  }

  // Donut selection opens the edit modal via the Ledger's selected stakeholder.
  // We wire a lightweight bridge: when a slice is selected, surface an "edit" affordance.
  const selectedStakeholder =
    cap.withOwnership.find((s) => s.id === cap.selectedId) ?? null;
  const [editFromChart, setEditFromChart] = useState(false);

  function onSelectSliceForEdit(s: Stakeholder) {
    cap.setSelectedId(s.id);
    setEditFromChart(true);
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/image-removebg-preview_(1).png"
            alt="no cap logo"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#F0F6FC]">
              no cap
            </h1>
            <p className="text-[10px] text-[#F0F6FC]/40">
              Cap Table Software
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HealthBadge health={cap.health} />

          {/* Fully Diluted toggle */}
          <div
            className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1"
            role="group"
            aria-label="Dilution mode"
          >
            <Layers3 className="h-3.5 w-3.5 text-[#F0F6FC]/50" />
            <span className="text-[11px] text-[#F0F6FC]/50">Active</span>
            <button
              onClick={cap.toggleMode}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                cap.mode === 'fullyDiluted' ? 'bg-mint/80' : 'bg-white/15'
              }`}
              role="switch"
              aria-checked={cap.mode === 'fullyDiluted'}
              aria-label="Toggle fully diluted"
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg shadow transition-all ${
                  cap.mode === 'fullyDiluted' ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
            <span className="text-[11px] font-medium text-mint">Diluted</span>
          </div>
        </div>
      </header>

      {/* Three-column grid */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(320px,1fr)_minmax(380px,1.2fr)_minmax(360px,1.1fr)]">
        {/* Left — Ledger */}
        <Ledger
          withOwnership={cap.withOwnership}
          hoveredId={cap.hoveredId}
          selectedId={cap.selectedId}
          onHover={cap.setHoveredId}
          onAdd={cap.addStakeholder}
          onUpdate={cap.updateStakeholder}
          onDelete={cap.deleteStakeholder}
          onEditFocus={handleEditFocus}
        />

        {/* Middle — Visuals */}
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto scrollbar-thin">
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-mint" />
              <h2 className="text-sm font-semibold tracking-tight text-[#F0F6FC]">
                Ownership
              </h2>
              <span className="ml-auto rounded border border-border bg-bg/40 px-1.5 py-0.5 text-[10px] text-[#F0F6FC]/45">
                {cap.mode === 'fullyDiluted' ? 'Fully Diluted' : 'Active Shares'}
              </span>
            </div>
            <DonutChart
              data={cap.withOwnership}
              hoveredId={cap.hoveredId}
              selectedId={cap.selectedId}
              onHover={cap.setHoveredId}
              onSelect={handleSelectSlice}
            />
            {selectedStakeholder && (
              <div className="mt-3 flex items-center justify-between rounded-md border border-mint/30 bg-mint/[0.06] px-3 py-2">
                <span className="text-xs text-[#F0F6FC]/70">
                  Selected: <span className="font-medium text-mint">{selectedStakeholder.name}</span>
                </span>
                <button
                  onClick={() => onSelectSliceForEdit(selectedStakeholder)}
                  className="rounded-md border border-mint/40 bg-mint/10 px-2.5 py-1 text-[11px] font-medium text-mint transition hover:bg-mint/20"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/40 p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-[#F0F6FC]">
              Quick Stats
            </h2>
            <StatsCard
              totalShares={cap.totalShares}
              foundersPct={cap.foundersPct}
              poolPct={cap.poolPct}
              investorPct={cap.investorPct}
            />
          </div>
        </section>

        {/* Right — Exit Simulator */}
        <ExitSimulator cap={cap} />
      </main>

      {/* Mode toggle toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div className="animate-toast-in rounded-full border border-mint/30 bg-card/95 px-4 py-2 text-xs font-medium text-[#F0F6FC] shadow-xl backdrop-blur">
            <span className="text-mint">●</span> {toast}
          </div>
        </div>
      )}

      {/* Hidden bridge: editing from chart selection reuses the Ledger modal by
          triggering a transient render of StakeholderModal here. */}
      {editFromChart && selectedStakeholder && (
        <ChartEditBridge
          stakeholder={selectedStakeholder}
          onClose={() => setEditFromChart(false)}
          onSubmit={(s) => {
            cap.updateStakeholder(s as Stakeholder);
            setEditFromChart(false);
          }}
          onDelete={(id) => {
            cap.deleteStakeholder(id);
            setEditFromChart(false);
          }}
        />
      )}
    </div>
  );
}

// Small inline bridge so a donut click can open the same modal UX.
import { StakeholderModal } from './components/StakeholderModal';
function ChartEditBridge({
  stakeholder,
  onClose,
  onSubmit,
  onDelete,
}: {
  stakeholder: Stakeholder;
  onClose: () => void;
  onSubmit: (s: Omit<Stakeholder, 'id'> | Stakeholder) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <StakeholderModal
      open
      initial={stakeholder}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}

export default App;
