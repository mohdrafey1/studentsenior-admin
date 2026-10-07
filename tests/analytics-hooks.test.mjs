import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { act } from 'react';

// Render the real hooks and request panels. Only auth and network are fixtures;
// delayed promises expose cancellation and intermediate UI states.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://admin.example.test/',
    pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const output = resolve(
    `node_modules/.cache/analytics-hooks-test-${process.pid}.mjs`,
);
const bundle = await build({
    stdin: {
        contents: `
            import React from 'react';
            import { createRoot } from 'react-dom/client';
            import { MemoryRouter, useNavigate } from 'react-router-dom';
            import useAnalyticsFilters from './src/hooks/useAnalyticsFilters.js';
            import useAnalyticsQuery from './src/hooks/useAnalyticsQuery.js';
            import useRealtimeAnalytics from './src/hooks/useRealtimeAnalytics.js';
            import QueryPanel from './src/components/Analytics/v2/QueryPanel.jsx';
            import { reportParams, reportReady } from './src/components/Analytics/v2/data.js';
            function Probe({ realtimePage }) {
                const controls = useAnalyticsFilters(366, { realtime: realtimePage });
                const period = useAnalyticsQuery('/analytics/v2/overview', controls.params, { enabled: controls.ready });
                const growth = useAnalyticsQuery('/analytics/v2/growth', reportParams(controls.requestFilters, 'growth'), { enabled: reportReady(controls, 'growth') });
                const realtime = useRealtimeAnalytics(controls);
                globalThis.__analyticsHookProbe = { controls, period, growth, realtime, navigate: useNavigate() };
                return <>{!controls.error && [period, growth, realtime].map((query, index) => <QueryPanel key={index} title={['Period', 'Growth', 'Realtime'][index]} query={query} empty={!query.data}><span>Data loaded</span></QueryPanel>)}</>;
            }
            export function mount(container, path, realtimePage = false) {
                const root = createRoot(container);
                root.render(<MemoryRouter initialEntries={[path]}><Probe realtimePage={realtimePage} /></MemoryRouter>);
                return root;
            }
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
            name: 'auth-and-network-fixtures',
            setup(builder) {
                builder.onResolve(
                    { filter: /(?:context\/AuthContext|utils\/api)$/ },
                    ({ path }) => ({ path, namespace: 'fixture' }),
                );
                builder.onLoad(
                    { filter: /.*/, namespace: 'fixture' },
                    ({ path }) => ({
                        contents: path.includes('AuthContext')
                            ? `export const useAuth = () => ({ token: globalThis.__analyticsHookOwner });`
                            : `export default { get: (...args) => globalThis.__analyticsHookGet(...args) }; export const apiErrorMessage = error => error.message;`,
                        loader: 'js',
                    }),
                );
            },
        },
    ],
});
await mkdir(resolve('node_modules/.cache'), { recursive: true });
await writeFile(output, bundle.outputFiles[0].contents);
const { mount } = await import(pathToFileURL(output).href);
after(async () => {
    await rm(output, { force: true });
    dom.window.close();
    for (const key of [
        'window',
        'document',
        'IS_REACT_ACT_ENVIRONMENT',
        '__analyticsHookProbe',
        '__analyticsHookGet',
        '__analyticsHookOwner',
    ])
        delete globalThis[key];
});

const base = '/analytics?from=2026-10-01&to=2026-10-07&platform=web';
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
let owner = 0;
async function setup(t, path = base, realtimePage = false) {
    const requests = [];
    globalThis.__analyticsHookOwner = `admin-${++owner}`;
    globalThis.__analyticsHookGet = (path, { params, signal }) =>
        new Promise((resolve) =>
            requests.push({ path, params, signal, resolve }),
        );
    const container = document.createElement('div');
    document.body.append(container);
    let root;
    await act(async () => {
        root = mount(container, path, realtimePage);
    });
    t.after(async () => {
        await act(async () => root.unmount());
        container.remove();
    });
    return {
        requests,
        container,
        get probe() {
            return globalThis.__analyticsHookProbe;
        },
        async navigate(path) {
            await act(async () =>
                globalThis.__analyticsHookProbe.navigate(path),
            );
        },
        async settle() {
            await act(async () => pause(390));
        },
    };
}

test('in-flight filter changes keep loading panels throughout debounce without an empty flash', async (t) => {
    const view = await setup(t);
    assert.equal(view.requests.length, 3);
    await view.navigate(`${base}&college=sample`);
    assert.equal(view.probe.controls.ready, false);
    assert.ok(view.requests.every((request) => request.signal.aborted));
    for (const query of [
        view.probe.period,
        view.probe.growth,
        view.probe.realtime,
    ]) {
        assert.equal(query.loading, true);
        assert.equal(query.data, null);
    }
    assert.doesNotMatch(view.container.textContent, /no data yet/);
    await act(async () => pause(100));
    assert.equal(view.requests.length, 3);
    assert.doesNotMatch(view.container.textContent, /no data yet/);
    await view.settle();
    assert.equal(view.requests.length, 6);
    assert.ok(
        view.requests
            .slice(3)
            .every((request) => request.params.college === 'sample'),
    );
    assert.doesNotMatch(view.container.textContent, /no data yet/);
    await act(async () => {
        for (const request of view.requests)
            request.resolve({ data: { data: { activeActors: 2 } } });
    });
    assert.equal(
        (view.container.textContent.match(/Data loaded/g) || []).length,
        3,
    );
});

test('growth platform changes and realtime date changes retain their original in-flight request', async (t) => {
    const view = await setup(t);
    const growth = view.requests.find((request) =>
        request.path.endsWith('/growth'),
    );
    await view.navigate(base.replace('platform=web', 'platform=android'));
    assert.equal(view.probe.controls.ready, false);
    assert.equal(growth.signal.aborted, false);
    await view.settle();
    assert.equal(
        view.requests.filter((request) => request.path.endsWith('/growth'))
            .length,
        1,
    );
    assert.equal(growth.signal.aborted, false);
    const liveRequests = view.requests.filter((request) =>
        request.path.endsWith('/realtime'),
    );
    const live = liveRequests.at(-1);
    await view.navigate(
        base
            .replace('platform=web', 'platform=android')
            .replace('from=2026-10-01', 'from=2026-09-25'),
    );
    assert.equal(view.probe.controls.ready, false);
    assert.equal(live.signal.aborted, false);
    await view.settle();
    assert.equal(
        view.requests.filter((request) => request.path.endsWith('/realtime'))
            .length,
        liveRequests.length,
    );
    assert.equal(live.signal.aborted, false);
    await act(async () =>
        live.resolve({ data: { data: { activeActors: 7 } } }),
    );
    assert.equal(view.probe.realtime.data.activeActors, 7);
});

test('overview and realtime page both omit server from their realtime request', async (t) => {
    for (const realtimePage of [false, true]) {
        await t.test(realtimePage ? 'Realtime page' : 'Overview', async (t) => {
            const view = await setup(
                t,
                base.replace('platform=web', 'platform=server'),
                realtimePage,
            );
            const live = view.requests.find((request) =>
                request.path.endsWith('/realtime'),
            );
            assert.ok(live);
            assert.deepEqual(live.params, {});
            if (!realtimePage)
                assert.equal(
                    view.requests.find((request) =>
                        request.path.endsWith('/overview'),
                    ).params.platform,
                    'server',
                );
        });
    }
});

test('invalid filters still send no reads and corrections send only valid parameters', async (t) => {
    const view = await setup(
        t,
        base.replace('from=2026-10-01', 'from=2026-10-08'),
    );
    assert.equal(view.requests.length, 0);
    await view.navigate(base);
    await view.settle();
    assert.equal(view.requests.length, 3);
    for (const request of view.requests) {
        if (!request.path.endsWith('/realtime'))
            assert.ok(request.params.from <= request.params.to);
    }
});
