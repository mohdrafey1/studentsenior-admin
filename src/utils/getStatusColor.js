export const getStatusBadge = (status) => {
    const statusColors = {
        pending:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        approved:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return statusColors[status] || statusColors.pending;
};
