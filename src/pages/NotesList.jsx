import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    FileText,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Calendar,
    BookOpen,
    Building,
    User,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import NotesEditModal from '../components/NotesEditModal';
import { getStatusBadge } from '../utils/getStatusColor';

const NotesList = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const { collegeslug } = useParams();
    const navigate = useNavigate();

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

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/notes/all/${collegeslug}`);
            setNotes(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch notes');
            toast.error('Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleEdit = (note) => {
        setEditingNote(note);
        setShowModal(true);
    };

    const handleDelete = async (note) => {
        const confirmed = await showConfirm({
            title: 'Delete Note',
            message: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/notes/delete/${note._id}`);
                setNotes(notes.filter((n) => n._id !== note._id));
                toast.success('Note deleted successfully');
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete note',
                );
            }
        }
        closeConfirm();
    };

    const handleView = (note) => {
        navigate(`/${collegeslug}/notes/${note._id}`);
    };

    const filtered = notes.filter((note) => {
        const searchLower = search.toLowerCase();
        return (
            note.title?.toLowerCase().includes(searchLower) ||
            note.description?.toLowerCase().includes(searchLower) ||
            note.subject?.subjectName?.toLowerCase().includes(searchLower) ||
            note.owner?.username?.toLowerCase().includes(searchLower)
        );
    });

    const start = (page - 1) * pageSize;
    const current = filtered.slice(start, start + pageSize);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                    <div className='flex items-center justify-center h-96'>
                        <div className='text-center'>
                            <Loader className='w-12 h-12 animate-spin mx-auto text-indigo-600 dark:text-indigo-400' />
                            <p className='mt-4 text-gray-600 dark:text-gray-400'>
                                Loading notes...
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                <div className='px-4 py-6 sm:px-0'>
                    <div className='flex items-center justify-between mb-6'>
                        <div className='flex items-center space-x-4'>
                            <button
                                onClick={() => navigate(`/${collegeslug}`)}
                                className='inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            >
                                <ArrowLeft className='w-4 h-4 mr-2' />
                                Back to College
                            </button>
                            <div className='flex items-center'>
                                <FileText className='w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3' />
                                <div>
                                    <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                                        Notes Management
                                    </h1>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                        Manage all notes for this college
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className='mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4'>
                            <div className='flex'>
                                <div className='ml-3'>
                                    <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                                        Error loading notes
                                    </h3>
                                    <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                                        {error}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md'>
                        <div className='px-4 py-5 sm:p-6 border-b border-gray-200 dark:border-gray-700'>
                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4'>
                                <div className='flex-1 min-w-0'>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                            <Search className='h-5 w-5 text-gray-400' />
                                        </div>
                                        <input
                                            type='text'
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                                            placeholder='Search notes by title, description, subject, or owner...'
                                        />
                                    </div>
                                </div>
                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                    {filtered.length} of {notes.length} notes
                                </div>
                            </div>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                <thead className='bg-gray-50 dark:bg-gray-900'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Note Details
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Status
                                        </th>

                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Created
                                        </th>
                                        <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                    {current.map((note) => (
                                        <tr
                                            key={note._id}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                            onClick={() => handleView(note)}
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <div className='flex-shrink-0 h-10 w-10'>
                                                        <div className='h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center'>
                                                            <BookOpen className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                                                        </div>
                                                    </div>
                                                    <div className='ml-4'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {note.title ||
                                                                'N/A'}
                                                        </div>
                                                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                            {note.description ||
                                                                'No description'}
                                                        </div>
                                                        <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                            <Building className='w-3 h-3 mr-1' />
                                                            {note.subject
                                                                ?.subjectName ||
                                                                'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                        note.submissionStatus,
                                                    )}`}
                                                >
                                                    {note.submissionStatus
                                                        ? 'Approved'
                                                        : 'Pending'}
                                                </span>
                                            </td>

                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {note.createdAt
                                                        ? new Date(
                                                              note.createdAt,
                                                          ).toLocaleString()
                                                        : 'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                    By-
                                                    {note.owner?.username ||
                                                        'N/A'}
                                                </div>
                                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {note.price > 0
                                                        ? `₹${note.price / 5} `
                                                        : 'Free'}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div className='flex items-center justify-end space-x-2'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(note);
                                                        }}
                                                        className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                        title='Edit Note'
                                                    >
                                                        <Edit2 className='w-4 h-4' />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(note);
                                                        }}
                                                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                                        title='Delete Note'
                                                    >
                                                        <Trash2 className='w-4 h-4' />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className='px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                            <Pagination
                                currentPage={page}
                                totalPages={Math.ceil(
                                    filtered.length / pageSize,
                                )}
                                onPageChange={setPage}
                                pageSize={pageSize}
                                onPageSizeChange={setPageSize}
                                totalItems={filtered.length}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <NotesEditModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingNote(null);
                }}
                note={editingNote}
                onSuccess={(updatedNote) => {
                    setNotes(
                        notes.map((n) =>
                            n._id === updatedNote._id ? updatedNote : n,
                        ),
                    );
                    setShowModal(false);
                    setEditingNote(null);
                }}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default NotesList;
