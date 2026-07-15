import { useEffect, useRef, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { ShareType, Stakeholder } from '../types';

interface Props {
  open: boolean;
  initial?: Stakeholder | null;
  onClose: () => void;
  onSubmit: (s: Omit<Stakeholder, 'id'> | Stakeholder) => void;
  onDelete?: (id: string) => void;
}

const SHARE_TYPES: ShareType[] = ['Common', 'Preferred', 'Options'];

const EMPTY: Omit<Stakeholder, 'id'> = {
  name: '',
  role: '',
  shareType: 'Common',
  shares: 0,
  vested: true,
};

export function StakeholderModal({ open, initial, onClose, onSubmit, onDelete }: Props) {
  const [form, setForm] = useState<Omit<Stakeholder, 'id'>>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const base = initial ?? EMPTY;
      setForm({
        name: base.name,
        role: base.role,
        shareType: base.shareType,
        shares: base.shares,
        vested: base.vested,
        liquidationPref: base.liquidationPref,
        participating: base.participating,
        prefPricePerShare: base.prefPricePerShare,
      });
      setErrors({});
      // focus first field after paint
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open, initial]);

  // Escape to close + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPreferred = form.shareType === 'Preferred';

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.shares < 0 || Number.isNaN(form.shares)) e.shares = 'Shares must be >= 0';
    if (isPreferred && (form.prefPricePerShare ?? 0) < 0)
      e.prefPricePerShare = 'Pref price must be >= 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    const clean: Omit<Stakeholder, 'id'> = {
      name: form.name.trim(),
      role: form.role.trim() || '—',
      shareType: form.shareType,
      shares: Math.round(form.shares),
      vested: form.vested,
      ...(isPreferred
        ? {
            liquidationPref: form.liquidationPref ?? 1,
            participating: form.participating ?? false,
            prefPricePerShare: form.prefPricePerShare ?? 0,
          }
        : {}),
    };
    if (initial) onSubmit({ ...clean, id: initial.id });
    else onSubmit(clean);
    onClose();
  }

  const fieldClass =
    'w-full rounded-md border border-border bg-bg/60 px-2.5 py-1.5 text-sm text-[#F0F6FC] placeholder-[#F0F6FC]/30 outline-none transition focus:border-mint/60 focus:ring-1 focus:ring-mint/30';
  const labelClass = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#F0F6FC]/55';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md animate-fade-in rounded-xl border border-border bg-card p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-base font-semibold text-[#F0F6FC]">
            {initial ? 'Edit Stakeholder' : 'Add Stakeholder'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#F0F6FC]/50 transition hover:bg-white/5 hover:text-[#F0F6FC]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className={labelClass} htmlFor="f-name">
              Name
            </label>
            <input
              id="f-name"
              ref={nameRef}
              className={fieldClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Alice"
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="f-role">
                Role
              </label>
              <input
                id="f-role"
                className={fieldClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Founder, Investor…"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="f-type">
                Share Type
              </label>
              <select
                id="f-type"
                className={fieldClass}
                value={form.shareType}
                onChange={(e) =>
                  setForm({ ...form, shareType: e.target.value as ShareType })
                }
              >
                {SHARE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-card">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="f-shares">
                Share Count
              </label>
              <input
                id="f-shares"
                type="number"
                min={0}
                className={`${fieldClass} font-mono-tnum`}
                value={form.shares}
                onChange={(e) =>
                  setForm({ ...form, shares: Number(e.target.value) })
                }
              />
              {errors.shares && (
                <p className="mt-1 text-xs text-danger">{errors.shares}</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="f-vested">
                Vested
              </label>
              <label className="flex h-[38px] items-center gap-2 rounded-md border border-border bg-bg/60 px-2.5 text-sm text-[#F0F6FC]/70">
                <input
                  id="f-vested"
                  type="checkbox"
                  className="h-4 w-4 accent-mint"
                  checked={form.vested ?? false}
                  onChange={(e) => setForm({ ...form, vested: e.target.checked })}
                />
                Yes
              </label>
            </div>
          </div>

          {isPreferred && (
            <div className="space-y-3.5 rounded-lg border border-violet/20 bg-violet/[0.04] p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="f-prefprice">
                    Pref Price / Share ($)
                  </label>
                  <input
                    id="f-prefprice"
                    type="number"
                    min={0}
                    step="0.01"
                    className={`${fieldClass} font-mono-tnum`}
                    value={form.prefPricePerShare ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, prefPricePerShare: Number(e.target.value) })
                    }
                    placeholder="1.00"
                  />
                  {errors.prefPricePerShare && (
                    <p className="mt-1 text-xs text-danger">{errors.prefPricePerShare}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-liqpref">
                    Liquidation Pref (x)
                  </label>
                  <input
                    id="f-liqpref"
                    type="number"
                    min={0}
                    step="0.5"
                    className={`${fieldClass} font-mono-tnum`}
                    value={form.liquidationPref ?? 1}
                    onChange={(e) =>
                      setForm({ ...form, liquidationPref: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#F0F6FC]/80">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-violet"
                  checked={form.participating ?? false}
                  onChange={(e) =>
                    setForm({ ...form, participating: e.target.checked })
                  }
                />
                Participating Preferred
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {initial && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initial.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm text-[#F0F6FC]/60 transition hover:bg-white/5 hover:text-[#F0F6FC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-mint px-3.5 py-1.5 text-sm font-semibold text-bg transition hover:brightness-110"
              >
                <Save className="h-3.5 w-3.5" />
                {initial ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
