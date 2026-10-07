export const CONTENT_TYPES = [
    ['pyq', 'PYQs'],
    ['note', 'Notes'],
    ['senior', 'Seniors'],
    ['product', 'Store'],
    ['syllabus', 'Syllabus'],
    ['quicknote', 'Quick notes'],
    ['solution', 'Solutions'],
    ['video', 'Videos'],
    ['group', 'Groups'],
    ['opportunity', 'Opportunities'],
    ['lostfound', 'Lost & found'],
    ['blog', 'Blog'],
    ['affiliate', 'Affiliates'],
].map(([value, label]) => ({ value, label }));

export const CATALOG_CACHE_TTL = 10 * 60 * 1000;

export const CHART_COLORS = Array.from(
    { length: 6 },
    (_, i) => `var(--ss-chart-${i + 1})`,
);
export const dayKey = (now = new Date()) =>
    new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
export const shiftDay = (day, amount) =>
    new Date(Date.parse(`${day}T00:00:00Z`) + amount * 86400000)
        .toISOString()
        .slice(0, 10);
export const rangeDays = (from, to) =>
    Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
export const validDay = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;

export function readFilters(
    search,
    maxDays = 366,
    today = dayKey(),
    { realtime = false, revenue = false } = {},
) {
    const filters = {
        from: search.get('from') || shiftDay(today, -27),
        to: search.get('to') || today,
        college: search.get('college') || '',
        platform:
            realtime && search.get('platform') === 'server'
                ? ''
                : search.get('platform') || '',
        compare: search.get('compare') !== 'false',
        custom: search.get('range') === 'custom',
    };
    let error = '';
    if (!validDay(filters.from) || !validDay(filters.to))
        error = 'Choose valid start and end dates.';
    else if (
        rangeDays(filters.from, filters.to) < 1 ||
        rangeDays(filters.from, filters.to) > maxDays ||
        filters.to > today
    )
        error = `Choose 1–${maxDays} days ending today or earlier (IST).`;
    else if (
        filters.platform &&
        !revenue &&
        !(
            realtime
                ? ['android', 'web', 'blog']
                : ['android', 'web', 'blog', 'server']
        ).includes(filters.platform)
    )
        error = 'Choose a supported platform.';
    else if (filters.college && !/^[a-z0-9-]{1,100}$/.test(filters.college))
        error = 'Choose a valid college.';
    return { filters, error };
}

export function reportParams(filters, kind = 'period') {
    return {
        ...(kind !== 'realtime' ? { from: filters.from, to: filters.to } : {}),
        ...(filters.college ? { college: filters.college } : {}),
        ...(filters.platform && !['growth', 'revenue'].includes(kind)
            ? { platform: filters.platform }
            : {}),
    };
}

export const stableParams = (params = {}) =>
    JSON.stringify(
        Object.fromEntries(
            Object.entries(params)
                .filter(([, v]) => v !== '' && v != null)
                .sort(([a], [b]) => a.localeCompare(b)),
        ),
    );

export class QueryCache {
    constructor(limit = 40) {
        this.limit = limit;
        this.entries = new Map();
        this.owner = undefined;
    }
    scope(owner) {
        if (owner !== this.owner) {
            this.entries.clear();
            this.owner = owner;
        }
    }
    get(key, ttl, now = Date.now()) {
        const entry = this.entries.get(key);
        return entry && now - entry.time < ttl ? entry.data : undefined;
    }
    set(key, data, now = Date.now()) {
        this.entries.delete(key);
        this.entries.set(key, { data, time: now });
        while (this.entries.size > this.limit)
            this.entries.delete(this.entries.keys().next().value);
    }
}

// Weekly active-user points are daily averages, never a sum claiming unique WAU.
// Snapshot totals take the last observed value; additive counts are summed.
export function weeklySeries(series, fields, mode = 'sum') {
    const weeks = new Map();
    for (const row of series || []) {
        const weekday = new Date(`${row.day}T00:00:00Z`).getUTCDay();
        const day = shiftDay(row.day, -(weekday + 6) % 7);
        const week = weeks.get(day) || { day, samples: 0 };
        week.samples += 1;
        for (const field of fields) {
            const value = Number(row[field]) || 0;
            week[field] = mode === 'last' ? value : (week[field] || 0) + value;
        }
        weeks.set(day, week);
    }
    return [...weeks.values()].map((week) =>
        Object.fromEntries(
            Object.entries(week).map(([key, value]) => [
                key,
                mode === 'average' && fields.includes(key)
                    ? value / week.samples
                    : value,
            ]),
        ),
    );
}

export function retentionCurve(rows = [], endDay) {
    const baseline = new Map(
        rows
            .filter((row) => row._id.offset === 0)
            .map((row) => [row._id.firstSeenDay, row.users]),
    );
    return Array.from({ length: 8 }, (_, offset) => {
        const eligible = [...baseline].filter(
            ([day]) => shiftDay(day, offset) <= endDay,
        );
        const total = eligible.reduce((sum, [, users]) => sum + users, 0);
        const retained = rows
            .filter(
                (row) =>
                    row._id.offset === offset &&
                    eligible.some(([day]) => day === row._id.firstSeenDay),
            )
            .reduce((sum, row) => sum + row.users, 0);
        return {
            day: `Day ${offset}`,
            retained,
            eligible: total,
            percent: total ? (retained / total) * 100 : null,
        };
    });
}

export const number = (value) =>
    Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 });
export const money = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    });
export const duration = (seconds) =>
    seconds >= 3600
        ? `${number(seconds / 3600)} h`
        : `${number(seconds / 60)} min`;
export const typeLabel = (type) =>
    CONTENT_TYPES.find((item) => item.value === type)?.label || type;
export const hasValues = (series, fields) =>
    (series || []).some((row) =>
        fields.some(
            (field) =>
                Number(row[field]) !== 0 && Number.isFinite(Number(row[field])),
        ),
    );

export function filterSearch(previous, changes) {
    const next = new URLSearchParams(previous);
    for (const [key, value] of Object.entries(changes)) {
        if (value === '' || value == null) next.delete(key);
        else next.set(key, String(value));
    }
    return next;
}

export function resetFilters(today = dayKey()) {
    return {
        from: shiftDay(today, -27),
        to: today,
        platform: '',
        college: '',
        range: '',
    };
}

export function debounceTask(
    run,
    delay = 350,
    schedule = setTimeout,
    cancel = clearTimeout,
) {
    let timer;
    const update = (value) => {
        cancel(timer);
        timer = schedule(() => run(value), delay);
    };
    update.cancel = () => cancel(timer);
    return update;
}

export const canAccessAnalytics = (user) =>
    ['Admin', 'Moderator'].includes(user?.role);
const ANALYTICS_FILTER_KEYS = [
    'from',
    'to',
    'college',
    'platform',
    'compare',
    'range',
];
export function analyticsLink(path, search = '', pathname = '/analytics') {
    if (pathname !== '/analytics' && !pathname.startsWith('/analytics/'))
        return path;
    const source = new URLSearchParams(search);
    const query = new URLSearchParams();
    for (const key of ANALYTICS_FILTER_KEYS)
        if (source.has(key)) query.set(key, source.get(key));
    return query.size ? `${path}?${query}` : path;
}

// A malformed filter must never be cached as the next request. Readiness also
// prevents a stale/default request between correcting the URL and settling it.
export const validFilterRequest = (filters, error, kind = 'period') =>
    error ? null : stableParams(reportParams(filters, kind));
export const settledFilterRequest = (serialized, settled) => ({
    ready: serialized !== null && serialized === settled,
    requestFilters: JSON.parse(settled || '{}'),
});
export const percent = (value) =>
    value == null || !Number.isFinite(Number(value))
        ? '—'
        : `${number(value)}%`;
export const deltaTone = (delta, increaseIsBad = false) =>
    delta === 0
        ? 'text-ink-2'
        : delta > 0 !== increaseIsBad
          ? 'text-ok-ink'
          : 'text-bad-ink';
export const contentTitle = (row) =>
    row.title || `${typeLabel(row._id.type)} item`;
export function typeBreakdown(values = {}) {
    return CONTENT_TYPES.map(({ value: type, label }) => ({
        type,
        label,
        current: values.current?.find((row) => row.type === type)?.views || 0,
        previous: values.previous?.find((row) => row.type === type)?.views || 0,
    }));
}
