import { CONTENT_TYPES, percentChange } from './analyticsData';

/**
 * One line of highlights worked out from the numbers on the page: which type
 * draws the most views, and which grew most this week. Renders nothing when
 * there isn't enough data to say anything true.
 */
function AnalyticsInsights({ engagement, percentageChanges }) {
    const sentences = [];

    if (engagement) {
        const views = CONTENT_TYPES.filter((t) => engagement[t.series]).map(
            (t) => ({
                label: t.label,
                value: engagement[t.series].totalViews || 0,
            }),
        );
        const total = views.reduce((sum, v) => sum + v.value, 0);
        const top = [...views].sort((a, b) => b.value - a.value)[0];
        if (top && total > 0) {
            sentences.push(
                `${top.label} draw ${Math.round((top.value / total) * 100)}% of all views.`,
            );
        }
    }

    if (percentageChanges) {
        const risers = CONTENT_TYPES.map((t) => ({
            label: t.label,
            change: percentageChanges[t.change],
        }))
            .filter((t) => t.change?.previous > 0)
            .map((t) => ({
                label: t.label,
                pct: percentChange(t.change.current, t.change.previous),
            }))
            .filter((t) => t.pct > 0)
            .sort((a, b) => b.pct - a.pct);
        if (risers[0]) {
            sentences.push(
                `${risers[0].label} grew most this week, up ${risers[0].pct}% on the week before.`,
            );
        }
    }

    if (sentences.length === 0) return null;

    return <p className='text-[13px] text-muted'>{sentences.join(' ')}</p>;
}

export default AnalyticsInsights;
