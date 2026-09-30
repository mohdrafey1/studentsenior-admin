import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpenCheck, Pencil, Sparkles, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
import ConfirmModal from '../../components/ConfirmModal';
import SyllabusEditModal from '../../components/SyllabusEditModal';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    StatusBadge,
    Switch,
} from '../../components/ui';

const SyllabusDetail = () => {
    const { collegeslug, syllabusid } = useParams();
    const navigate = useNavigate();
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const [savingVisibility, setSavingVisibility] = useState(false);
    // Unit numbers that have AI quick notes; null until known.
    const [notedUnits, setNotedUnits] = useState(null);

    const fetchSyllabusDetail = async () => {
        try {
            setError(null);
            const response = await api.get(`/syllabus/${syllabusid}`);
            setSyllabus(response.data.data);
        } catch (err) {
            setError(
                err.response?.status === 404
                    ? 'This syllabus doesn’t exist or was deleted.'
                    : err.response?.data?.message ||
                          'Couldn’t load this syllabus. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSyllabusDetail();
    }, [syllabusid]); // eslint-disable-line react-hooks/exhaustive-deps

    const subjectId = syllabus?.subject?._id;
    useEffect(() => {
        if (!subjectId) return undefined;
        let cancelled = false;
        api.get(`/quicknotes/${subjectId}`)
            .then((response) => {
                if (cancelled) return;
                setNotedUnits(
                    new Set(
                        (response.data.data || []).map((n) =>
                            Number(n.unitNumber),
                        ),
                    ),
                );
            })
            // The quick-notes summary is extra; the page works without it.
            .catch(() => !cancelled && setNotedUnits(null));
        return () => {
            cancelled = true;
        };
    }, [subjectId]);

    const handleDelete = async () => {
        try {
            await api.delete(`/syllabus/delete/${syllabusid}`);
            toast.success('Syllabus deleted');
            navigate(`/${collegeslug}/syllabus`);
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Couldn’t delete the syllabus',
            );
        }
    };

    // Same payload as the edit dialog, with only the visibility changed.
    const setVisibility = async (isActive) => {
        setSavingVisibility(true);
        try {
            await api.put(`/syllabus/edit/${syllabus._id}`, {
                year: syllabus.year,
                semester: syllabus.semester,
                units: syllabus.units || [],
                referenceBooks: syllabus.referenceBooks,
                description: syllabus.description,
                isActive,
            });
            setSyllabus((prev) => ({ ...prev, isActive }));
            toast.success(
                isActive
                    ? 'Syllabus shown to students'
                    : 'Syllabus hidden from students',
            );
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                    'Couldn’t change who can see the syllabus. Try again.',
            );
        } finally {
            setSavingVisibility(false);
        }
    };

    if (loading) return <Loader />;

    if (error || !syllabus) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={BookOpenCheck}
                        tone='error'
                        title='Syllabus not found'
                        description={error}
                        action={
                            <Button to={`/${collegeslug}/syllabus`}>
                                Back to syllabus
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    const subject = syllabus.subject || {};
    const branch = subject.branch || {};
    const course = branch.course || {};
    const units = [...(syllabus.units || [])].sort(
        (a, b) => (a.unitNumber || 0) - (b.unitNumber || 0),
    );
    const books = (syllabus.referenceBooks || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    const quickNotesUrl = subject._id
        ? `/reports/subjects/${subject._id}/quick-notes`
        : null;
    const notedCount = notedUnits
        ? units.filter((u) => notedUnits.has(Number(u.unitNumber))).length
        : 0;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={['Syllabus', subject.subjectCode]
                    .filter(Boolean)
                    .join(' · ')}
                badge={
                    <StatusBadge
                        status={syllabus.isActive ? 'active' : 'inactive'}
                    />
                }
                title={subject.subjectName || 'Untitled subject'}
                meta={
                    <p className='text-[13px] text-ink-2'>
                        {[
                            course.courseName,
                            branch.branchCode || branch.branchName,
                            syllabus.year && `Year ${syllabus.year}`,
                            syllabus.semester &&
                                `Semester ${syllabus.semester}`,
                            `${formatNumber(syllabus.viewCount)} views`,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                }
                actions={
                    <>
                        <Button icon={Pencil} onClick={() => setEditing(true)}>
                            Edit
                        </Button>
                        <Button
                            variant='danger'
                            iconOnly
                            icon={Trash2}
                            aria-label='Delete syllabus'
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    <Panel
                        title='About this subject'
                        titleId='about-title'
                        bodyClassName='px-5 py-4'
                    >
                        {syllabus.description ? (
                            <p className='text-[14px] leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                {syllabus.description}
                            </p>
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                No description yet.
                            </p>
                        )}
                    </Panel>

                    <Panel
                        title='Units'
                        titleId='units-title'
                        action={
                            <span className='text-[13px] text-muted'>
                                {units.length === 1
                                    ? '1 unit'
                                    : `${formatNumber(units.length)} units`}
                            </span>
                        }
                    >
                        {units.length === 0 ? (
                            <EmptyState
                                icon={BookOpenCheck}
                                title='No units yet'
                                description='Units you add appear here and on the subject page.'
                                action={
                                    <Button
                                        icon={Pencil}
                                        onClick={() => setEditing(true)}
                                    >
                                        Add units
                                    </Button>
                                }
                            />
                        ) : (
                            <ol className='flex flex-col'>
                                {units.map((unit, index) => {
                                    const noted = notedUnits?.has(
                                        Number(unit.unitNumber),
                                    );
                                    return (
                                        <li
                                            key={unit._id || index}
                                            className='flex gap-4 px-5 py-4 border-b border-line-soft last:border-b-0'
                                        >
                                            <span className='shrink-0 w-8 h-8 rounded-full bg-ground flex items-center justify-center font-mono text-[13px] font-medium text-ink'>
                                                {unit.unitNumber || index + 1}
                                            </span>
                                            <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
                                                <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                                                    <h3 className='flex-1 min-w-[180px] text-[15px] font-semibold text-ink'>
                                                        {unit.title ||
                                                            `Unit ${unit.unitNumber || index + 1}`}
                                                    </h3>
                                                    {notedUnits &&
                                                        quickNotesUrl && (
                                                            <Link
                                                                to={`${quickNotesUrl}?unit=${unit.unitNumber}`}
                                                                className={`text-[12.5px] font-medium hover:underline ${
                                                                    noted
                                                                        ? 'text-ok-ink'
                                                                        : 'text-link'
                                                                }`}
                                                            >
                                                                {noted
                                                                    ? 'Quick notes ready'
                                                                    : 'Generate quick notes'}
                                                            </Link>
                                                        )}
                                                </div>
                                                <p className='text-[13.5px] leading-relaxed text-ink-2 whitespace-pre-wrap break-words'>
                                                    {unit.content}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </Panel>

                    <Panel
                        title='Reference books'
                        titleId='books-title'
                        bodyClassName='px-5 py-4'
                    >
                        {books.length ? (
                            <ol className='flex flex-col gap-2 pl-5 list-decimal text-[13.5px] leading-relaxed text-ink-2 marker:text-muted'>
                                {books.map((book, i) => (
                                    <li key={i} className='break-words'>
                                        {book}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                No reference books listed.
                            </p>
                        )}
                    </Panel>
                </div>

                <div className='flex flex-col gap-4'>
                    {notedUnits && quickNotesUrl && units.length > 0 && (
                        <Panel
                            title='Quick notes'
                            titleId='qn-title'
                            bodyClassName='px-5 py-4 flex flex-col gap-3'
                        >
                            <div
                                className='flex gap-1'
                                role='img'
                                aria-label={`${notedCount} of ${units.length} units have quick notes`}
                            >
                                {units.map((unit, index) => (
                                    <span
                                        key={unit._id || index}
                                        className={`flex-1 h-1.5 rounded-full ${
                                            notedUnits.has(
                                                Number(unit.unitNumber),
                                            )
                                                ? 'bg-brand'
                                                : 'bg-line-strong'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className='text-[13px] text-ink-2'>
                                {notedCount === units.length
                                    ? 'Every unit has AI quick notes.'
                                    : notedCount === 0
                                      ? 'No unit has AI quick notes yet.'
                                      : `${notedCount} of ${units.length} units have AI quick notes.`}
                            </p>
                            <Button
                                icon={Sparkles}
                                to={quickNotesUrl}
                                className='self-start'
                            >
                                Open quick notes
                            </Button>
                        </Panel>
                    )}

                    <Panel
                        title='Academic details'
                        titleId='acad-title'
                        bodyClassName='px-5 py-4'
                    >
                        <MetaList
                            items={[
                                {
                                    label: 'College',
                                    value: syllabus.college?.name,
                                },
                                { label: 'Course', value: course.courseName },
                                { label: 'Branch', value: branch.branchName },
                                {
                                    label: 'Subject',
                                    value: subject.subjectCode && (
                                        <span className='font-mono text-[13px]'>
                                            {subject.subjectCode}
                                        </span>
                                    ),
                                },
                                { label: 'Year', value: syllabus.year },
                                { label: 'Semester', value: syllabus.semester },
                            ]}
                        />
                    </Panel>

                    <Panel
                        title='Visibility'
                        titleId='visibility-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-4'
                    >
                        <Switch
                            checked={Boolean(syllabus.isActive)}
                            onChange={setVisibility}
                            disabled={savingVisibility}
                            label='Show to students'
                            description='Turn off to hide this syllabus without deleting it.'
                        />
                        <MetaList
                            items={[
                                {
                                    label: 'Added by',
                                    value:
                                        syllabus.uploadedBy?.name ||
                                        syllabus.uploadedBy?.username ||
                                        syllabus.uploadedBy?.email,
                                },
                                {
                                    label: 'Created',
                                    value: formatDateTime(syllabus.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(syllabus.updatedAt),
                                },
                                {
                                    label: 'Slug',
                                    value: syllabus.slug,
                                    mono: true,
                                },
                                {
                                    label: 'ID',
                                    value: syllabus._id,
                                    mono: true,
                                },
                            ]}
                        />
                        <button
                            type='button'
                            aria-expanded={showRaw}
                            onClick={() => setShowRaw((v) => !v)}
                            className='self-start text-[13px] font-medium text-link hover:underline cursor-pointer'
                        >
                            {showRaw ? 'Hide raw data' : 'Show raw data'}
                        </button>
                        {showRaw && (
                            <pre className='max-h-80 overflow-auto p-3 rounded-lg bg-sunken font-mono text-[11.5px] leading-relaxed text-ink-2'>
                                {JSON.stringify(syllabus, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            <SyllabusEditModal
                isOpen={editing}
                onClose={() => setEditing(false)}
                syllabus={syllabus}
                // The save response leaves the subject unfilled, so reload.
                onUpdate={fetchSyllabusDetail}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                title='Delete this syllabus?'
                message='Students stop seeing the units on the subject page, and the subject loses its link to them. This can’t be undone.'
                confirmText='Delete'
                variant='danger'
            />
        </div>
    );
};

export default SyllabusDetail;
