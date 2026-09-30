import { useState } from 'react';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Button, Dialog, Field, Input, Textarea } from './ui';

const UNITS_PLACEHOLDER = `[
  {
    "unitNumber": 1,
    "title": "Introduction to Programming",
    "content": "Variables, data types and control structures."
  },
  {
    "unitNumber": 2,
    "title": "Object-Oriented Programming",
    "content": "Classes, objects, inheritance and polymorphism."
  }
]`;

const RAW_PLACEHOLDER = `Course code: PY101
Title: Physics
Unit 1: Wave Optics
Topics: Interference, Diffraction…
Reference books:
1. Fundamentals of Optics by Jenkins`;

const SyllabusModal = ({
    showModal,
    selectedSubject,
    formData,
    submitting,
    onClose,
    onSubmit,
    onFormChange,
    onBatchUpdate,
}) => {
    const [rawSyllabusText, setRawSyllabusText] = useState('');
    const [showAiSection, setShowAiSection] = useState(true);
    const [parsing, setParsing] = useState(false);
    const [unitsError, setUnitsError] = useState('');

    if (!showModal) return null;

    const handleAutoFillWithAI = async () => {
        if (!rawSyllabusText.trim()) {
            toast.error('Paste the syllabus first');
            return;
        }

        if (rawSyllabusText.trim().length < 50) {
            toast.error(
                'That syllabus is too short. Paste at least 50 characters.',
            );
            return;
        }

        setParsing(true);
        try {
            const response = await api.post('/syllabus/parse-with-ai', {
                rawText: rawSyllabusText,
            });

            if (response.data.success) {
                const { description, units, referenceBooks } =
                    response.data.data;

                // Batch update all form fields at once to avoid stale closure issues
                const updates = {};
                if (description) {
                    updates.description = description;
                }
                if (units && Array.isArray(units)) {
                    updates.units = JSON.stringify(units, null, 2);
                }
                if (referenceBooks) {
                    updates.referenceBooks = referenceBooks;
                }

                onBatchUpdate(updates);
                setUnitsError('');

                toast.success('Form filled in. Check it before saving.');
                setShowAiSection(false); // Collapse AI section after success
            } else {
                toast.error(
                    response.data.message ||
                        'Couldn’t read the syllabus. Try again.',
                );
            }
        } catch (error) {
            console.error('AI Parse Error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t read the syllabus. Try again.',
            );
        } finally {
            setParsing(false);
        }
    };

    const failUnits = (message) => {
        setUnitsError(message);
        toast.error('Check the units');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Parse units JSON before submitting
        let parsedUnits = formData.units;
        if (typeof formData.units === 'string') {
            try {
                parsedUnits = JSON.parse(formData.units);
            } catch (err) {
                failUnits(`This isn’t valid JSON: ${err.message}`);
                return;
            }
            // Validate that it's an array
            if (!Array.isArray(parsedUnits)) {
                failUnits('Units must be a JSON array, starting with [');
                return;
            }
            // Validate each unit has required fields
            const incomplete = parsedUnits.findIndex(
                (unit) => !unit.unitNumber || !unit.title || !unit.content,
            );
            if (incomplete !== -1) {
                failUnits(
                    `Unit ${incomplete + 1} needs a unitNumber, title and content.`,
                );
                return;
            }
        }
        setUnitsError('');

        // Temporarily update formData.units with parsed array
        const originalUnits = formData.units;
        formData.units = parsedUnits;

        // Call the original onSubmit
        await onSubmit(e);

        // Restore original units in case of error (though form might be reset anyway)
        formData.units = originalUnits;
    };

    return (
        <Dialog
            open={showModal}
            onClose={onClose}
            busy={submitting}
            size='lg'
            title='Add syllabus'
            description={[
                selectedSubject?.subjectName,
                selectedSubject?.college?.name,
            ]
                .filter(Boolean)
                .join(' · ')}
            footer={
                <>
                    <Button onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='syllabus-form'
                        variant='primary'
                        disabled={submitting}
                        icon={submitting ? Loader2 : undefined}
                        className={submitting ? '[&>svg]:animate-spin' : ''}
                    >
                        {submitting ? 'Creating…' : 'Create syllabus'}
                    </Button>
                </>
            }
        >
            <form
                id='syllabus-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                {/* AI auto-fill */}
                <div className='border border-line rounded-xl overflow-hidden'>
                    <button
                        type='button'
                        onClick={() => setShowAiSection(!showAiSection)}
                        aria-expanded={showAiSection}
                        className='w-full flex items-center gap-2.5 px-4 py-3 bg-sunken hover:bg-line-soft text-left cursor-pointer transition-colors'
                    >
                        <Sparkles
                            className='w-4 h-4 text-brand-ink shrink-0'
                            aria-hidden='true'
                        />
                        <span className='flex-1 flex flex-col gap-0.5'>
                            <span className='text-[13.5px] font-medium text-ink'>
                                Fill in from a pasted syllabus
                            </span>
                            <span className='text-[12.5px] text-muted'>
                                AI fills the description, units and books for
                                you to check.
                            </span>
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 text-muted transition-transform ${
                                showAiSection ? 'rotate-180' : ''
                            }`}
                            aria-hidden='true'
                        />
                    </button>
                    {showAiSection && (
                        <div className='flex flex-col gap-3 p-4 border-t border-line-soft'>
                            <Field label='Syllabus text'>
                                <Textarea
                                    value={rawSyllabusText}
                                    onChange={(e) =>
                                        setRawSyllabusText(e.target.value)
                                    }
                                    placeholder={RAW_PLACEHOLDER}
                                    rows={6}
                                />
                            </Field>
                            <div>
                                <Button
                                    variant='dark'
                                    onClick={handleAutoFillWithAI}
                                    disabled={
                                        parsing || !rawSyllabusText.trim()
                                    }
                                    icon={parsing ? Loader2 : Sparkles}
                                    className={
                                        parsing ? '[&>svg]:animate-spin' : ''
                                    }
                                >
                                    {parsing ? 'Reading…' : 'Fill in with AI'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <Field
                    label='Subject code'
                    hint='Taken from the subject. Edit the subject to change it.'
                >
                    <Input
                        value={formData.subjectCode}
                        readOnly
                        className='font-mono text-[13px] bg-sunken'
                    />
                </Field>

                <Field label='Description'>
                    <Textarea
                        value={formData.description}
                        onChange={(e) =>
                            onFormChange('description', e.target.value)
                        }
                        placeholder='What the course covers, in two or three lines'
                        rows={3}
                    />
                </Field>

                <Field
                    label='Units'
                    error={unitsError}
                    hint='A JSON array. Each unit needs unitNumber, title and content.'
                >
                    <Textarea
                        value={
                            typeof formData.units === 'string'
                                ? formData.units
                                : JSON.stringify(formData.units, null, 2)
                        }
                        onChange={(e) => {
                            onFormChange('units', e.target.value);
                            if (unitsError) setUnitsError('');
                        }}
                        placeholder={UNITS_PLACEHOLDER}
                        rows={12}
                        className='font-mono text-[12.5px]'
                    />
                </Field>

                <Field label='Reference books' hint='One book per line.'>
                    <Textarea
                        value={formData.referenceBooks}
                        onChange={(e) =>
                            onFormChange('referenceBooks', e.target.value)
                        }
                        rows={4}
                    />
                </Field>
            </form>
        </Dialog>
    );
};

export default SyllabusModal;
