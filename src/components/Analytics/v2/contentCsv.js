import { contentTitle, typeLabel } from './data.js';

export const contentCsvColumns = [
    { label: 'Title', value: contentTitle },
    { label: 'Type', value: (row) => typeLabel(row._id.type) },
    { label: 'Content ID', value: (row) => row._id.id },
    ...[
        ['Views', 'views'],
        ['Downloads', 'downloads'],
        ['Unlocks', 'unlocks'],
        ['7-day views', 'views7d'],
        ['30-day views', 'views30d'],
        ['Views since launch', 'allTime'],
    ].map(([label, key]) => ({ label, value: (row) => row[key] || 0 })),
];
