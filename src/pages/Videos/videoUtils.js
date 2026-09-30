// Helpers for student-shared video links (almost always YouTube).

const YOUTUBE_ID =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;

/** The 11-character YouTube id in a watch, share, embed or shorts link. */
export const youtubeId = (url) => {
    if (!url) return null;
    const match = String(url).match(YOUTUBE_ID);
    return match ? match[1] : null;
};

/** YouTube's own thumbnail for a link, or null for other hosts. */
export const youtubeThumb = (url) => {
    const id = youtubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
};

/** "youtube.com/watch?v=…" — the link without the protocol, for display. */
export const shortUrl = (url) =>
    String(url || '')
        .replace(/^https?:\/\/(www\.)?/, '')
        .replace(/\/$/, '');
