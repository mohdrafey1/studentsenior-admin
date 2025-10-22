import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Play,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    ThumbsUp,
    ExternalLink,
    Grid3x3,
    List,
    Filter,
    X,
    Video,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import VideoEditModal from '../components/VideoEditModal';

const VideoList = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [showModal, setShowModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        submissionStatus: '',
        deleted: '',
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Toggle view mode (user can still manually switch)
    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

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
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    useEffect(() => {
        fetchVideos();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/video/${collegeslug}`);

            setVideos(response.data.data.videos);

            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch videos');
            toast.error('Failed to fetch videos');
        } finally {
            setLoading(false);
        }
    };
    const handleEdit = (video) => {
        setEditingVideo(video);
        setShowModal(true);
    };

    const handleDelete = async (video) => {
        const confirmed = await showConfirm({
            title: 'Delete Video',
            message: `Are you sure you want to delete "${video.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/video/delete/${video._id}`);
                setVideos(videos.filter((v) => v._id !== video._id));
                toast.success('Video deleted successfully');
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete video',
                );
            }
        }
        closeConfirm();
    };

    const handleView = (video) => {
        navigate(`/${collegeslug}/videos/${video._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingVideo(null);
    };

    const handleModalSuccess = (updatedVideo) => {
        if (editingVideo) {
            // Update existing video
            setVideos((prev) =>
                prev.map((v) =>
                    v._id === updatedVideo._id ? updatedVideo : v,
                ),
            );
        } else {
            // Add new video
            setVideos((prev) => [updatedVideo, ...prev]);
        }
        handleModalClose();
    };

    const getStatusColor = (status) => {
        const colors = {
            approved:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            rejected:
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status) => {
        const icons = {
            approved: CheckCircle,
            pending: Clock,
            rejected: XCircle,
        };
        const Icon = icons[status] || Clock;
        return <Icon className='h-4 w-4' />;
    };

    // Filter, sort, and paginate
    const filtered = videos.filter((video) => {
        const subjectName = video.subject?.subjectName || video.subject || '';
        const matchesSearch =
            video.title?.toLowerCase().includes(search.toLowerCase()) ||
            video.description?.toLowerCase().includes(search.toLowerCase()) ||
            subjectName.toLowerCase().includes(search.toLowerCase()) ||
            video.owner?.username?.toLowerCase().includes(search.toLowerCase());

        const matchesSubmissionStatus =
            !filters.submissionStatus ||
            video.submissionStatus === filters.submissionStatus;
        const matchesDeleted =
            !filters.deleted || video.deleted?.toString() === filters.deleted;

        return matchesSearch && matchesSubmissionStatus && matchesDeleted;
    });

    const sorted = [...filtered].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortBy === 'createdAt') {
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        }

        if (sortBy === 'clickCounts') {
            const aCount = Number(aValue) || 0;
            const bCount = Number(bValue) || 0;
            return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
        }

        return 0;
    });

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const uniqueStatuses = [
        ...new Set(videos.map((video) => video.submissionStatus)),
    ].filter(Boolean);

    const resetFilters = () => {
        setFilters({
            submissionStatus: '',
            deleted: '',
        });
        setSearch('');
        setPage(1);
    };

    const activeFiltersCount =
        (filters.submissionStatus ? 1 : 0) + (filters.deleted ? 1 : 0);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading videos...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center'>
                        <div className='text-red-600 dark:text-red-400 text-lg font-medium mb-2'>
                            Error Loading Videos
                        </div>
                        <p className='text-red-500 dark:text-red-300 mb-4'>
                            {error}
                        </p>
                        <button
                            onClick={fetchVideos}
                            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors'
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {/* Header */}
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center space-x-4'>
                            <button
                                onClick={() => navigate(-1)}
                                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='h-5 w-5 text-gray-600 dark:text-gray-400' />
                            </button>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3'>
                                    <div className='p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl'>
                                        <Video className='h-8 w-8 text-white' />
                                    </div>
                                    Educational Videos
                                </h1>
                                <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                    Manage educational video content for this
                                    college
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-6'>
                        {/* Search and Controls */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4'>
                            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                                {/* Search Bar */}
                                <div className='relative flex-1 max-w-md'>
                                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                                    <input
                                        type='text'
                                        placeholder='Search videos...'
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    />
                                </div>

                                {/* Controls */}
                                <div className='flex items-center gap-3'>
                                    {/* View Mode Toggle */}
                                    <div className='flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                                        <button
                                            onClick={() =>
                                                toggleViewMode('grid')
                                            }
                                            className={`p-2 rounded transition-colors ${
                                                viewMode === 'grid'
                                                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                            title='Grid View'
                                        >
                                            <Grid3x3 className='h-5 w-5' />
                                        </button>
                                        <button
                                            onClick={() =>
                                                toggleViewMode('table')
                                            }
                                            className={`p-2 rounded transition-colors ${
                                                viewMode === 'table'
                                                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                            title='Table View'
                                        >
                                            <List className='h-5 w-5' />
                                        </button>
                                    </div>

                                    {/* Filter Toggle */}
                                    <button
                                        onClick={() =>
                                            setShowFilters(!showFilters)
                                        }
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                            showFilters
                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Filter className='h-4 w-4' />
                                        Filters
                                        {activeFiltersCount > 0 && (
                                            <span className='bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Sort Dropdown */}
                                    <select
                                        value={`${sortBy}-${sortOrder}`}
                                        onChange={(e) => {
                                            const [field, order] =
                                                e.target.value.split('-');
                                            setSortBy(field);
                                            setSortOrder(order);
                                        }}
                                        className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    >
                                        <option value='createdAt-desc'>
                                            Newest First
                                        </option>
                                        <option value='createdAt-asc'>
                                            Oldest First
                                        </option>
                                        <option value='clickCounts-desc'>
                                            Most Views
                                        </option>
                                        <option value='clickCounts-asc'>
                                            Least Views
                                        </option>
                                    </select>

                                    {/* Clear Filters */}
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={resetFilters}
                                            className='flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
                                        >
                                            <X className='h-4 w-4' />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter Panel */}
                            {showFilters && (
                                <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4'>
                                        <select
                                            value={filters.submissionStatus}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    submissionStatus:
                                                        e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All Submission Statuses
                                            </option>
                                            {uniqueStatuses.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        status.slice(1)}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={filters.deleted}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    deleted: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All (Deleted Status)
                                            </option>
                                            <option value='true'>
                                                Deleted
                                            </option>
                                            <option value='false'>
                                                Not Deleted
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {current.length === 0 ? (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center'>
                            <Video className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                No videos found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 mb-4'>
                                {search || activeFiltersCount > 0
                                    ? 'Try adjusting your search or filters'
                                    : 'No videos have been uploaded yet'}
                            </p>
                            <button
                                onClick={() => setShowModal(true)}
                                className='bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                Add First Video
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-50 dark:bg-gray-700'>
                                                <tr>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Video
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Subject
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Posted By
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Views / Date
                                                    </th>
                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((video) => (
                                                    <tr
                                                        key={video._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                                        onClick={() =>
                                                            handleView(video)
                                                        }
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='flex items-center'>
                                                                <div className='flex-shrink-0 h-12 w-20'>
                                                                    {video.thumbnailUrl ? (
                                                                        <img
                                                                            src={
                                                                                video.thumbnailUrl
                                                                            }
                                                                            alt={
                                                                                video.title
                                                                            }
                                                                            className='h-12 w-20 rounded object-cover'
                                                                        />
                                                                    ) : (
                                                                        <div className='h-12 w-20 rounded bg-gradient-to-r from-red-400 to-pink-400 flex items-center justify-center'>
                                                                            <Play className='h-6 w-6 text-white' />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className='ml-4'>
                                                                    <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                                        {
                                                                            video.title
                                                                        }
                                                                    </div>
                                                                    <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                                        {video.description ||
                                                                            'No description'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                                <BookOpen className='h-4 w-4 text-blue-500 mr-2' />
                                                                {video.subject
                                                                    ?.subjectName ||
                                                                    video.subject ||
                                                                    'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                    video.submissionStatus,
                                                                )}`}
                                                            >
                                                                {getStatusIcon(
                                                                    video.submissionStatus,
                                                                )}
                                                                <span className='capitalize'>
                                                                    {
                                                                        video.submissionStatus
                                                                    }
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                                <User className='h-4 w-4 text-gray-400 mr-2' />
                                                                {video.owner
                                                                    ?.username ||
                                                                    'Unknown'}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='space-y-1'>
                                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                    <Eye className='h-4 w-4 mr-2' />
                                                                    {video.clickCounts ||
                                                                        0}{' '}
                                                                    views
                                                                </div>
                                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                    <Calendar className='h-4 w-4 mr-2' />
                                                                    {new Date(
                                                                        video.createdAt,
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                            <div className='flex items-center justify-end space-x-2'>
                                                                {video.videoUrl && (
                                                                    <button
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            window.open(
                                                                                video.videoUrl,
                                                                                '_blank',
                                                                            );
                                                                        }}
                                                                        className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded'
                                                                        title='Watch Video'
                                                                    >
                                                                        <ExternalLink className='h-4 w-4' />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleEdit(
                                                                            video,
                                                                        );
                                                                    }}
                                                                    className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                                    title='Edit Video'
                                                                >
                                                                    <Edit2 className='h-4 w-4' />
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(
                                                                            video,
                                                                        );
                                                                    }}
                                                                    className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                                    title='Delete Video'
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
                                </div>
                            )}

                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                    {current.map((video) => (
                                        <div
                                            key={video._id}
                                            className='bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer'
                                            onClick={() => handleView(video)}
                                        >
                                            {/* Video Thumbnail */}
                                            <div className='relative aspect-video bg-gray-200 dark:bg-gray-600'>
                                                {video.thumbnailUrl ? (
                                                    <img
                                                        src={video.thumbnailUrl}
                                                        alt={video.title}
                                                        className='w-full h-full object-cover'
                                                    />
                                                ) : (
                                                    <div className='w-full h-full flex items-center justify-center'>
                                                        <Play className='h-12 w-12 text-gray-400' />
                                                    </div>
                                                )}
                                                {/* Status Badge */}
                                                <div className='absolute top-2 left-2'>
                                                    <span
                                                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                            video.submissionStatus,
                                                        )}`}
                                                    >
                                                        {getStatusIcon(
                                                            video.submissionStatus,
                                                        )}
                                                        <span className='capitalize'>
                                                            {
                                                                video.submissionStatus
                                                            }
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Video Info */}
                                            <div className='p-4'>
                                                <h3 className='font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2'>
                                                    {video.title}
                                                </h3>
                                                <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
                                                    {video.description}
                                                </p>

                                                {/* Video Meta */}
                                                <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3'>
                                                    <div className='flex items-center space-x-1'>
                                                        <Calendar className='h-3 w-3' />
                                                        <span>
                                                            {new Date(
                                                                video.createdAt,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Subject and Creator */}
                                                <div className='flex items-center justify-between text-xs'>
                                                    <div className='flex items-center space-x-1'>
                                                        <BookOpen className='h-3 w-3 text-blue-500' />
                                                        <span className='text-blue-600 dark:text-blue-400 font-medium'>
                                                            {video.subject
                                                                ?.subjectName ||
                                                                video.subject}
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center space-x-1'>
                                                        <User className='h-3 w-3 text-gray-400' />
                                                        <span className='text-gray-500 dark:text-gray-400'>
                                                            {
                                                                video.owner
                                                                    .username
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className='flex items-center justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-600'>
                                                    <div className='flex space-x-1'>
                                                        {video.videoUrl && (
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    window.open(
                                                                        video.videoUrl,
                                                                        '_blank',
                                                                    );
                                                                }}
                                                                className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
                                                                title='Watch Video'
                                                            >
                                                                <ExternalLink className='h-4 w-4' />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(
                                                                    video,
                                                                );
                                                            }}
                                                            className='p-1 text-gray-400 hover:text-yellow-600 transition-colors'
                                                            title='Edit Video'
                                                        >
                                                            <Edit2 className='h-4 w-4' />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(
                                                                    video,
                                                                );
                                                            }}
                                                            className='p-1 text-gray-400 hover:text-red-600 transition-colors'
                                                            title='Delete Video'
                                                        >
                                                            <Trash2 className='h-4 w-4' />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className='mt-6'>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        pageSize={pageSize}
                                        onPageSizeChange={setPageSize}
                                        totalItems={totalItems}
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
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <VideoEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                video={editingVideo}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default VideoList;
