import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FileText, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';

const PyqSolutionList = () => {
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const fetchSolutions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/pyq-solution/all/${collegeslug}`, {
                params: {
                    page,
                    limit: pageSize,
                    search: search.trim() || undefined,
                },
            });

            if (response.data.success) {
                setSolutions(response.data.data);
                setTotalItems(response.data.pagination.total);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (err) {
            console.error(err);
            toast.error(
                err.response?.data?.message || 'Failed to fetch solutions',
            );
        } finally {
            setLoading(false);
        }
    }, [collegeslug, page, pageSize, search]);

    useEffect(() => {
        fetchSolutions();
    }, [fetchSolutions]);

    const handleEdit = (solution) => {
        // Redirection to the existing solution page
        // Route: /:collegeslug/pyqs/:pyqId/aisolution
        if (solution.pyq?._id) {
            navigate(`/${collegeslug}/pyqs/${solution.pyq._id}/aisolution`);
        } else {
            toast.error('Invalid solution reference');
        }
    };

    const handleDelete = async (solution) => {
        const confirmed = await new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Solution',
                message: `Are you sure you want to delete the solution for "${solution.pyq?.slug || 'Unknown'}"? This will also unmark the PYQ as solved.`,
                variant: 'danger',
                onConfirm: () => resolve(true),
            });
        });

        if (confirmed) {
            try {
                const res = await api.delete(
                    `/pyq-solution/delete/${solution._id}`,
                );
                if (res.data.success) {
                    toast.success('Solution deleted successfully');
                    fetchSolutions(); // Refresh list
                }
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete solution',
                );
            }
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on search
        fetchSolutions();
    };

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <BackButton
                        title={`PYQ Solutions for ${collegeslug}`}
                        TitleIcon={FileText}
                    />

                    {/* Filters & Actions */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-4'>
                        <form
                            onSubmit={handleSearch}
                            className='flex gap-2 max-w-md'
                        >
                            <div className='relative flex-1'>
                                <input
                                    type='text'
                                    placeholder='Search by slug, year, or exam type...'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500'
                                />
                                <Search className='w-4 h-4 text-gray-400 absolute left-3 top-3' />
                            </div>
                            <button
                                type='submit'
                                className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors'
                            >
                                Search
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setSearch('');
                                    setPage(1);
                                    fetchSolutions();
                                }}
                                className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                title='Reset'
                            >
                                <RefreshCw className='w-5 h-5' />
                            </button>
                        </form>
                    </div>

                    {loading && !solutions.length ? (
                        <Loader />
                    ) : (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                    <thead className='bg-gray-50 dark:bg-gray-900'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Subject / Slug
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Info
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Last Updated
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                        {solutions.map((item) => (
                                            <tr
                                                key={item._id}
                                                className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                            >
                                                <td className='px-6 py-4'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                        {item.pyq?.subject
                                                            ?.subjectName ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                        {item.pyq?.slug ||
                                                            'No Slug'}
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4'>
                                                    <div className='text-sm text-gray-900 dark:text-white'>
                                                        {item.pyq?.year}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                        {item.pyq?.examType}
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-500 dark:text-gray-400'>
                                                    {new Date(
                                                        item.lastUpdated,
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                    <div className='flex items-center justify-end space-x-2'>
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(item)
                                                            }
                                                            className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                            title='Edit'
                                                        >
                                                            <Edit2 className='w-4 h-4' />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item,
                                                                )
                                                            }
                                                            className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                                            title='Delete'
                                                        >
                                                            <Trash2 className='w-4 h-4' />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {solutions.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className='px-6 py-10 text-center text-gray-500 dark:text-gray-400'
                                                >
                                                    No solutions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className='px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                    pageSize={pageSize}
                                    onPageSizeChange={setPageSize}
                                    totalItems={totalItems}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() =>
                    setConfirmModal({ ...confirmModal, isOpen: false })
                }
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default PyqSolutionList;
