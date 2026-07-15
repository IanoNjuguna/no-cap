import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Stakeholder, StakeholderWithOwnership } from '../types';
import { StakeholderRow } from './StakeholderRow';
import { StakeholderModal } from './StakeholderModal';

interface Props {
  withOwnership: StakeholderWithOwnership[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onAdd: (s: Omit<Stakeholder, 'id'>) => void;
  onUpdate: (s: Stakeholder) => void;
  onDelete: (id: string) => void;
  onEditFocus: (id: string) => void;
}

export function Ledger({
  withOwnership,
  hoveredId,
  selectedId,
  onHover,
  onAdd,
  onUpdate,
  onDelete,
  onEditFocus,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StakeholderWithOwnership | null>(null);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(s: StakeholderWithOwnership) {
    setEditing(s);
    setModalOpen(true);
    onEditFocus(s.id);
  }

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/40"
      aria-label="Stakeholder ledger"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-[#F0F6FC]">Ledger</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-md border border-mint/30 bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint transition hover:bg-mint/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Stakeholder
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="text-[10px] uppercase tracking-wider text-[#F0F6FC]/40">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Role / Type</th>
              <th className="px-3 py-2 text-right font-medium">Shares</th>
              <th className="px-3 py-2 text-right font-medium">Ownership</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {withOwnership.map((s) => (
              <StakeholderRow
                key={s.id}
                stakeholder={s}
                hovered={hoveredId === s.id}
                selected={selectedId === s.id}
                onHover={onHover}
                onEdit={openEdit}
              />
            ))}
            {withOwnership.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-[#F0F6FC]/40">
                  No stakeholders yet. Click "Add Stakeholder" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StakeholderModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={(s) => {
          if ('id' in s) onUpdate(s);
          else onAdd(s);
        }}
        onDelete={onDelete}
      />
    </section>
  );
}
