// Human labels for values the API stores as codes.

export const EXAM_TYPES = [
    { value: 'midsem1', label: 'Mid Semester 1' },
    { value: 'midsem2', label: 'Mid Semester 2' },
    { value: 'endsem', label: 'End Semester' },
    { value: 'improvement', label: 'Improvement' },
];

// Bulk import stores older spellings (Endsem, Midsem, Quiz, Other).
const EXAM_TYPE_ALIASES = {
    endsem: 'End Semester',
    midsem: 'Mid Semester',
    quiz: 'Quiz',
    other: 'Other',
};

export const examTypeLabel = (value) => {
    if (!value) return '—';
    const key = String(value).toLowerCase();
    return (
        EXAM_TYPES.find((t) => t.value === key)?.label ||
        EXAM_TYPE_ALIASES[key] ||
        value
    );
};
