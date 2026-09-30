import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BookOpen, Sparkles, Trash2 } from 'lucide-react';
import { useColleges } from '../../context/CollegeContext';
import { formatNumber, formatShortDate } from '../../utils/format';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';

const editorPath = (note) =>
    `/reports/subjects/${note.subject._id}/quick-notes?unit=${note.unitNumber}`;

const QuickNotesList = () => {
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    // What the API is asked for; follows the search box after a short pause.
    const [query, setQuery] = useState('');
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

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/quicknotes/all/${collegeslug}`, {
                params: {
                    page,
                    limit: pageSize,
                    search: query.trim() || undefined,
                },
            });

            if (response.data.success) {
                setNotes(response.data.data);
                setTotalItems(response.data.pagination.total);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    'Couldn’t load quick notes. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }, [collegeslug, page, pageSize, query]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const handleDelete = async (note) => {
        const confirmed = await new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: `Delete the notes for unit ${note.unitNumber}?`,
                message: `${note.subject?.subjectName || 'This subject'} loses its summary for “${note.title}”. Students stop seeing it straight away. This can’t be undone.`,
                variant: 'danger',
                onConfirm: () => resolve(true),
            });
        });

        if (confirmed) {
            try {
                const res = await api.delete(`/quicknotes/delete/${note._id}`);
                if (res.data.success) {
                    toast.success('Note deleted');
                    fetchNotes(); // Refresh list
                }
            } catch (err) {
                toast.error(
                    err.response?.data?.message ||
                        'Couldn’t delete the note. Try again.',
                );
            }
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    if (!loaded) return <Loader />;

    const collegeName = currentCollege?.name || collegeslug;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Quick notes'
                description={`AI unit summaries for ${collegeName} subjects that have a syllabus.`}
                meta={
                    totalItems > 0 && !query ? (
                        <span className='text-[13px] text-muted'>
                            {formatNumber(totalItems)} unit note
                            {totalItems === 1 ? '' : 's'} so far
                        </span>
                    ) : undefined
                }
                actions={
                    <Button
                        icon={BookOpen}
                        to={`/reports/subjects?syllabus=ready${
                            currentCollege?._id
                                ? `&college=${currentCollege._id}`
                                : ''
                        }`}
                    >
                        Subjects with a syllabus
                    </Button>
                }
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by subject name or code'
                onClear={() => {
                    setSearch('');
                    setPage(1);
                }}
                showClear={Boolean(search)}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchNotes}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            <div
                className={`bg-sheet border border-line rounded-xl overflow-hidden transition-opacity ${
                    loading ? 'opacity-60' : ''
                }`}
                aria-busy={loading}
            >
                {notes.length === 0 ? (
                    <EmptyState
                        icon={Sparkles}
                        title={query ? 'No notes match' : 'No quick notes yet'}
                        description={
                            query
                                ? 'Try another subject name or code.'
                                : 'Notes you generate for a subject’s syllabus units appear here.'
                        }
                        action={
                            query ? (
                                <Button
                                    onClick={() => {
                                        setSearch('');
                                        setPage(1);
                                    }}
                                >
                                    Clear search
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <Table minWidth={760}>
                        <thead>
                            <tr>
                                <Th>Subject</Th>
                                <Th>Unit</Th>
                                <Th align='right'>Views</Th>
                                <Th>Last updated</Th>
                                <Th>
                                    <span className='sr-only'>Actions</span>
                                </Th>
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map((note) => (
                                <Tr key={note._id}>
                                    <Td className='max-w-[320px]'>
                                        <div className='flex items-center gap-3 min-w-0'>
                                            <code className='w-[68px] shrink-0 font-mono text-[12px] text-ink-2 truncate'>
                                                {note.subject?.subjectCode ||
                                                    '—'}
                                            </code>
                                            {note.subject?._id ? (
                                                <Link
                                                    to={editorPath(note)}
                                                    className='font-medium text-ink hover:underline truncate'
                                                >
                                                    {note.subject.subjectName ||
                                                        'Untitled subject'}
                                                </Link>
                                            ) : (
                                                <span className='text-muted'>
                                                    Subject deleted
                                                </span>
                                            )}
                                        </div>
                                    </Td>
                                    <Td className='max-w-[300px]'>
                                        <div className='flex flex-col gap-0.5 min-w-0'>
                                            <span>Unit {note.unitNumber}</span>
                                            <span className='text-[12.5px] text-muted truncate'>
                                                {note.title}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td
                                        align='right'
                                        mono
                                        className='text-ink-2'
                                    >
                                        {formatNumber(note.clickCounts)}
                                    </Td>
                                    <Td className='text-ink-2 whitespace-nowrap'>
                                        {formatShortDate(note.lastUpdated)}
                                    </Td>
                                    <Td align='right'>
                                        <div className='flex justify-end items-center gap-1'>
                                            {note.subject?._id && (
                                                <Button
                                                    size='sm'
                                                    to={editorPath(note)}
                                                    aria-label={`Open the editor for ${note.subject.subjectName}, unit ${note.unitNumber}`}
                                                >
                                                    Open editor
                                                </Button>
                                            )}
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                iconOnly
                                                icon={Trash2}
                                                aria-label={`Delete the notes for ${note.subject?.subjectName || 'this subject'}, unit ${note.unitNumber}`}
                                                className='text-bad-ink hover:text-bad-ink'
                                                onClick={() =>
                                                    handleDelete(note)
                                                }
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </Table>
                )}
                {totalItems > 0 && (
                    <div className='px-4 py-3 border-t border-line-soft'>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            pageSize={pageSize}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            totalItems={totalItems}
                        />
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() =>
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText='Delete note'
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default QuickNotesList;
