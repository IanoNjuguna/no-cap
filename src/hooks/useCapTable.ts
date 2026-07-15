import { useCallback, useMemo, useState } from 'react';
import type {
  DilutionMode,
  Stakeholder,
  StakeholderWithOwnership,
  WaterfallResult,
  HealthStatus,
} from '../types';
import { initialStakeholders } from '../data';
import {
  calculatePercentages,
  totalShares,
  foundersPct,
  poolPct,
  investorPct,
  checkHealth,
} from '../utils/calcOwnership';
import { calcWaterfall } from '../utils/calcWaterfall';

function uid(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface UseCapTable {
  stakeholders: Stakeholder[];
  withOwnership: StakeholderWithOwnership[];
  mode: DilutionMode;
  exitValue: number;
  totalShares: number;
  foundersPct: number;
  poolPct: number;
  investorPct: number;
  health: HealthStatus;
  waterfall: WaterfallResult;
  hoveredId: string | null;
  selectedId: string | null;
  setMode: (m: DilutionMode) => void;
  toggleMode: () => void;
  setExitValue: (v: number) => void;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  addStakeholder: (s: Omit<Stakeholder, 'id'>) => void;
  updateStakeholder: (s: Stakeholder) => void;
  deleteStakeholder: (id: string) => void;
}

export function useCapTable(): UseCapTable {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(initialStakeholders);
  const [mode, setModeState] = useState<DilutionMode>('fullyDiluted');
  const [exitValue, setExitValue] = useState<number>(15_000_000);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const setMode = useCallback((m: DilutionMode) => setModeState(m), []);
  const toggleMode = useCallback(
    () => setModeState((m) => (m === 'fullyDiluted' ? 'active' : 'fullyDiluted')),
    []
  );

  const addStakeholder = useCallback((s: Omit<Stakeholder, 'id'>) => {
    setStakeholders((prev) => [...prev, { ...s, id: uid() }]);
  }, []);

  const updateStakeholder = useCallback((s: Stakeholder) => {
    setStakeholders((prev) => prev.map((p) => (p.id === s.id ? s : p)));
  }, []);

  const deleteStakeholder = useCallback((id: string) => {
    setStakeholders((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const total = useMemo(() => totalShares(stakeholders, mode), [stakeholders, mode]);
  const withOwnership = useMemo(
    () => calculatePercentages(stakeholders, mode),
    [stakeholders, mode]
  );
  const health = useMemo(() => checkHealth(stakeholders, mode), [stakeholders, mode]);
  const waterfall = useMemo(
    () => calcWaterfall(stakeholders, exitValue, mode),
    [stakeholders, exitValue, mode]
  );

  return {
    stakeholders,
    withOwnership,
    mode,
    exitValue,
    totalShares: total,
    foundersPct: useMemo(() => foundersPct(stakeholders, mode), [stakeholders, mode]),
    poolPct: useMemo(() => poolPct(stakeholders, mode), [stakeholders, mode]),
    investorPct: useMemo(() => investorPct(stakeholders, mode), [stakeholders, mode]),
    health,
    waterfall,
    hoveredId,
    selectedId,
    setMode,
    toggleMode,
    setExitValue,
    setHoveredId,
    setSelectedId,
    addStakeholder,
    updateStakeholder,
    deleteStakeholder,
  };
}

export type CapTable = ReturnType<typeof useCapTable>;
