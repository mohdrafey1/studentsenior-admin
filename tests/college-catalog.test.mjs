import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// The catalogue (courses, branches, subjects) lives inside each college.
const output = resolve(
    `node_modules/.cache/college-catalog-test-${process.pid}.mjs`,
);
const bundle = await build({
    stdin: {
        contents: `
        export { buildBreadcrumbs } from './src/components/layout/breadcrumbs.js';
        export { COLLEGE_ITEMS, NAV_GROUPS, WORKSPACE_ITEMS } from './src/components/layout/navConfig.js';
        export { catalogRedirectTarget } from './src/pages/Resources/CatalogRedirect.jsx';
        export { quickNotesPath, SEMESTERS } from './src/pages/Resources/catalogUtils.js';
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
                // The real context imports the API client, which needs Vite's env.
                builder.onResolve(
                    { filter: /context\/CollegeContext$/ },
                    ({ path }) => ({ path, namespace: 'fixture' }),
                );
                builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
                    contents: `
                        const RESERVED = new Set(['dashboard', 'analytics', 'reports', 'affiliate-products', 'support', 'users']);
                        export const collegeSlugFromPath = (p) => { const f = p.split('/')[1]; return f && !RESERVED.has(f) ? f : null; };
                        export const useColleges = () => ({ colleges: [] });
                    `,
                    loader: 'js',
                }));
            },
        },
    ],
});
await mkdir(resolve('node_modules/.cache'), { recursive: true });
await writeFile(output, bundle.outputFiles[0].text);
const m = await import(pathToFileURL(output).href);
after(() => rm(output, { force: true }));

const labels = (trail) => trail.map((t) => [t.label, t.to]);

test('the college section lists courses, branches and subjects', () => {
    const paths = m.COLLEGE_ITEMS.map((item) => item.path);
    for (const path of ['courses', 'branches', 'subjects'])
        assert.ok(paths.includes(path), path);
    const groupLinks = m.NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to));
    assert.ok(
        !groupLinks.some((to) =>
            /^\/reports\/(courses|branches|subjects)/.test(to),
        ),
    );
    assert.ok(
        m.WORKSPACE_ITEMS.some((item) => item.to === '/affiliate-products'),
    );
});

test('breadcrumbs for catalogue pages inside a college', () => {
    assert.deepEqual(labels(m.buildBreadcrumbs('/iul/courses', 'IUL')), [
        ['IUL', '/iul'],
        ['Courses', null],
    ]);
    assert.deepEqual(
        labels(m.buildBreadcrumbs('/iul/branches/b1/subjects', 'IUL')),
        [
            ['IUL', '/iul'],
            ['Branches', '/iul/branches'],
            ['Subjects', null],
        ],
    );
    assert.deepEqual(
        labels(m.buildBreadcrumbs('/iul/subjects/s1/quick-notes', 'IUL')),
        [
            ['IUL', '/iul'],
            ['Subjects', '/iul/subjects'],
            ['Quick notes', null],
        ],
    );
});

test('old /reports catalogue links land inside a college', () => {
    const colleges = [
        { _id: 'c1', slug: 'integral-university' },
        { _id: 'c2', slug: 'aktu' },
    ];
    const target = (pathname, search = '', currentSlug = null) =>
        m.catalogRedirectTarget({ pathname, search, colleges, currentSlug });

    assert.equal(target('/reports/courses', '', 'aktu'), '/aktu/courses');
    assert.equal(
        target('/reports/branches/b1/subjects', '', 'aktu'),
        '/aktu/branches/b1/subjects',
    );
    // ?college= (id or slug) wins and is dropped from the query.
    assert.equal(
        target(
            '/reports/subjects',
            '?syllabus=ready&college=c2',
            'integral-university',
        ),
        '/aktu/subjects?syllabus=ready',
    );
    assert.equal(
        target('/reports/subjects', '?college=aktu'),
        '/aktu/subjects',
    );
    // Nothing remembered: the first college.
    assert.equal(target('/reports/courses'), '/integral-university/courses');
    assert.equal(
        m.catalogRedirectTarget({
            pathname: '/reports/courses',
            search: '',
            colleges: [],
            currentSlug: null,
        }),
        null,
    );
});

test('quick notes open inside the subject’s college', () => {
    assert.equal(
        m.quickNotesPath({ _id: 's1', college: { slug: 'aktu' } }, 'iul'),
        '/aktu/subjects/s1/quick-notes',
    );
    assert.equal(
        m.quickNotesPath({ _id: 's1' }, 'iul'),
        '/iul/subjects/s1/quick-notes',
    );
    assert.equal(m.SEMESTERS.at(-1), 12);
});
