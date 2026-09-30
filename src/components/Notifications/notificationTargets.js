// Who a notification can go to. The API validates the same shapes.
export const AUDIENCES = [
    { value: 'all', label: 'Everyone' },
    { value: 'premium', label: 'Premium members' },
    { value: 'free', label: 'Free users' },
    { value: 'new', label: 'New students' },
    { value: 'college', label: 'Students of one college' },
    { value: 'users', label: 'Specific students' },
];

export const NEW_STUDENT_DAYS = [
    { value: '7', label: 'Joined in the last 7 days' },
    { value: '30', label: 'Joined in the last 30 days' },
];

// Up to this many hand-picked students per notification (API limit).
export const MAX_PICKED_STUDENTS = 50;

// What the app opens when the notification is tapped.
export const TAP_TARGETS = [
    { value: '', label: 'Nothing, just open the app' },
    { value: 'blog', label: 'A blog post' },
    { value: 'link', label: 'A web link' },
    { value: 'pyqs', label: 'PYQs page' },
    { value: 'notes', label: 'Notes page' },
    { value: 'syllabus', label: 'Syllabus page' },
    { value: 'store', label: 'Store page' },
    { value: 'college', label: 'College home' },
    { value: 'profile', label: 'User profile' },
    { value: 'settings', label: 'Settings' },
    { value: 'collection', label: 'Saved collection' },
];

// Targets that need a college, and the ones that can open a single item.
export const COLLEGE_TARGETS = [
    'pyqs',
    'notes',
    'syllabus',
    'store',
    'college',
];
export const ITEM_TARGETS = ['pyqs', 'notes', 'syllabus', 'store'];

/** The audience object the API expects, from the form's fields. */
export function buildAudience(form) {
    switch (form.audience) {
        case 'new':
            return { type: 'new', days: Number(form.days) };
        case 'college':
            return { type: 'college', college: form.audienceCollege };
        case 'users':
            return { type: 'users', userIds: form.students.map((s) => s._id) };
        default:
            return { type: form.audience || 'all' };
    }
}

/** The data object the app reads when the notification is tapped. */
export function buildData(form) {
    if (!form.screen) return {};
    if (form.screen === 'blog') {
        return { screen: 'blog', params: { slug: form.blog?.slug } };
    }
    if (form.screen === 'link') {
        return { screen: 'link', url: form.url.trim() };
    }
    const params = {};
    if (form.college) params.college = form.college;
    if (form.slug) params.slug = form.slug;
    return { screen: form.screen, params };
}

/** Why the audience isn't ready to send, or '' when it is. */
export function audienceProblem(form) {
    if (form.audience === 'college' && !form.audienceCollege) {
        return 'Choose the college';
    }
    if (form.audience === 'users' && form.students.length === 0) {
        return 'Add at least one student';
    }
    return '';
}

/** Why the tap target isn't ready, or '' when it is. */
export function targetProblem(form) {
    if (form.screen === 'blog' && !form.blog?.slug) return 'Pick a blog post';
    if (form.screen === 'link') {
        const url = form.url.trim();
        if (!url) return 'Add the link';
        try {
            if (new URL(url).protocol !== 'https:') {
                return 'Links must start with https://';
            }
        } catch {
            return 'That isn’t a valid link';
        }
    }
    if (COLLEGE_TARGETS.includes(form.screen) && !form.college) {
        return 'Choose the college to open';
    }
    return '';
}

/** One line saying who a notification went (or goes) to. */
export function describeAudience(audience) {
    switch (audience?.type) {
        case 'premium':
            return 'Premium members';
        case 'free':
            return 'Free users';
        case 'new':
            return `Students who joined in the last ${audience.days} days`;
        case 'college':
            return `Students of ${audience.college}`;
        case 'users': {
            const names = (audience.users || []).map((u) => `@${u.username}`);
            const count = audience.userIds?.length || names.length;
            if (!names.length) return `${count} specific students`;
            const shown = names.slice(0, 3).join(', ');
            return count > 3 ? `${shown} and ${count - 3} more` : shown;
        }
        default:
            return 'Everyone';
    }
}

/** One line saying what tapping opens. */
export function describeTarget(data, collegeName = (slug) => slug) {
    const bare = (url) => url.replace(/^https:\/\//, '');
    if (!data?.screen && data?.url) return bare(data.url);
    if (!data?.screen) return 'The app';
    const label = TAP_TARGETS.find((t) => t.value === data.screen)?.label;
    if (data.screen === 'blog') {
        return data.params?.slug
            ? `Blog post · ${data.params.slug}`
            : 'The blog';
    }
    if (data.screen === 'link') return data.url ? bare(data.url) : 'A web link';
    return [
        label || data.screen,
        data.params?.college && collegeName(data.params.college),
        data.params?.slug,
    ]
        .filter(Boolean)
        .join(' · ');
}
