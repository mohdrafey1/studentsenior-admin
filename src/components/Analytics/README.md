# Analytics components

The `/analytics` reports use the v2 read API and the Paper Ledger UI kit.
`v2/` contains the shared URL date/filter bar, KPI strip, charts, cohort grid,
academic tree, request states, content links and user activity panel.

- `useAnalyticsFilters` uses inclusive IST dates and mirrors filters in the URL.
  Reports permit up to 366 days; individual user activity permits 90 days.
  Filter changes replace browser history and debounce reads by 350 ms; custom
  dates commit on blur or Enter.
- `useAnalyticsQuery` uses the existing authenticated axios instance, cancels
  requests on navigation, and maintains a bounded, identity-scoped memory cache.
  Academic catalog labels use a separate cache for the entire admin session.
- Overview makes four analytics requests: overview (including type and college
  breakdowns), growth, all content, and realtime.
- Growth ignores the platform filter because inventory has no platform dimension.
  Revenue also ignores it because cash events are recorded by the server.
  Snapshot charts use the last observed value per week; missing snapshots are
  not synthesized. All other additive weekly charts sum daily values. Active
  actor charts show the average daily audience instead of claiming weekly uniques.
- Retention percentages weight eligible cohort sizes and exclude cohorts too
  young to reach each day. Incomplete weekly cohort intervals are marked `*`.
- Realtime reads provisional raw events in a rolling 30-minute window and polls
  every 15 seconds only while the tab is visible and filters are valid. An error
  pauses polling until Retry; the server platform is unavailable here.
- Content links use one destination request to resolve the canonical editor.
  Tables display titles and offer CSV export through the shared CSV utility.
- The Chatbot tab reuses the existing all-time chatbot report and its 30-day
  activity chart. Other analytics filters do not affect that legacy endpoint.
- Only Admin and Moderator roles see Analytics in navigation or mount reports.
  User Activity is also hidden from other roles.

`OverviewStats`, `StatCard`, `ChartTooltip` and the `AXIS_PROPS` / `GRID_PROPS`
in `analyticsData.js` are reused. Chart colors use `--ss-chart-1` through
`--ss-chart-6`, with light and dark values in `src/index.css`.

Unused legacy analytics components have been removed. `Dashboard.jsx`, existing
content counters, and the separate blog analytics page are unchanged.

Run `npm test`, `npm run lint`, `npm run format:check`, and `npm run build`.
Tests cover date validation, debounce, endpoint-specific filters, cache isolation,
weekly aggregation, retention, single-request destinations, role access and CSV.
Rendering regressions compile JSX using Vite’s existing esbuild dependency and
exercise the real UI components with fixture app contexts.
