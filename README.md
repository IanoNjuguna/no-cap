# Cap Table Visualizer

A single-page, dark-mode cap table dashboard with an interactive ownership donut, real-time ownership recalculation, and a participating-preferred liquidation waterfall simulator. Developer-tool aesthetic, Carbon Mint palette.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (dark mode by default, custom color tokens)
- Lucide React (icons)
- Plain SVG for the donut + waterfall charts
- Vitest (unit tests for the core math)

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run test     # run unit tests
npm run typecheck
```

## Features

### Ledger (left)
- Stakeholder table: name, role/share-type badge, share count, ownership %.
- Add / edit / delete stakeholders via a modal form.
- Validation: name required, shares >= 0, pref price >= 0.
- Live recalculation of totals and ownership on every change.

### Ownership visuals (middle)
- Interactive SVG donut chart. Hover a slice to highlight the matching ledger row (and vice-versa); click a slice to select + edit.
- Compact legend with color swatches and percentages.
- Tooltip on hover: name, share count, %.
- Quick stats: total shares, founders' %, option pool %, investor %.

### Exit Simulator (right)
- Exit valuation slider ($0 – $50M, default $15M).
- Waterfall bars showing preference payout (orange) vs pro-rata remainder (type color) per stakeholder.
- Tooltips show the exact formula and numbers used.
- Summary table with cash and % of exit per stakeholder.

### UX
- **Fully Diluted / Active Shares toggle** — includes or excludes the unallocated option pool. A transient toast confirms the current mode.
- **Health badge** — green "Cap Table Healthy" or red warnings (negative shares, ownership != 100%, empty names).
- **Number formatting** — `Intl.NumberFormat` for thousands separators and currency.
- Accessible: keyboard-focusable chart slices, ARIA labels on slider/switch/charts, escape-to-close modal, scroll lock.

## Waterfall logic

1. Pay liquidation preferences to Preferred holders first (capped by remaining cash). If exit value < total preference entitlements, prefs share the shortfall pro-rata by entitlement.
2. Participating Preferred then take their pro-rata slice of the cash left after prefs (ownership % = shares / total shares in current dilution mode).
3. Remaining cash is split pro-rata among Common + Options holders (`proRataBase = sum of effective Common + Options shares`).

### Mock-data example at $15M (fully diluted)

| Holder | Calculation | Amount |
|---|---|---|
| VC A pref | 1x × $1 × 800,000 | $800,000 |
| VC A participation | 8% × $14,200,000 | $1,136,000 |
| VC A total | | **$1,936,000** |
| Remaining to Common/Options | | $13,064,000 |
| Alice | (4M / 9.2M) × $13,064,000 | $5,680,000 |
| Bob | same | $5,680,000 |
| Pool | (1M / 9.2M) × $13,064,000 | $1,420,000 |
| Charlie | (200k / 9.2M) × $13,064,000 | $284,000 |

Edge case: exit $500k (< $800k pref) → VC receives the entire $500k pro-rata; Common/Options receive $0.

## Project structure

```
src/
  App.tsx                     # root layout, header, toggle, toast, chart→edit bridge
  types.ts                    # Stakeholder, WaterfallResult, etc.
  data.ts                     # initial mock data + chart colors
  hooks/useCapTable.ts        # single source of truth: state + derived values + methods
  utils/
    format.ts                 # Intl number/currency/pct helpers
    calcOwnership.ts          # percentages, totals, health check
    calcOwnership.test.ts
    calcWaterfall.ts          # participating-preferred waterfall (pure functions)
    calcWaterfall.test.ts
  components/
    Ledger.tsx                # table + modal trigger
    StakeholderRow.tsx
    StakeholderModal.tsx      # add/edit form (shared)
    DonutChart.tsx            # interactive SVG donut + legend
    StatsCard.tsx
    ExitSimulator.tsx         # slider + waterfall + summary
    WaterfallBar.tsx          # stacked horizontal bar + tooltip
    HealthBadge.tsx
```

## Tests

27 unit tests covering ownership percentages, health checks, and the full waterfall scenario (including edge cases: exit below preferences, multiple preferred, non-participating preferred, zero exit, active vs fully-diluted mode).

```bash
npm test
```
