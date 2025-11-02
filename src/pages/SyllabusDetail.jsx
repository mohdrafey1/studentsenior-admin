import { useState, useEffect } from 'react';
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
    Download,
    Calendar,
    User,
    FileText,
    BookOpen,
    List,
} from 'lucide-react';

const SyllabusDetail = () => {
    const { collegeslug, syllabusid } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'

    useEffect(() => {
        const fetchSyllabusDetail = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/syllabus/${syllabusid}`);
                setSyllabus(response.data.data);
                setError(null);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        'Failed to fetch syllabus details',
                );
                toast.error('Failed to fetch syllabus details');
            } finally {
                setLoading(false);
            }
        };

        fetchSyllabusDetail();
    }, [syllabusid]);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='flex items-center justify-center h-96'>
                        <div className='text-center'>
                            <Loader className='w-12 h-12 animate-spin mx-auto text-indigo-600 dark:text-indigo-400' />
                            <p className='mt-4 text-gray-600 dark:text-gray-400'>
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
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg'>
                        {error || 'Syllabus not found'}
                    </div>
                </main>
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
                    <div className='mb-8'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center'>
                                <button
                                    onClick={() =>
                                        navigate(`/${collegeslug}/syllabus`)
                                    }
                                    className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                                >
                                    <ArrowLeft className='w-5 h-5' />
                                </button>
                                <div className='flex items-center'>
                                    <div className='bg-blue-600 text-white p-3 rounded-lg mr-4'>
                                        <BookOpenCheck className='w-6 h-6' />
                                    </div>
                                    <div>
                                        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                            {syllabus.subject?.subjectCode ||
                                                'N/A'}
                                        </h1>
                                        <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                            {syllabus.subject?.subjectName ||
                                                'Subject name not available'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => setViewMode('formatted')}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                                        viewMode === 'formatted'
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Eye className='w-4 h-4' />
                                    Formatted
                                </button>
                                <button
                                    onClick={() => setViewMode('raw')}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                                        viewMode === 'raw'
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Code className='w-4 h-4' />
                                    Raw Data
                                </button>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className='flex items-center gap-4'>
                            <span
                                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                    syllabus.isActive
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {syllabus.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
                                <div className='flex items-center gap-1'>
                                    <Eye className='w-4 h-4' />
                                    <span>{syllabus.viewCount || 0} views</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {viewMode === 'formatted' ? (
                        <div className='space-y-6'>
                            {/* Basic Information */}
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                                    <FileText className='w-5 h-5' />
                                    Basic Information
                                </h2>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            College
                                        </label>
                                        <p className='mt-1 text-base text-gray-900 dark:text-white'>
                                            {syllabus.college?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Subject Code
                                        </label>
                                        <p className='mt-1 text-base text-gray-900 dark:text-white'>
                                            {syllabus.subject?.subjectCode ||
                                                'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Year
                                        </label>
                                        <p className='mt-1 text-base text-gray-900 dark:text-white'>
                                            Year {syllabus.year}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Semester
                                        </label>
                                        <p className='mt-1 text-base text-gray-900 dark:text-white'>
                                            Semester {syllabus.semester}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Uploaded By
                                        </label>
                                        <p className='mt-1 text-base text-gray-900 dark:text-white flex items-center gap-1'>
                                            <User className='w-4 h-4' />
                                            {syllabus.uploadedBy?.username ||
                                                'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Created At
                                        </label>
                                        <p className='mt-1 text-base text-gray-900 dark:text-white flex items-center gap-1'>
                                            <Calendar className='w-4 h-4' />
                                            {new Date(
                                                syllabus.createdAt,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {syllabus.description && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                    <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                                        <FileText className='w-5 h-5' />
                                        Description
                                    </h2>
                                    <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                                        {syllabus.description}
                                    </p>
                                </div>
                            )}

                            {/* Units */}
                            {syllabus.units && syllabus.units.length > 0 && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                    <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                                        <List className='w-5 h-5' />
                                        Course Units
                                    </h2>
                                    <div className='space-y-4'>
                                        {syllabus.units.map((unit, index) => (
                                            <div
                                                key={index}
                                                className='p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600'
                                            >
                                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                                                    Unit {unit.unitNumber}:{' '}
                                                    {unit.title}
                                                </h3>
                                                <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                                                    {unit.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reference Books */}
                            {syllabus.referenceBooks && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                    <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                                        <BookOpen className='w-5 h-5' />
                                        Reference Books
                                    </h2>
                                    <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                                        {syllabus.referenceBooks}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                                <Code className='w-5 h-5' />
                                Raw JSON Data
                            </h2>
                            <pre className='bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm'>
                                {JSON.stringify(syllabus, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SyllabusDetail;
