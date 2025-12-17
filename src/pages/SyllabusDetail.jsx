import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Loader,
    BookOpenCheck,
    Code,
    Eye,
    Calendar,
    User,
    FileText,
    BookOpen,
    List,
    Edit2,
    Trash2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Building,
    GraduationCap,
    Clock,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import SyllabusEditModal from '../components/SyllabusEditModal';

const SyllabusDetail = () => {
    const { collegeslug, syllabusid } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSyllabusDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/syllabus/${syllabusid}`);
            setSyllabus(response.data.data);
            setError(null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Failed to fetch syllabus details'
            );
            toast.error('Failed to fetch syllabus details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSyllabusDetail();
    }, [syllabusid]);

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleSyllabusUpdate = (updatedSyllabus) => {
        setSyllabus(updatedSyllabus);
        setIsEditModalOpen(false);
        fetchSyllabusDetail(); // Refresh data to ensure consistency
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/syllabus/${syllabusid}`);
            toast.success('Syllabus deleted successfully');
            navigate(`/${collegeslug}/syllabus`);
        } catch (error) {
            console.error('Error deleting syllabus:', error);
            toast.error(
                error.response?.data?.message || 'Failed to delete syllabus'
            );
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <Loader className="w-12 h-12 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                            <p className="mt-4 text-gray-600 dark:text-gray-400">
                                Loading syllabus details...
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !syllabus) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg">
                        {error || 'Syllabus not found'}
                    </div>
                    <button
                        onClick={() => navigate(`/${collegeslug}/syllabus`)}
                        className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Syllabus List
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <Header />
            <Sidebar />
            <main
                className={`py-8 ${mainContentMargin} transition-all duration-300`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Navigation */}
                    <nav className="flex mb-8" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-4">
                            <li>
                                <div>
                                    <button
                                        onClick={() =>
                                            navigate(`/${collegeslug}/syllabus`)
                                        }
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <ArrowLeft
                                            className="flex-shrink-0 h-5 w-5"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">Back</span>
                                    </button>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* Header */}
                    <div className="md:flex md:items-center md:justify-between mb-8">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${
                                        syllabus.isActive
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}
                                >
                                    {syllabus.isActive
                                        ? 'Active'
                                        : 'Inactive'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {syllabus.viewCount || 0} views
                                </span>
                            </div>
                            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                                {syllabus.subject?.subjectCode || 'No Code'}:{' '}
                                {syllabus.subject?.subjectName || 'No Subject'}
                            </h2>
                        </div>
                        <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4 space-x-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setViewMode(
                                        viewMode === 'formatted'
                                            ? 'raw'
                                            : 'formatted'
                                    )
                                }
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                {viewMode === 'formatted' ? (
                                    <>
                                        <Code className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Raw Data
                                    </>
                                ) : (
                                    <>
                                        <Eye className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Formatted View
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <Edit2 className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                <Trash2 className="-ml-1 mr-2 h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info (Left Column) */}
                        <div className="lg:col-span-2 space-y-6">
                            {viewMode === 'formatted' ? (
                                <>
                                    {/* Description */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-indigo-500" />
                                                Description
                                            </h3>
                                        </div>
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="prose dark:prose-invert max-w-none text-gray-500 dark:text-gray-300">
                                                {syllabus.description ? (
                                                    <p className="whitespace-pre-wrap">
                                                        {syllabus.description}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic">
                                                        No description available
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Units */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <List className="w-5 h-5 text-indigo-500" />
                                                Syllabus Units
                                            </h3>
                                        </div>
                                        <div className="px-4 py-5 sm:p-6">
                                            {syllabus.units &&
                                            syllabus.units.length > 0 ? (
                                                <div className="space-y-6">
                                                    {syllabus.units.map(
                                                        (unit, index) => (
                                                            <div
                                                                key={index}
                                                                className="relative"
                                                            >
                                                                <div className="flex items-start">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700">
                                                                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                                                                                {unit.unitNumber ||
                                                                                    index +
                                                                                        1}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4 flex-1">
                                                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                                            {
                                                                                unit.title
                                                                            }
                                                                        </h4>
                                                                        <div className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                                                            {
                                                                                unit.content
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {index <
                                                                    syllabus
                                                                        .units
                                                                        .length -
                                                                        1 && (
                                                                    <div className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                                                    No units added to this
                                                    syllabus yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reference Books */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                                Reference Books
                                            </h3>
                                        </div>
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="text-gray-500 dark:text-gray-300">
                                                {syllabus.referenceBooks ? (
                                                    <p className="whitespace-pre-wrap">
                                                        {
                                                            syllabus.referenceBooks
                                                        }
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic">
                                                        No reference books
                                                        listed
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            <Code className="w-5 h-5 text-indigo-500" />
                                            Raw JSON Data
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                            {JSON.stringify(syllabus, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details (Right Column) */}
                        <div className="space-y-6">
                            {/* Academic Info */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookOpenCheck className="w-5 h-5 text-indigo-500" />
                                        Academic Details
                                    </h3>
                                </div>
                                <div className="px-4 py-5 sm:p-0">
                                    <dl>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                College
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <Building className="w-4 h-4 text-gray-400" />
                                                {syllabus.college?.name ||
                                                    'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Year
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                                {syllabus.year
                                                    ? `Year ${syllabus.year}`
                                                    : 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Semester
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {syllabus.semester
                                                    ? `Semester ${syllabus.semester}`
                                                    : 'N/A'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-indigo-500" />
                                        Metadata
                                    </h3>
                                </div>
                                <div className="px-4 py-5 sm:p-0">
                                    <dl>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Status
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        syllabus.isActive
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    }`}
                                                >
                                                    {syllabus.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Uploaded By
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {syllabus.uploadedBy
                                                    ?.username || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Created At
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(
                                                    syllabus.createdAt
                                                ).toLocaleDateString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditModalOpen && (
                    <SyllabusEditModal
                        syllabus={syllabus}
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onUpdate={handleSyllabusUpdate}
                    />
                )}

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Syllabus"
                    message="Are you sure you want to delete this syllabus? This action cannot be undone."
                    isDeleting={isDeleting}
                />
            </main>
        </div>
    );
};

export default SyllabusDetail;
