/**
 * Blog endpoints, merged in from the former ss-blog-dashboard.
 *
 * Paths are relative to the shared axios instance in utils/api.js, whose
 * baseURL already ends in /dashboard. That instance attaches the admin JWT and
 * redirects to /login on a 401, so the blog inherits the admin's session
 * rather than keeping one of its own.
 */
export const blogEndpoints = {
    list: '/blogs',
    bySlug: (slug) => `/blogs/${slug}`,
    create: '/blogs',
    update: (slug) => `/blogs/${slug}`,
    remove: (slug) => `/blogs/${slug}`,
    aiSummary: '/blogs/ai-summary',
    aiPost: '/blogs/ai-post',
};

/** Where the blog section lives in the admin's routing. */
export const blogRoutes = {
    list: '/blog',
    create: '/blog/create',
    edit: (slug) => `/blog/edit/${slug}`,
    analytics: '/blog/analytics',
};
