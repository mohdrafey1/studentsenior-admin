// Shared bits for the catalog pages (courses, branches, subjects, quick notes).

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Date added' },
    { value: 'name', label: 'Name' },
];

/** Time filter is "" or "all" when nothing is picked. */
export const hasTimeFilter = (value) => Boolean(value) && value !== 'all';

/** Sort by date added or by a name field, in the chosen direction. */
export const sortCatalog = (list, sortBy, sortOrder, nameKey) =>
    [...list].sort((a, b) => {
        if (sortBy === 'createdAt') {
            const diff =
                new Date(a.createdAt || 0).getTime() -
                new Date(b.createdAt || 0).getTime();
            return sortOrder === 'asc' ? diff : -diff;
        }
        const cmp = (a[nameKey] || '')
            .toLowerCase()
            .localeCompare((b[nameKey] || '').toLowerCase());
        return sortOrder === 'asc' ? cmp : -cmp;
    });

export const hasSyllabus = (subject) => subject?.syllabi?.length > 0;

/** Link to a subject's syllabus page, when the API gave us enough to build it. */
export const syllabusPath = (subject) =>
    hasSyllabus(subject) && subject.college?.slug
        ? `/${subject.college.slug}/syllabus/${subject.syllabi[0]}`
        : null;

export const quickNotesPath = (subject) =>
    `/reports/subjects/${subject._id}/quick-notes`;

/**
 * Markdown styling that follows the theme tokens, so notes read well in
 * light and dark without `dark:` variants.
 */
export const PROSE_CLASS =
    'prose prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:font-bold [--tw-prose-body:var(--color-ink-2)] [--tw-prose-headings:var(--color-ink)] [--tw-prose-lead:var(--color-ink-2)] [--tw-prose-links:var(--color-link)] [--tw-prose-bold:var(--color-ink)] [--tw-prose-counters:var(--color-muted)] [--tw-prose-bullets:var(--color-muted)] [--tw-prose-hr:var(--color-line)] [--tw-prose-quotes:var(--color-ink)] [--tw-prose-quote-borders:var(--color-line-strong)] [--tw-prose-captions:var(--color-muted)] [--tw-prose-code:var(--color-ink)] [--tw-prose-pre-code:var(--color-ink)] [--tw-prose-pre-bg:var(--color-sunken)] [--tw-prose-th-borders:var(--color-line-strong)] [--tw-prose-td-borders:var(--color-line)]';
