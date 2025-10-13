import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Briefcase,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import OpportunityEditModal from '../components/OpportunityEditModal';

const OpportunityList = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

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
        fetchOpportunities();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/opportunity/${collegeslug}`);
            setOpportunities(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            setError('Failed to fetch opportunities');
            toast.error('Failed to fetch opportunities');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (opportunity) => {
        setEditingOpportunity(opportunity);
        setShowModal(true);
    };

    const handleDelete = async (opportunity) => {
        const confirmed = await showConfirm({
            title: 'Delete Opportunity',
            message: `Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/opportunity/delete/${opportunity._id}`);
                toast.success('Opportunity deleted successfully');
                fetchOpportunities();
            } catch (error) {
                console.error('Error deleting opportunity:', error);
                toast.error('Failed to delete opportunity');
            }
        }
    };

    const handleView = (opportunity) => {
        navigate(`/${collegeslug}/opportunities/${opportunity._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingOpportunity(null);
    };

    const handleModalSuccess = () => {
        fetchOpportunities();
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

    // Filter opportunities based on search
    const filteredOpportunities = opportunities.filter(
        (opportunity) =>
            opportunity.name?.toLowerCase().includes(search.toLowerCase()) ||
            opportunity.description
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            opportunity.email?.toLowerCase().includes(search.toLowerCase()) ||
            opportunity.owner?.username
                ?.toLowerCase()
                .includes(search.toLowerCase()),
    );

    // Pagination
    const totalItems = filteredOpportunities.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentOpportunities = filteredOpportunities.slice(
        startIndex,
        endIndex,
    );

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading opportunities...
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
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${mainContentMargin} transition-all duration-300`}>
                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center'>
                        <div className='text-red-600 dark:text-red-400 text-lg font-medium mb-2'>
                            Error Loading Opportunities
                        </div>
                        <p className='text-red-500 dark:text-red-300 mb-4'>
                            {error}
                        </p>
                        <button
                            onClick={fetchOpportunities}
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
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${mainContentMargin} transition-all duration-300`}>
                {/* Header Section */}
                <div className='mb-8'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back
                    </button>

                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3'>
                                <div className='p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl'>
                                    <Briefcase className='h-8 w-8 text-white' />
                                </div>
                                Opportunities
                            </h1>
                            <p className='text-gray-600 dark:text-gray-400 mt-2'>
                                Manage job and internship opportunities for this
                                college
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Stats */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div className='relative flex-1 max-w-md'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                            <input
                                type='text'
                                placeholder='Search opportunities by name, description, email...'
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            />
                        </div>

                        <div className='flex items-center space-x-4 text-sm'>
                            <div className='bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg'>
                                <span className='text-blue-600 dark:text-blue-400 font-medium'>
                                    Total: {opportunities.length}
                                </span>
                            </div>
                            <div className='bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg'>
                                <span className='text-green-600 dark:text-green-400 font-medium'>
                                    Showing: {currentOpportunities.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Opportunities Table */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                    {currentOpportunities.length === 0 ? (
                        <div className='p-12 text-center'>
                            <Briefcase className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                No opportunities found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {search
                                    ? 'Try adjusting your search criteria'
                                    : 'No opportunities have been submitted yet'}
                            </p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                <thead className='bg-gray-50 dark:bg-gray-700'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Opportunity
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Contact
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Status
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                            Posted By
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
                                    {currentOpportunities.map((opportunity) => (
                                        <tr
                                            key={opportunity._id}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                            onClick={() =>
                                                handleView(opportunity)
                                            }
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-10 w-10'>
                                                        <div className='h-10 w-10 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center'>
                                                            <Briefcase className='h-6 w-6 text-white' />
                                                        </div>
                                                    </div>
                                                    <div className='ml-4'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                            {opportunity.name}
                                                        </div>
                                                        <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                            {opportunity.description ||
                                                                'No description'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='space-y-1'>
                                                    <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                        <Mail className='h-4 w-4 text-blue-500 mr-2' />
                                                        <span className='truncate max-w-xs'>
                                                            {opportunity.email ||
                                                                'Not provided'}
                                                        </span>
                                                    </div>
                                                    {opportunity.whatsapp && (
                                                        <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                            <Phone className='h-4 w-4 text-green-500 mr-2' />
                                                            {
                                                                opportunity.whatsapp
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span
                                                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        opportunity.submissionStatus,
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        opportunity.submissionStatus,
                                                    )}
                                                    <span className='capitalize'>
                                                        {
                                                            opportunity.submissionStatus
                                                        }
                                                    </span>
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                    <User className='h-4 w-4 text-gray-400 mr-2' />
                                                    {opportunity.owner
                                                        ?.username || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                    <Calendar className='h-4 w-4 mr-2' />
                                                    {new Date(
                                                        opportunity.createdAt,
                                                    ).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div className='flex items-center justify-end space-x-2'>
                                                    {opportunity.link && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(
                                                                    opportunity.link,
                                                                    '_blank',
                                                                );
                                                            }}
                                                            className='text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded'
                                                            title='Open External Link'
                                                        >
                                                            <ExternalLink className='h-4 w-4' />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleView(
                                                                opportunity,
                                                            );
                                                        }}
                                                        className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded'
                                                        title='View Details'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(
                                                                opportunity,
                                                            );
                                                        }}
                                                        className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                        title='Edit Opportunity'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(
                                                                opportunity,
                                                            );
                                                        }}
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                        title='Delete Opportunity'
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
                    )}
                </div>

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
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <OpportunityEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                opportunity={editingOpportunity}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default OpportunityList;
