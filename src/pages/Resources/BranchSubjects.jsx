import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    ChevronLeft,
    Loader2,
    Sparkles,
    LayoutGrid,
    Table,
    Search,
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import BulkSubjectModal from '../../components/BulkSubjectModal';
import AddSubjectModal from '../../components/AddSubjectModal';

const BranchSubjects = () => {
    const { branchId } = useParams();
    const navigate = useNavigate();

    const [branch, setBranch] = useState(null);
    const [colleges, setColleges] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [selectedCollege, setSelectedCollege] = useState('all');

    // Modal states
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [deleting, setDeleting] = useState(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [branchRes, subjectsRes, collegesRes] = await Promise.all(
                    [
                        api.get(`/resource/branches`),
                        api.get(`/resource/subjects/${branchId}`),
                        api.get('/college'),
                    ],
                );

                const branchData = branchRes.data.data.find(
                    (b) => b._id === branchId,
                );
                setBranch(branchData);
                setSubjects(subjectsRes.data.data || []);
                setColleges(collegesRes.data.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [branchId]);

    // Filter subjects
    const filteredSubjects = useMemo(() => {
        let filtered = subjects;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.subjectName?.toLowerCase().includes(query) ||
                    s.subjectCode?.toLowerCase().includes(query),
            );
        }

        if (selectedSemester !== 'all') {
            filtered = filtered.filter(
                (s) => s.semester === parseInt(selectedSemester),
            );
        }

        if (selectedCollege !== 'all') {
            filtered = filtered.filter(
                (s) => s.college?._id === selectedCollege,
            );
        }

        return filtered;
    }, [subjects, searchQuery, selectedSemester, selectedCollege]);

    // Group subjects by college
    const groupedSubjects = useMemo(() => {
        const groups = {};
        filteredSubjects.forEach((subject) => {
            const collegeId = subject.college?._id || 'no-college';
            const collegeName = subject.college?.name || 'No College';
            if (!groups[collegeId]) {
                groups[collegeId] = {
                    name: collegeName,
                    slug: subject.college?.slug || '',
                    subjects: [],
                };
            }
            groups[collegeId].subjects.push(subject);
        });
        return groups;
    }, [filteredSubjects]);

    const handleRefresh = async () => {
        try {
            const response = await api.get(`/resource/subjects/${branchId}`);
            setSubjects(response.data.data || []);
        } catch (error) {
            console.error('Error refreshing subjects:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) {
            return;
        }

        setDeleting(id);
        try {
            await api.delete(`/resource/subjects/${id}`);
            toast.success('Subject deleted successfully');
            setSubjects(subjects.filter((s) => s._id !== id));
        } catch (error) {
            console.error('Error deleting subject:', error);
            toast.error('Failed to delete subject');
        } finally {
            setDeleting(null);
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setShowAddModal(true);
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
            </div>
        );
    }

    return (
        <div className='p-4 md:p-6'>
            {/* Header */}
            <div className='flex items-center gap-4 mb-6'>
                <button
                    onClick={() => navigate('/reports/branches')}
                    className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                >
                    <ChevronLeft className='w-5 h-5 text-gray-600 dark:text-gray-400' />
                </button>
                <div>
                    <h1 className='text-xl md:text-2xl font-semibold text-gray-900 dark:text-white'>
                        {branch?.branchName || 'Branch'} - Subjects
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {branch?.branchCode} • {subjects.length} subjects
                    </p>
                </div>
            </div>

            {/* Actions Bar */}
            <div className='flex flex-wrap items-center gap-3 mb-6'>
                <button
                    onClick={() => setShowAddModal(true)}
                    className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                >
                    <Plus className='w-4 h-4' />
                    Add Subject
                </button>
                <button
                    onClick={() => setShowBulkModal(true)}
                    className='inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm'
                >
                    <Sparkles className='w-4 h-4' />
                    Bulk Add with AI
                </button>

                <div className='flex-1'></div>

                {/* Filters */}
                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                        type='text'
                        placeholder='Search subjects...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-48'
                    />
                </div>

                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className='px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                >
                    <option value='all'>All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                            Semester {sem}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className='px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                >
                    <option value='all'>All Colleges</option>
                    {colleges.map((college) => (
                        <option key={college._id} value={college._id}>
                            {college.name}
                        </option>
                    ))}
                </select>

                {/* View Toggle */}
                <div className='flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden'>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                        <LayoutGrid className='w-4 h-4' />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 ${viewMode === 'table' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                        <Table className='w-4 h-4' />
                    </button>
                </div>
            </div>

            {/* Subjects List */}
            {filteredSubjects.length === 0 ? (
                <div className='text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                    <p className='text-gray-500 dark:text-gray-400'>
                        No subjects found.{' '}
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className='text-purple-600 hover:underline'
                        >
                            Bulk add with AI
                        </button>
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                // Grid View - Grouped by College
                Object.entries(groupedSubjects).map(([collegeId, group]) => (
                    <div key={collegeId} className='mb-8'>
                        <h2 className='text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
                            {group.name}
                            <span className='text-xs text-gray-500 dark:text-gray-400 font-normal'>
                                ({group.subjects.length} subjects)
                            </span>
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                            {group.subjects.map((subject) => (
                                <div
                                    key={subject._id}
                                    className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow'
                                >
                                    <div className='flex justify-between items-start mb-2'>
                                        <div>
                                            <h3 className='font-medium text-gray-900 dark:text-white text-sm'>
                                                {subject.subjectName}
                                            </h3>
                                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                {subject.subjectCode} • Sem{' '}
                                                {subject.semester}
                                            </p>
                                        </div>
                                        <span className='px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded'>
                                            Sem {subject.semester}
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700'>
                                        <button
                                            onClick={() => handleEdit(subject)}
                                            className='text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1'
                                        >
                                            <Edit className='w-3 h-3' />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(subject._id)
                                            }
                                            disabled={deleting === subject._id}
                                            className='text-xs text-red-600 hover:text-red-700 flex items-center gap-1 ml-auto'
                                        >
                                            {deleting === subject._id ? (
                                                <Loader2 className='w-3 h-3 animate-spin' />
                                            ) : (
                                                <Trash2 className='w-3 h-3' />
                                            )}
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                // Table View
                <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                            <thead className='bg-gray-50 dark:bg-gray-900'>
                                <tr>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                        Subject Name
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                        Code
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                        Semester
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                        College
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                                {filteredSubjects.map((subject) => (
                                    <tr
                                        key={subject._id}
                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                    >
                                        <td className='px-4 py-3 text-sm text-gray-900 dark:text-white'>
                                            {subject.subjectName}
                                        </td>
                                        <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
                                            {subject.subjectCode}
                                        </td>
                                        <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
                                            {subject.semester}
                                        </td>
                                        <td className='px-4 py-3 text-xs text-gray-500 dark:text-gray-400'>
                                            {subject.college?.name || '-'}
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(subject)
                                                    }
                                                    className='text-blue-600 hover:text-blue-700'
                                                >
                                                    <Edit className='w-4 h-4' />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            subject._id,
                                                        )
                                                    }
                                                    disabled={
                                                        deleting === subject._id
                                                    }
                                                    className='text-red-600 hover:text-red-700'
                                                >
                                                    {deleting ===
                                                    subject._id ? (
                                                        <Loader2 className='w-4 h-4 animate-spin' />
                                                    ) : (
                                                        <Trash2 className='w-4 h-4' />
                                                    )}
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

            {/* Bulk Subject Modal */}
            <BulkSubjectModal
                showModal={showBulkModal}
                branch={branch}
                college={
                    selectedCollege !== 'all'
                        ? selectedCollege
                        : colleges[0]?._id
                }
                colleges={colleges}
                onClose={() => setShowBulkModal(false)}
                onSuccess={handleRefresh}
            />

            {/* Add/Edit Subject Modal */}
            {showAddModal && (
                <AddSubjectModal
                    showModal={showAddModal}
                    editingSubject={editingSubject}
                    branch={branch}
                    colleges={colleges}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingSubject(null);
                    }}
                    onSuccess={handleRefresh}
                />
            )}
        </div>
    );
};

export default BranchSubjects;
