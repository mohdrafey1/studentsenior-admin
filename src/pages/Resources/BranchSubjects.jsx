import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    BookOpen,
    CheckCircle2,
    CircleDashed,
    FileUp,
    Layers,
    List,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatNumber } from '../../utils/format';
import { collegeInitials } from '../../utils/initials';
import BulkSubjectModal from '../../components/BulkSubjectModal';
import AddSubjectModal from '../../components/AddSubjectModal';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    Segmented,
    Select,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import {
    SEMESTERS,
    hasSyllabus,
    quickNotesPath,
    syllabusPath,
} from './catalogUtils';

const plural = (n, one, many) => `${formatNumber(n)} ${n === 1 ? one : many}`;

const BranchSubjects = () => {
    const { branchId } = useParams();

    const [branch, setBranch] = useState(null);
    const [colleges, setColleges] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [selectedCollege, setSelectedCollege] = useState('all');

    // Modal states
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Fetch initial data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [branchRes, subjectsRes, collegesRes] = await Promise.all([
                api.get(`/resource/branches`),
                api.get(`/resource/subjects/${branchId}`),
                api.get('/college'),
            ]);

            const branchData = branchRes.data.data.find(
                (b) => b._id === branchId,
            );
            setBranch(branchData);
            setSubjects(subjectsRes.data.data || []);
            setColleges(collegesRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(
                'Couldn’t load this branch. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const collegeName = subject.college?.name || 'No college';
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
        setDeleting(id);
        try {
            await api.delete(`/resource/subjects/${id}`);
            toast.success('Subject deleted');
            setSubjects((prev) => prev.filter((s) => s._id !== id));
        } catch (error) {
            console.error('Error deleting subject:', error);
            toast.error('Couldn’t delete the subject. Try again.');
        } finally {
            setDeleting(null);
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setShowAddModal(true);
    };

    if (loading) {
        return <Loader />;
    }

    if (error || !branch) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={BookOpen}
                        tone='error'
                        title={
                            error
                                ? 'Couldn’t load this branch'
                                : 'Branch not found'
                        }
                        description={
                            error ||
                            'It may have been deleted. Pick another branch from the list.'
                        }
                        action={
                            error ? (
                                <Button onClick={fetchData}>Try again</Button>
                            ) : (
                                <Button to='/reports/branches'>
                                    All branches
                                </Button>
                            )
                        }
                    />
                </div>
            </div>
        );
    }

    const collegeCount = new Set(subjects.map((s) => s.college?._id || 'none'))
        .size;
    const filtersActive = Boolean(
        searchQuery || selectedSemester !== 'all' || selectedCollege !== 'all',
    );
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedSemester('all');
        setSelectedCollege('all');
    };

    const syllabusCell = (subject) => {
        if (!hasSyllabus(subject)) {
            return (
                <span className='inline-flex items-center gap-1.5 text-[13px] text-warn-ink'>
                    <CircleDashed
                        className='w-3.5 h-3.5 shrink-0'
                        aria-hidden='true'
                    />
                    Missing
                </span>
            );
        }
        const path = syllabusPath(subject);
        const content = (
            <>
                <CheckCircle2
                    className='w-3.5 h-3.5 shrink-0'
                    aria-hidden='true'
                />
                Ready
            </>
        );
        return path ? (
            <Link
                to={path}
                className='inline-flex items-center gap-1.5 text-[13px] text-ok-ink hover:underline'
                aria-label={`Syllabus ready for ${subject.subjectName}, open it`}
            >
                {content}
            </Link>
        ) : (
            <span className='inline-flex items-center gap-1.5 text-[13px] text-ok-ink'>
                {content}
            </span>
        );
    };

    const rowActions = (subject) => (
        <div className='flex justify-end items-center gap-1'>
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Pencil}
                aria-label={`Edit ${subject.subjectName}`}
                onClick={() => handleEdit(subject)}
            />
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={deleting === subject._id ? Loader2 : Trash2}
                aria-label={`Delete ${subject.subjectName}`}
                disabled={deleting === subject._id}
                className={`text-bad-ink hover:text-bad-ink ${
                    deleting === subject._id ? '[&>svg]:animate-spin' : ''
                }`}
                onClick={() => setConfirmDelete(subject)}
            />
        </div>
    );

    const subjectTable = (list, showCollege) => (
        <Table
            minWidth={showCollege ? 900 : 720}
            className='[&_table]:table-fixed'
        >
            <colgroup>
                <col />
                <col className='w-[110px]' />
                <col className='w-[64px]' />
                {showCollege && <col className='w-[200px]' />}
                <col className='w-[120px]' />
                <col className='w-[150px]' />
                <col className='w-[100px]' />
            </colgroup>
            <thead>
                <tr>
                    <Th>Subject</Th>
                    <Th>Code</Th>
                    <Th>Sem</Th>
                    {showCollege && <Th>College</Th>}
                    <Th>Syllabus</Th>
                    <Th>Quick notes</Th>
                    <Th>
                        <span className='sr-only'>Actions</span>
                    </Th>
                </tr>
            </thead>
            <tbody>
                {list.map((subject) => (
                    <Tr key={subject._id}>
                        <Td className='font-medium truncate'>
                            {subject.subjectName}
                        </Td>
                        <Td mono className='text-ink-2 whitespace-nowrap'>
                            {subject.subjectCode}
                        </Td>
                        <Td mono>{subject.semester}</Td>
                        {showCollege && (
                            <Td className='text-ink-2 truncate'>
                                {subject.college?.name || '—'}
                            </Td>
                        )}
                        <Td>{syllabusCell(subject)}</Td>
                        <Td>
                            {hasSyllabus(subject) ? (
                                <Link
                                    to={quickNotesPath(subject)}
                                    className='text-[13px] text-link hover:underline'
                                    aria-label={`Quick notes for ${subject.subjectName}`}
                                >
                                    Open editor
                                </Link>
                            ) : (
                                <span className='text-[13px] text-muted'>
                                    Needs a syllabus
                                </span>
                            )}
                        </Td>
                        <Td align='right'>{rowActions(subject)}</Td>
                    </Tr>
                ))}
            </tbody>
        </Table>
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={[
                    'Branch',
                    branch.branchCode,
                    branch.course?.courseName,
                ]
                    .filter(Boolean)
                    .join(' · ')}
                title={branch.branchName || 'Branch'}
                description={`${plural(subjects.length, 'subject', 'subjects')}${
                    subjects.length
                        ? ` across ${plural(collegeCount, 'college', 'colleges')}`
                        : ''
                }`}
                actions={
                    <>
                        <Button
                            icon={FileUp}
                            onClick={() => setShowBulkModal(true)}
                        >
                            Add from a syllabus file
                        </Button>
                        <Button
                            variant='primary'
                            icon={Plus}
                            onClick={() => {
                                setEditingSubject(null);
                                setShowAddModal(true);
                            }}
                        >
                            Add subject
                        </Button>
                    </>
                }
            />

            {/* Filters */}
            <div className='flex flex-wrap items-center gap-2 mb-5'>
                <div className='max-w-full overflow-x-auto'>
                    <Segmented
                        label='Semester'
                        className='[&>button]:whitespace-nowrap'
                        value={selectedSemester}
                        onChange={setSelectedSemester}
                        options={[
                            { value: 'all', label: 'All' },
                            ...SEMESTERS.map((sem) => ({
                                value: String(sem),
                                label: `Sem ${sem}`,
                            })),
                        ]}
                    />
                </div>
                <span className='flex-1' />
                <Select
                    aria-label='College'
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className='!w-auto max-w-[240px]'
                    options={[
                        { value: 'all', label: 'All colleges' },
                        ...colleges.map((college) => ({
                            value: college._id,
                            label: college.name,
                        })),
                    ]}
                />
                <label className='flex items-center gap-2 flex-1 sm:flex-none sm:w-64 min-w-[200px] h-9 px-3 rounded-lg border border-line-strong bg-sheet text-muted focus-within:ring-2 focus-within:ring-brand/30'>
                    <Search
                        className='w-[15px] h-[15px] shrink-0'
                        aria-hidden='true'
                    />
                    <input
                        type='search'
                        placeholder='Search subjects'
                        aria-label='Search subjects'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='flex-1 min-w-0 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-muted'
                    />
                </label>
                <Segmented
                    label='Layout'
                    value={viewMode}
                    onChange={setViewMode}
                    options={[
                        {
                            value: 'grid',
                            icon: Layers,
                            ariaLabel: 'Group by college',
                        },
                        {
                            value: 'table',
                            icon: List,
                            ariaLabel: 'One list',
                        },
                    ]}
                />
            </div>

            {/* Subjects List */}
            {filteredSubjects.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={BookOpen}
                        title={
                            subjects.length === 0
                                ? 'No subjects in this branch yet'
                                : 'No subjects match'
                        }
                        description={
                            subjects.length === 0
                                ? 'Add them one at a time, or upload a scheme PDF and let AI list them.'
                                : 'Try another semester, college or search.'
                        }
                        action={
                            subjects.length === 0 ? (
                                <Button
                                    icon={FileUp}
                                    onClick={() => setShowBulkModal(true)}
                                >
                                    Add from a syllabus file
                                </Button>
                            ) : filtersActive ? (
                                <Button onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            ) : undefined
                        }
                    />
                </div>
            ) : viewMode === 'grid' ? (
                // Grouped by college
                <div className='flex flex-col gap-5'>
                    {Object.entries(groupedSubjects).map(
                        ([collegeId, group]) => (
                            <section
                                key={collegeId}
                                aria-labelledby={`college-${collegeId}`}
                                className='bg-sheet border border-line rounded-xl overflow-hidden'
                            >
                                <div className='flex items-center gap-2.5 px-5 py-3 border-b border-line-soft bg-sunken'>
                                    <span
                                        aria-hidden='true'
                                        className='w-[26px] h-[26px] rounded-[7px] bg-brand-soft text-brand-ink flex items-center justify-center text-[10.5px] font-semibold shrink-0'
                                    >
                                        {collegeInitials(group.name)}
                                    </span>
                                    <h2
                                        id={`college-${collegeId}`}
                                        className='flex-1 min-w-0 text-[14.5px] font-semibold text-ink truncate'
                                    >
                                        {group.name}
                                    </h2>
                                    <span className='text-[12.5px] text-muted whitespace-nowrap'>
                                        {plural(
                                            group.subjects.length,
                                            'subject',
                                            'subjects',
                                        )}
                                    </span>
                                </div>
                                {subjectTable(group.subjects, false)}
                            </section>
                        ),
                    )}
                </div>
            ) : (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    {subjectTable(filteredSubjects, true)}
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

            <ConfirmModal
                isOpen={Boolean(confirmDelete)}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDelete(confirmDelete._id)}
                title={`Delete ${confirmDelete?.subjectName || 'this subject'}?`}
                message='Students can no longer find it in this branch, and PYQs and notes linked to it lose their subject. This can’t be undone.'
                confirmText='Delete subject'
                variant='danger'
            />
        </div>
    );
};

export default BranchSubjects;
