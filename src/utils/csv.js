const escape = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Download rows as a CSV file.
 * columns: [{ label, value: (row) => any }]
 */
export function downloadCsv(filename, columns, rows) {
    const lines = [
        columns.map((c) => escape(c.label)).join(','),
        ...rows.map((row) =>
            columns.map((c) => escape(c.value(row))).join(','),
        ),
    ];
    // BOM so Excel reads ₹ and non-English names correctly.
    const blob = new Blob(['﻿' + lines.join('\r\n')], {
        type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
