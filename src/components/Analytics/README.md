# Analytics components

The `/analytics` reports use the v2 read API and the Paper Ledger UI kit.
`v2/` contains the shared URL date/filter bar, KPI strip, charts, cohort grid,
academic tree, request states, content links and user activity panel.

- `useAnalyticsFilters` uses inclusive IST dates and mirrors filters in the URL.
  Reports permit up to 366 days; individual user activity permits 90 days.
- `useAnalyticsQuery` uses the existing authenticated axios instance, cancels
  requests on navigation, and maintains a bounded, identity-scoped memory cache.
- Growth ignores the platform filter because inventory has no platform dimension.
  Snapshot charts use the last observed value per week; missing snapshots are
  not synthesized. All other additive weekly charts sum daily values. Active
  actor charts show the average daily audience instead of claiming weekly uniques.
- Retention percentages weight eligible cohort sizes and exclude cohorts too
  young to reach each day. Incomplete weekly cohort intervals are marked `*`.
- Realtime reads provisional raw events in a rolling 30-minute window and polls
  every 15 seconds only while the tab is visible.
- Content links resolve canonical colleges on navigation. Quick notes and
  solutions use the existing paginated catalogs to find their subject/PYQ editor;
  affiliate products use their existing inline-edit catalog. Deleted content
  shows a recoverable error instead of a guessed college route.

`OverviewStats`, `StatCard`, `ChartTooltip` and the `AXIS_PROPS` / `GRID_PROPS`
in `analyticsData.js` are reused. Chart colors use `--ss-chart-1` through
`--ss-chart-6`, with light and dark values in `src/index.css`.

The older components remain available to legacy consumers. `Dashboard.jsx`,
existing content counters, and the separate blog analytics page are unchanged.

Run `npm test`, `npm run lint`, `npm run format:check`, and `npm run build`.
The dependency-free unit suite covers date validation, endpoint-specific filters,
cache isolation, weekly aggregation, weighted retention and content destinations.
