import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    MessageSquare,
    Edit2,
    Trash2,
    Eye,
    CheckCircle,
    Calendar,
    Building,
    ExternalLink,
    BookOpen,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import GroupEditModal from '../../components/GroupEditModal';
import FilterBar from '../../components/Common/FilterBar';
import BackButton from '../../components/Common/BackButton';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';

const GroupList = () => {
    const location = useLocation();
    const { collegeslug } = useParams();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || '';
    const initialPage = parseInt(params.get('page')) || 1;
    const initialSubmissionStatus = params.get('submissionStatus') || '';
    const initialDeleted = params.get('deleted') || '';

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        submissionStatus: initialSubmissionStatus,
        deleted: initialDeleted,
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || 'Confirm Action',
                message: config.message,
                variant: config.variant || 'danger',
                onConfirm: () => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const handleCloseConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        fetchGroups();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (timeFilter) params.set('time', timeFilter);
        if (filters.submissionStatus)
            params.set('submissionStatus', filters.submissionStatus);
        if (filters.deleted) params.set('deleted', filters.deleted);
        if (page > 1) params.set('page', page.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [search, timeFilter, filters, page, navigate]);

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/group/all/${collegeslug}`);
            setGroups(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setError('Failed to fetch groups');
            toast.error('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setShowModal(true);
    };

    const handleDelete = async (group) => {
        const confirmed = await showConfirm({
            title: 'Delete Group',
            message: `Are you sure you want to delete "${group.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/group/delete/${group._id}`);
                toast.success('Group deleted successfully');
                fetchGroups();
            } catch (error) {
                console.error('Error deleting group:', error);
                toast.error('Failed to delete group');
            }
        }
    };

    const handleView = (group) => {
        navigate(`/${collegeslug}/groups/${group._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingGroup(null);
    };

    const handleModalSuccess = () => {
        fetchGroups();
        handleModalClose();
    };

    // Get unique values for filters
    const uniqueStatuses = ['pending', 'approved', 'rejected'];

    // Apply filters and sorting
    const filtered = groups.filter((group) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            group.title?.toLowerCase().includes(q) ||
            group.info?.toLowerCase().includes(q) ||
            group.domain?.toLowerCase().includes(q);

        const matchesStatus =
            !filters.submissionStatus ||
            group.submissionStatus === filters.submissionStatus;

        const matchesDeleted =
            filters.deleted === '' ||
            (filters.deleted === 'true' ? group.deleted : !group.deleted);

        // Time filter using the utility
        const matchesTime = filterByTime(group, timeFilter);

        return matchesSearch && matchesStatus && matchesDeleted && matchesTime;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'createdAt') {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortBy === 'clickCounts') {
            const countA = a.clickCounts || 0;
            const countB = b.clickCounts || 0;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
        }
        return 0;
    });

    const start = (page - 1) * pageSize;
    const current = sorted.slice(start, start + pageSize);

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const totalGroups = sorted.length;

    const resetFilters = () => {
        setFilters({
            submissionStatus: '',
            deleted: '',
        });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const clearAllFilters = () => {
        setSearch('');
        setTimeFilter('');
        resetFilters();
        setPage(1);
    };

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    if (loading) {
        return <Loader />;
    }

    console.log('Rendered GroupList with groups:', groups);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {/* Header */}
                    <BackButton
                        title={`Groups for ${collegeslug}`}
                        TitleIcon={MessageSquare}
                    />
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalGroups}
                            </span>
                        </div>

                        {/* FilterBar */}
                        <FilterBar
                            search={search}
                            onSearch={(v) => {
                                setSearch(v);
                                setPage(1);
                            }}
                            searchPlaceholder='Search groups...'
                            filters={[
                                {
                                    label: 'Status',
                                    value: filters.submissionStatus,
                                    onChange: (v) =>
                                        setFilters({
                                            ...filters,
                                            submissionStatus: v,
                                        }),
                                    options: [
                                        { value: '', label: 'All Statuses' },
                                        ...uniqueStatuses.map((s) => ({
                                            value: s,
                                            label:
                                                s.charAt(0).toUpperCase() +
                                                s.slice(1),
                                        })),
                                    ],
                                },
                                {
                                    label: 'Deleted',
                                    value: filters.deleted,
                                    onChange: (v) =>
                                        setFilters({ ...filters, deleted: v }),
                                    options: [
                                        { value: '', label: 'All (Deleted)' },
                                        { value: 'true', label: 'Deleted' },
                                        {
                                            value: 'false',
                                            label: 'Not Deleted',
                                        },
                                    ],
                                },
                            ]}
                            timeFilter={{
                                value: timeFilter,
                                onChange: (v) => {
                                    setTimeFilter(v);
                                    setPage(1);
                                },
                            }}
                            sortBy={{
                                value: sortBy,
                                onChange: setSortBy,
                                options: [
                                    {
                                        value: 'createdAt',
                                        label: 'Sort by Date',
                                    },
                                    {
                                        value: 'clickCounts',
                                        label: 'Sort by Views',
                                    },
                                ],
                            }}
                            sortOrder={{
                                value: sortOrder,
                                onToggle: () =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    ),
                            }}
                            viewMode={{
                                value: viewMode,
                                onChange: setViewMode,
                            }}
                            onClear={clearAllFilters}
                            showClear={
                                !!(
                                    search ||
                                    timeFilter ||
                                    activeFiltersCount > 0
                                )
                            }
                        />
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Groups Table View */}
                    {viewMode === 'table' && !loading && (
                        <>
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                <div className='overflow-x-auto'>
                                    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                        <thead className='bg-gray-50 dark:bg-gray-700'>
                                            <tr>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Group
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Domain & Submission
                                                </th>
                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Status
                                                </th>

                                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Date Created
                                                </th>
                                                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                            {current.map((group) => (
                                                <tr
                                                    key={group._id}
                                                    className='hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                                                >
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <div className='flex items-center'>
                                                            <div className='flex-shrink-0 h-12 w-12'>
                                                                <div className='h-12 w-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center'>
                                                                    <MessageSquare className='h-6 w-6 text-white' />
                                                                </div>
                                                            </div>
                                                            <div className='ml-4'>
                                                                <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                                    {
                                                                        group.title
                                                                    }
                                                                </div>
                                                                <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                                    {group.info ||
                                                                        'No description'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <div className='space-y-1'>
                                                            <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                                <Building className='h-4 w-4 text-green-500 mr-2' />
                                                                {group.domain ||
                                                                    'General'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                group.submissionStatus ===
                                                                'approved'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                            }`}
                                                        >
                                                            <CheckCircle className='w-3 h-3 mr-1' />
                                                            {group.submissionStatus ||
                                                                'pending'}
                                                        </span>

                                                        {group.clickCounts >
                                                            0 && (
                                                            <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400'>
                                                                <Eye className='w-4 h-4' />
                                                                <span className='text-xs'>
                                                                    {
                                                                        group.clickCounts
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                                        <div className='flex items-center'>
                                                            <Calendar className='h-4 w-4 mr-2' />
                                                            {group.createdAt
                                                                ? new Date(
                                                                      group.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                        <div className='flex items-center justify-end space-x-2'>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleView(
                                                                        group,
                                                                    );
                                                                }}
                                                                className='text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded'
                                                                title='View Details'
                                                            >
                                                                <Eye className='h-4 w-4' />
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(
                                                                        group,
                                                                    );
                                                                }}
                                                                className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                                title='Edit Group'
                                                            >
                                                                <Edit2 className='h-4 w-4' />
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(
                                                                        group,
                                                                    );
                                                                }}
                                                                className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                                title='Delete Group'
                                                            >
                                                                <Trash2 className='h-4 w-4' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className='bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                                        <Pagination
                                            currentPage={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                            pageSize={pageSize}
                                            onPageSizeChange={(newSize) => {
                                                setPageSize(newSize);
                                                setPage(1);
                                            }}
                                            totalItems={sorted.length}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && !loading && (
                        <>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                                {current.map((group) => (
                                    <div
                                        key={group._id}
                                        className='bg-white mt-5 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow'
                                    >
                                        {/* Group Details */}
                                        <div className='p-4'>
                                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate'>
                                                {group.title}
                                            </h3>
                                            <p className='text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2'>
                                                {group.info || 'No description'}
                                            </p>

                                            {/* Domain and Views */}
                                            <div className='flex items-center justify-between mb-3'>
                                                <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                                                    <Building className='h-4 w-4 mr-1 text-green-500' />
                                                    {group.domain || 'General'}
                                                </div>
                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                    <Eye className='w-4 h-4 mr-1' />
                                                    {group.clickCounts || 0}
                                                </div>
                                            </div>

                                            {/* Submission Status and Date */}
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
                                                <div className='flex items-center mb-1'>
                                                    <BookOpen className='h-3 w-3 mr-1' />
                                                    {group.submissionStatus ||
                                                        'pending'}
                                                </div>
                                                <div className='flex items-center'>
                                                    <Calendar className='h-3 w-3 mr-1' />
                                                    {group.createdAt
                                                        ? new Date(
                                                              group.createdAt,
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className='flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700'>
                                                <div className='flex items-center space-x-2'>
                                                    {group.link && (
                                                        <button
                                                            onClick={() =>
                                                                window.open(
                                                                    group.link,
                                                                    '_blank',
                                                                )
                                                            }
                                                            className='text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded'
                                                            title='Open WhatsApp'
                                                        >
                                                            <ExternalLink className='h-4 w-4' />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            handleView(group)
                                                        }
                                                        className='flex items-center text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors text-sm'
                                                    >
                                                        <Eye className='h-4 w-4 mr-1' />
                                                        View
                                                    </button>
                                                </div>
                                                <div className='flex items-center space-x-2'>
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(group)
                                                        }
                                                        className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                        title='Edit Group'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(group)
                                                        }
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                        title='Delete Group'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination for Grid */}
                            {totalPages > 1 && (
                                <div className='mt-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700'>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        pageSize={pageSize}
                                        onPageSizeChange={(newSize) => {
                                            setPageSize(newSize);
                                            setPage(1);
                                        }}
                                        totalItems={sorted.length}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <GroupEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                group={editingGroup}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default GroupList;
