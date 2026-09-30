import { useState, useRef } from 'react';
import {
    Check,
    FileText,
    FileUp,
    Loader2,
    Sparkles,
    Trash2,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Alert, Button, Dialog, Field, Input, Select, Textarea } from './ui';

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
    value: sem,
    label: `Sem ${sem}`,
}));

const STEPS = [
    'Choose college and file',
    'Check what AI found',
    'Add subjects',
];

const isValidSubject = (s) =>
    Boolean(s.subjectName?.trim()) &&
    Boolean(s.subjectCode?.trim()) &&
    s.semester >= 1 &&
    s.semester <= 8;

const PLACEHOLDER = `Data Structures and Algorithms KCS301 Semester 3
Operating Systems KCS401 Semester 4
Database Management System KCS501 5th Sem
Computer Networks KCS601 Semester 6`;

function Steps({ current }) {
    return (
        <ol
            aria-label='Steps'
            className='flex flex-wrap items-center gap-x-2.5 gap-y-2 -mx-6 -mt-1 mb-4 px-6 py-3.5 border-y border-line-soft bg-sunken'
        >
            {STEPS.map((label, i) => {
                const n = i + 1;
                const done = n < current;
                const active = n === current;
                return (
                    <li
                        key={label}
                        aria-current={active ? 'step' : undefined}
                        className={`flex items-center gap-2 text-[13px] ${
                            done
                                ? 'text-ok-ink'
                                : active
                                  ? 'text-ink font-semibold'
                                  : 'text-muted'
                        }`}
                    >
                        {i > 0 && (
                            <span
                                aria-hidden='true'
                                className='hidden sm:block w-6 h-px bg-line-strong mr-0.5'
                            />
                        )}
                        <span
                            className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 ${
                                done
                                    ? 'bg-ok-soft'
                                    : active
                                      ? 'bg-inverse text-on-inverse'
                                      : 'border border-line-strong'
                            }`}
                        >
                            {done ? (
                                <Check
                                    className='w-3.5 h-3.5'
                                    aria-label='Done'
                                />
                            ) : (
                                n
                            )}
                        </span>
                        {label}
                    </li>
                );
            })}
        </ol>
    );
}

const BulkSubjectModal = ({
    showModal,
    branch,
    college,
    colleges = [],
    onClose,
    onSuccess,
}) => {
    const [rawText, setRawText] = useState('');
    const [step, setStep] = useState(1);
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [source, setSource] = useState(null);
    const [selectedCollege, setSelectedCollege] = useState(
        college || colleges[0]?._id || '',
    );
    const fileInputRef = useRef(null);

    if (!showModal) return null;

    const handleParseWithAI = async () => {
        if (!rawText.trim()) {
            toast.error('Paste the subject list first');
            return;
        }

        if (rawText.trim().length < 20) {
            toast.error(
                'That list is too short. Paste at least 20 characters.',
            );
            return;
        }

        setParsing(true);
        try {
            const response = await api.post(
                '/resource/subjects/parse-with-ai',
                {
                    rawText: rawText,
                },
            );

            if (response.data.success) {
                const parsedSubjects = response.data.data.subjects || [];
                setSubjects(parsedSubjects);
                if (parsedSubjects.length > 0) {
                    toast.success(
                        `Found ${parsedSubjects.length} subject${parsedSubjects.length === 1 ? '' : 's'}`,
                    );
                    setSource({ kind: 'text' });
                    setStep(2);
                } else {
                    toast.error(
                        'No subjects found in that text. Check it and try again.',
                    );
                }
            } else {
                toast.error(
                    response.data.message ||
                        'Couldn’t read the subjects. Try again.',
                );
            }
        } catch (error) {
            console.error('AI Parse Error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t read the subjects. Try again.',
            );
        } finally {
            setParsing(false);
        }
    };

    const handlePDFUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        // Validate file count
        if (files.length > 10) {
            toast.error('Choose up to 10 files');
            return;
        }

        // Validate all files are PDFs
        const nonPdfFiles = files.filter(
            (file) => file.type !== 'application/pdf',
        );
        if (nonPdfFiles.length > 0) {
            toast.error('Only PDF files can be read');
            return;
        }

        // Validate total size (10MB)
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 10 * 1024 * 1024) {
            toast.error(
                `These files add up to ${(totalSize / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`,
            );
            return;
        }

        setParsing(true);
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('pdf', file);
            });

            const response = await api.post(
                '/resource/subjects/parse-with-ai',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );

            if (response.data.success) {
                const parsedSubjects = response.data.data.subjects || [];
                setSubjects(parsedSubjects);
                if (parsedSubjects.length > 0) {
                    toast.success(
                        `Found ${parsedSubjects.length} subject${parsedSubjects.length === 1 ? '' : 's'} in ${files.length} PDF${files.length > 1 ? 's' : ''}`,
                    );
                    setSource({
                        kind: 'pdf',
                        names: files.map((file) => file.name),
                    });
                    setStep(2);
                } else {
                    toast.error('No subjects found in the PDF');
                }
            } else {
                toast.error(
                    response.data.message ||
                        'Couldn’t read the PDF. Try again.',
                );
            }
        } catch (error) {
            console.error('PDF Parse Error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t read the PDF. Try again.',
            );
        } finally {
            setParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...subjects];
        newSubjects[index] = { ...newSubjects[index], [field]: value };
        setSubjects(newSubjects);
    };

    const handleDeleteSubject = (index) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleRemoveInvalid = () => {
        const validSubjects = subjects.filter(isValidSubject);
        const removed = subjects.length - validSubjects.length;
        setSubjects(validSubjects);
        if (removed > 0) {
            toast.success(`Removed ${removed} row${removed === 1 ? '' : 's'}`);
        } else {
            toast.error('Every row is complete');
        }
    };

    const handleSaveAll = async () => {
        if (subjects.length === 0) {
            toast.error('There are no subjects to add');
            return;
        }

        const validSubjects = subjects.filter(isValidSubject);

        if (validSubjects.length === 0) {
            toast.error('Every row is missing a name, code or semester');
            return;
        }

        setSaving(true);
        try {
            const response = await api.post('/resource/subjects/bulk', {
                subjects: validSubjects,
                branch: branch._id,
                college: selectedCollege,
            });

            if (response.data.success) {
                const { created, skipped } = response.data.data;
                toast.success(
                    `Added ${created} subject${created === 1 ? '' : 's'}${skipped > 0 ? `, skipped ${skipped} that already existed` : ''}`,
                );
                onSuccess?.();
                handleClose();
            } else {
                toast.error(
                    response.data.message ||
                        'Couldn’t add the subjects. Try again.',
                );
            }
        } catch (error) {
            console.error('Bulk Save Error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t add the subjects. Try again.',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setRawText('');
        setSubjects([]);
        setSource(null);
        setStep(1);
        onClose();
    };

    const invalidCount = subjects.filter((s) => !isValidSubject(s)).length;
    const validCount = subjects.length - invalidCount;
    const collegeName = colleges.find((c) => c._id === selectedCollege)?.name;
    const busy = parsing || saving;

    const footer =
        step === 1 ? (
            <>
                <Button onClick={handleClose} disabled={busy}>
                    Cancel
                </Button>
                {subjects.length > 0 && (
                    <Button onClick={() => setStep(2)} disabled={busy}>
                        Review {subjects.length} subject
                        {subjects.length === 1 ? '' : 's'}
                    </Button>
                )}
                <Button
                    variant='primary'
                    onClick={handleParseWithAI}
                    disabled={parsing || !rawText.trim()}
                    icon={parsing ? Loader2 : Sparkles}
                    className={parsing ? '[&>svg]:animate-spin' : ''}
                >
                    {parsing ? 'Reading…' : 'Find subjects'}
                </Button>
            </>
        ) : (
            <>
                <Button
                    variant='ghost'
                    className='mr-auto'
                    onClick={() => setStep(1)}
                    disabled={saving}
                >
                    Back
                </Button>
                <Button onClick={handleClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant='primary'
                    onClick={handleSaveAll}
                    disabled={saving || validCount === 0}
                    icon={saving ? Loader2 : undefined}
                    className={saving ? '[&>svg]:animate-spin' : ''}
                >
                    {saving
                        ? 'Adding…'
                        : `Add ${validCount} subject${validCount === 1 ? '' : 's'}`}
                </Button>
            </>
        );

    return (
        <Dialog
            open={showModal}
            onClose={handleClose}
            busy={busy}
            size='lg'
            title='Add subjects from a syllabus file'
            description={[branch?.course?.courseName, branch?.branchName]
                .filter(Boolean)
                .join(' · ')}
            footer={footer}
        >
            <Steps current={saving ? 3 : step} />

            {step === 1 ? (
                <div className='flex flex-col gap-4'>
                    <Field
                        label='College'
                        hint='The subjects are added for this college.'
                    >
                        <Select
                            value={selectedCollege}
                            onChange={(e) => setSelectedCollege(e.target.value)}
                            placeholder='Choose a college'
                            options={colleges.map((c) => ({
                                value: c._id,
                                label: c.name,
                            }))}
                        />
                    </Field>

                    <div className='flex flex-wrap items-center gap-3 p-4 rounded-xl border border-dashed border-line-strong bg-sunken'>
                        <span className='w-10 h-10 rounded-lg bg-brand-soft text-brand-ink flex items-center justify-center shrink-0'>
                            <FileUp className='w-5 h-5' aria-hidden='true' />
                        </span>
                        <div className='flex-1 min-w-[200px] flex flex-col gap-0.5'>
                            <span className='text-[13.5px] font-medium text-ink'>
                                Upload the scheme or syllabus PDFs
                            </span>
                            <span className='text-[12.5px] text-muted'>
                                Up to 10 files, 10 MB in total. AI reads them
                                and lists the subjects for you to check.
                            </span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='.pdf'
                            multiple
                            onChange={handlePDFUpload}
                            className='hidden'
                            aria-hidden='true'
                            tabIndex={-1}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={parsing}
                            icon={parsing ? Loader2 : FileUp}
                            className={parsing ? '[&>svg]:animate-spin' : ''}
                        >
                            {parsing ? 'Reading…' : 'Choose PDFs'}
                        </Button>
                    </div>

                    <div
                        className='flex items-center gap-3 text-[12.5px] text-muted'
                        aria-hidden='true'
                    >
                        <span className='flex-1 h-px bg-line' />
                        or paste the subject list
                        <span className='flex-1 h-px bg-line' />
                    </div>

                    <Field
                        label='Subject list'
                        hint='One subject per line works best. Include the code and semester.'
                    >
                        <Textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={PLACEHOLDER}
                            rows={6}
                            className='font-mono text-[12.5px]'
                        />
                    </Field>
                </div>
            ) : (
                <div className='flex flex-col gap-3.5'>
                    <div className='flex flex-wrap items-center gap-3 px-3.5 py-2.5 border border-line rounded-[10px]'>
                        <FileText
                            className='w-4 h-4 text-muted shrink-0'
                            aria-hidden='true'
                        />
                        <div className='flex-1 min-w-[180px] flex flex-col gap-0.5'>
                            <span
                                className={
                                    source?.kind === 'pdf'
                                        ? 'font-mono text-[12.5px] text-ink break-all'
                                        : 'text-[13.5px] text-ink'
                                }
                            >
                                {source?.kind === 'pdf'
                                    ? source.names.join(', ')
                                    : 'Pasted subject list'}
                            </span>
                            <span className='text-[12.5px] text-muted'>
                                {[
                                    collegeName || 'No college chosen',
                                    `${subjects.length} subject${subjects.length === 1 ? '' : 's'} found`,
                                ].join(' · ')}
                            </span>
                        </div>
                        <Button size='sm' onClick={() => setStep(1)}>
                            Change
                        </Button>
                    </div>

                    {invalidCount > 0 && (
                        <Alert
                            tone='warn'
                            action={
                                <Button size='sm' onClick={handleRemoveInvalid}>
                                    Remove {invalidCount}
                                </Button>
                            }
                        >
                            {invalidCount} row
                            {invalidCount === 1 ? ' is' : 's are'} missing a
                            name, code or semester. Fix or remove{' '}
                            {invalidCount === 1 ? 'it' : 'them'}; only complete
                            rows are added.
                        </Alert>
                    )}

                    {subjects.length === 0 ? (
                        <p className='px-4 py-8 text-center text-[13.5px] text-ink-2 border border-line rounded-[10px]'>
                            Every row was removed. Go back to read another file
                            or list.
                        </p>
                    ) : (
                        <div className='border border-line rounded-[10px] overflow-x-auto'>
                            <table className='w-full min-w-[520px] text-[13.5px]'>
                                <thead>
                                    <tr className='bg-sunken border-b border-line-soft'>
                                        <th
                                            scope='col'
                                            className='eyebrow font-normal text-left px-3.5 py-2'
                                        >
                                            Subject name
                                        </th>
                                        <th
                                            scope='col'
                                            className='eyebrow font-normal text-left px-2 py-2 w-[140px]'
                                        >
                                            Code
                                        </th>
                                        <th
                                            scope='col'
                                            className='eyebrow font-normal text-left px-2 py-2 w-[112px]'
                                        >
                                            Semester
                                        </th>
                                        <th scope='col' className='w-11'>
                                            <span className='sr-only'>
                                                Remove
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((subject, index) => {
                                        const invalid =
                                            !isValidSubject(subject);
                                        const label =
                                            subject.subjectName?.trim() ||
                                            `row ${index + 1}`;
                                        return (
                                            <tr
                                                key={index}
                                                className={`border-b border-line-soft last:border-b-0 ${
                                                    invalid
                                                        ? 'bg-warn-soft/40'
                                                        : ''
                                                }`}
                                            >
                                                <td className='pl-2.5 pr-2 py-1.5'>
                                                    <Input
                                                        aria-label={`Subject name, ${label}`}
                                                        aria-invalid={
                                                            !subject.subjectName?.trim()
                                                        }
                                                        value={
                                                            subject.subjectName ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            handleSubjectChange(
                                                                index,
                                                                'subjectName',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='h-8'
                                                    />
                                                </td>
                                                <td className='px-2 py-1.5'>
                                                    <Input
                                                        aria-label={`Subject code, ${label}`}
                                                        aria-invalid={
                                                            !subject.subjectCode?.trim()
                                                        }
                                                        placeholder='Missing'
                                                        value={
                                                            subject.subjectCode ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            handleSubjectChange(
                                                                index,
                                                                'subjectCode',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='h-8 font-mono text-[12.5px]'
                                                    />
                                                </td>
                                                <td className='px-2 py-1.5'>
                                                    <Select
                                                        aria-label={`Semester, ${label}`}
                                                        value={
                                                            subject.semester ||
                                                            1
                                                        }
                                                        onChange={(e) =>
                                                            handleSubjectChange(
                                                                index,
                                                                'semester',
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        options={
                                                            SEMESTER_OPTIONS
                                                        }
                                                        className='h-8'
                                                    />
                                                </td>
                                                <td className='pr-2 py-1.5 text-right'>
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        iconOnly
                                                        icon={Trash2}
                                                        aria-label={`Remove ${label}`}
                                                        onClick={() =>
                                                            handleDeleteSubject(
                                                                index,
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p className='text-[12.5px] text-muted'>
                        Subjects that already exist in this branch are skipped
                        automatically.
                    </p>
                </div>
            )}
        </Dialog>
    );
};

export default BulkSubjectModal;
