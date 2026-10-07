import { CONTENT_TYPES } from './data.js';

// The server resolves one canonical editor destination, including parent IDs
// for quick notes and solutions. Never scan catalogs or guess a college here.
export async function contentDestination(type, id, get) {
    if (
        !/^[a-f\d]{24}$/i.test(id) ||
        !CONTENT_TYPES.some((item) => item.value === type)
    )
        throw new Error('Invalid content reference.');
    const response = await get(
        `/analytics/v2/content/${type}/${id}/destination`,
    );
    const path = response.data.data?.path;
    if (
        typeof path !== 'string' ||
        !path.startsWith('/') ||
        path.startsWith('//') ||
        /[\\\r\n]/.test(path)
    )
        throw new Error('This content has no available admin destination.');
    return path;
}
