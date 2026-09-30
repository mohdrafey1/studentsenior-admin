/** "12 min ago", "yesterday", "5 days ago" — for timestamps in the recent past. */
export const relativeTime = (date) => {
    if (!date) return '';
    const diffMins = Math.floor((Date.now() - new Date(date)) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
};
