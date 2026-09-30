# Analytics components

Pieces of the Analytics page (`src/pages/Analytics/Analytics.jsx`), in the
Paper Ledger style: token colours only, so dark mode follows the page.

- **AnalyticsHeader** – page title, time range, refresh and CSV export
- **AnalyticsInsights** – one line of highlights worked out from the data
- **OverviewStats** / **StatCard** – the headline strip and one of its cells
- **SubmissionsChart** – new content per day (or month for long ranges)
- **ContentDistribution** – content added in the range, by type
- **TopPerformers** – most-viewed items
- **RecentActivity** – latest uploads
- **GrowthTrends** – last 7 days against the 7 before, by type
- **EngagementMetrics** – all-time views by type
- **ChatbotAnalytics** – the study assistant section
- **ContentCard** – one row of a bar list (label, number, thin bar)
- **ChartTooltip** – hover card for recharts charts

`analyticsData.js` holds the range options, the content-type key map and the
shared chart styling (axis, grid, cursor and bar props).
