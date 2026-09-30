/** Two-letter initials from a name, e.g. "Integral University" -> "IU". */
export const collegeInitials = (name = '') =>
    name
        .split(/\s+/)
        .filter((word) => /^[A-Z]/.test(word))
        .slice(0, 2)
        .map((word) => word[0])
        .join('') || name.slice(0, 2).toUpperCase();

/** Initials for a person, e.g. "Mohd Rafey" -> "MR", "aman.k" -> "AM". */
export const personInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || '?').slice(0, 2).toUpperCase();
};
