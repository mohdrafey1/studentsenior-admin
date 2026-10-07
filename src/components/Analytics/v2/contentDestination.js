const DETAILS = {
    pyq: ['pyq', 'pyqs'],
    note: ['notes', 'notes'],
    senior: ['senior', 'seniors'],
    product: ['store', 'products'],
    syllabus: ['syllabus', 'syllabus'],
    video: ['video', 'videos'],
    group: ['group', 'groups'],
    opportunity: ['opportunity', 'opportunities'],
    lostfound: ['lostandfound', 'lost-found'],
};

// Resolve on navigation, so a top-20 table does not make 20 metadata requests.
// IDs in analytics do not contain a college; never guess the last selected one.
export async function contentDestination(type, id, colleges, get) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new Error('Invalid content ID.');
    if (type === 'blog') return `/blog/edit/${id}`;
    if (type === 'affiliate') return '/affiliate-products'; // This catalog uses an inline editor.
    if (DETAILS[type]) {
        const [endpoint, page] = DETAILS[type];
        const response = await get(`/${endpoint}/${id}`);
        const item = response.data.data;
        const collegeId = item?.college?._id || item?.college;
        const slug =
            item?.college?.slug ||
            colleges.find((college) => college._id === collegeId)?.slug;
        if (!slug)
            throw new Error(
                'This content no longer has a college in the catalog.',
            );
        return `/${encodeURIComponent(slug)}/${page}/${id}`;
    }
    if (!['quicknote', 'solution'].includes(type))
        throw new Error('This content type has no admin editor.');
    // These two existing APIs expose editors by subject/PYQ, but analytics
    // identifies the note/solution itself. Search their paginated catalogs to
    // find that parent instead of confusing a solution ID with its PYQ ID.
    for (const college of colleges) {
        const endpoint = type === 'quicknote' ? 'quicknotes' : 'pyq-solution';
        let page = 1;
        let pages = 1;
        do {
            const response = await get(
                `/${endpoint}/all/${encodeURIComponent(college.slug)}`,
                { params: { page, limit: 100 } },
            );
            const item = (response.data.data || []).find(
                (row) => row._id === id,
            );
            if (item) {
                if (type === 'quicknote') {
                    const subject = item.subject?._id || item.subject;
                    if (subject)
                        return `/reports/subjects/${subject}/quick-notes?unit=${item.unitNumber}`;
                } else {
                    const pyq = item.pyq?._id || item.pyq;
                    if (pyq) return `/${college.slug}/pyqs/${pyq}/aisolution`;
                }
                throw new Error(
                    'The parent content for this editor is no longer available.',
                );
            }
            pages = Number(response.data.pagination?.pages) || 1;
            page += 1;
        } while (page <= pages);
    }
    throw new Error('This content was deleted or is no longer in the catalog.');
}
