import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { contentCsvColumns } from '../src/components/Analytics/v2/contentCsv.js';
import { downloadCsv } from '../src/utils/csv.js';

// Compile the real JSX components with Vite's existing esbuild dependency.
// Only app contexts are fixtures; all rendered controls/charts/tables are real.
const output = resolve(
    `node_modules/.cache/analytics-ui-test-${process.pid}.mjs`,
);
const bundle = await build({
    stdin: {
        contents: `
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import { MemoryRouter } from 'react-router-dom';
        import ChartTooltip from './src/components/Analytics/ChartTooltip.jsx';
        import StatCard from './src/components/Analytics/StatCard.jsx';
        import QueryPanel from './src/components/Analytics/v2/QueryPanel.jsx';
        import DateRangeBar from './src/components/Analytics/v2/DateRangeBar.jsx';
        import ContentTable from './src/components/Analytics/v2/ContentTable.jsx';
        import AnalyticsAccess from './src/components/Analytics/v2/AnalyticsAccess.jsx';
        import ContentTypeBreakdown from './src/components/Analytics/v2/ContentTypeBreakdown.jsx';
        export { visibleNavGroups } from './src/components/layout/navConfig.js';
        const components = { ChartTooltip, StatCard, QueryPanel, DateRangeBar, ContentTable, AnalyticsAccess, ContentTypeBreakdown };
        export const render = (name, props, path = '/analytics') => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(components[name], props)));
    `,
        resolveDir: process.cwd(),
        loader: 'jsx',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    jsx: 'automatic',
    plugins: [
        {
            name: 'context-fixtures',
            setup(builder) {
                builder.onResolve(
                    { filter: /context\/(AuthContext|CollegeContext)$/ },
                    ({ path }) => ({ path, namespace: 'fixture' }),
                );
                builder.onLoad(
                    { filter: /.*/, namespace: 'fixture' },
                    ({ path }) => ({
                        contents: path.includes('AuthContext')
                            ? `export const useAuth = () => ({user: globalThis.__analyticsTestUser});`
                            : `export const useColleges = () => ({colleges: []});`,
                        loader: 'js',
                    }),
                );
            },
        },
    ],
});
await mkdir(resolve('node_modules/.cache'), { recursive: true });
await writeFile(output, bundle.outputFiles[0].contents);
const { render, visibleNavGroups } = await import(pathToFileURL(output).href);
after(async () => {
    await rm(output, { force: true });
    delete globalThis.__analyticsTestUser;
});

const query = { loading: false, error: null, data: {} };
const filters = {
    from: '2026-10-01',
    to: '2026-10-07',
    college: '',
    platform: '',
    compare: true,
};

test('multi-series tooltip includes names and displays null values as unavailable', () => {
    const html = render('ChartTooltip', {
        active: true,
        label: 'Day 7',
        payload: [
            { dataKey: 'retained', name: 'Retained', value: null },
            { dataKey: 'eligible', name: 'Eligible', value: 20 },
        ],
    });
    assert.match(html, /Retained/);
    assert.match(html, /Eligible/);
    assert.match(html, /—/);
});

test('rendered refunded KPI marks increases as bad', () => {
    assert.match(
        render('StatCard', {
            label: 'Refunded',
            value: '₹100',
            delta: 20,
            increaseIsBad: true,
        }),
        /text-bad-ink/,
    );
    assert.match(
        render('StatCard', { label: 'Captured', value: '₹100', delta: 20 }),
        /text-ok-ink/,
    );
});

test('realtime empty state describes its live 30-minute window', () => {
    const html = render('QueryPanel', {
        title: 'Realtime',
        query,
        empty: true,
        emptyWindow: 'last 30 minutes',
    });
    assert.match(html, /no data yet for the last 30 minutes/);
    assert.doesNotMatch(html, /Try another period/);
});

test('realtime excludes server option; revenue hides platforms and explains server attribution', () => {
    const realtime = render('DateRangeBar', {
        filters,
        update() {},
        realtime: true,
    });
    assert.doesNotMatch(realtime, /value="server"/);
    assert.match(realtime, /value="android"/);
    const revenue = render('DateRangeBar', {
        filters,
        update() {},
        revenue: true,
    });
    assert.doesNotMatch(revenue, /aria-label="Platform filter"/);
    assert.match(revenue, /Revenue is recorded by the server/);
});

test('content table displays titles, CSV action and query-preserving destinations', () => {
    const html = render(
        'ContentTable',
        {
            rows: [
                {
                    _id: { type: 'pyq', id: '507f1f77bcf86cd799439011' },
                    title: 'Engineering Maths',
                    views: 12,
                },
            ],
        },
        '/analytics/content/pyq?platform=web&compare=false',
    );
    assert.match(html, />Engineering Maths<\/a>/);
    assert.doesNotMatch(html, />507f1f77bcf86cd799439011<\/a>/);
    assert.match(html, /destination|analytics\/open/);
    assert.match(html, /platform=web&amp;compare=false/);
    assert.match(html, /Export CSV/);
});

test('overview type panel renders aggregate current and previous values', () => {
    const html = render('ContentTypeBreakdown', {
        overview: {
            ...query,
            data: {
                viewsByType: {
                    current: [{ type: 'pyq', views: 100 }],
                    previous: [{ type: 'pyq', views: 40 }],
                },
            },
        },
    });
    assert.match(html, /100/);
    assert.match(html, /Previous period: 40/);
});

test('Visitor sees one access-denied state and no analytics nav; allowed roles retain Chatbot', () => {
    globalThis.__analyticsTestUser = { role: 'Visitor' };
    const html = render('AnalyticsAccess', { children: 'private report' });
    assert.match(html, /Analytics access required/);
    assert.doesNotMatch(html, /private report/);
    assert.ok(
        !visibleNavGroups(globalThis.__analyticsTestUser).some(
            (group) => group.id === 'analytics',
        ),
    );
    globalThis.__analyticsTestUser = { role: 'Moderator' };
    assert.match(
        render('AnalyticsAccess', { children: 'private report' }),
        /private report/,
    );
    assert.ok(
        visibleNavGroups(globalThis.__analyticsTestUser)
            .find((group) => group.id === 'analytics')
            .items.some((item) => item.to === '/analytics/chatbot'),
    );
});

test('content CSV uses the shared exporter and retains quoted titles, counts and Unicode', async () => {
    let blob;
    const oldDocument = globalThis.document;
    const oldCreate = URL.createObjectURL;
    const oldRevoke = URL.revokeObjectURL;
    const link = { click() {}, remove() {} };
    globalThis.document = {
        createElement: () => link,
        body: { appendChild() {} },
    };
    URL.createObjectURL = (value) => {
        blob = value;
        return 'blob:fixture';
    };
    URL.revokeObjectURL = () => {};
    try {
        downloadCsv('analytics-top-content', contentCsvColumns, [
            {
                _id: { type: 'pyq', id: 'id' },
                title: 'Maths, "2026" — हिन्दी',
                views: 12,
                downloads: 3,
            },
        ]);
        assert.equal(link.download, 'analytics-top-content.csv');
        const text = await blob.text();
        assert.match(text, /"Maths, ""2026"" — हिन्दी"/);
        assert.match(text, /12,3,0/);
        assert.match(text, /Views since launch/);
    } finally {
        globalThis.document = oldDocument;
        URL.createObjectURL = oldCreate;
        URL.revokeObjectURL = oldRevoke;
    }
});
