// One-click starting points for a rejection reason; the admin can edit the
// text. The uploader sees it, so each one says what to fix.
export const COMMON_REASONS = [
    [
        'Unreadable',
        'The file is blurry or unreadable. Please upload a clearer copy.',
    ],
    [
        'Incomplete',
        'Some pages or parts are missing. Please upload the complete file.',
    ],
    [
        'Wrong subject or college',
        'This was posted under the wrong subject or college.',
    ],
    ['Duplicate', 'This is already on StudentSenior.'],
    [
        'Not relevant',
        'This isn’t study material or doesn’t belong on StudentSenior.',
    ],
];

// The API requires 10–500 characters for a rejection reason.
export const REASON_MIN = 10;
export const REASON_MAX = 500;

/** Error message for a reason the API would refuse, or '' when it's fine. */
export const reasonError = (text) => {
    const length = text.trim().length;
    if (!length) return 'Add a reason so they know what to fix';
    if (length < REASON_MIN)
        return `Write at least ${REASON_MIN} characters so they know what to fix`;
    if (length > REASON_MAX) return `Keep it under ${REASON_MAX} characters`;
    return '';
};
