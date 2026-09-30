import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { Button, Dialog, Field, Input, Select, Switch, Textarea } from './ui';

const YEARS = [1, 2, 3, 4, 5, 6].map((y) => ({
    value: String(y),
    label: `Year ${y}`,
}));
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
}));

// Stable React keys for units that don't have an _id yet.
const newKey = () => Math.random().toString(36).slice(2);

const formFrom = (syllabus) => ({
    year: syllabus?.year || 1,
    semester: syllabus?.semester || 1,
    description: syllabus?.description || '',
    referenceBooks: syllabus?.referenceBooks || '',
    isActive: syllabus?.isActive !== undefined ? syllabus.isActive : true,
    units: (syllabus?.units || []).map((unit) => ({
        ...unit,
        _key: unit._id || newKey(),
    })),
});

/**
 * Edit a syllabus: year, semester, visibility, description, units and books.
 * Saves with PUT /syllabus/edit/:id and calls onUpdate(savedFields, response).
 */
const SyllabusEditModal = ({ isOpen, onClose, syllabus, onUpdate }) => {
    const [form, setForm] = useState(() => formFrom(syllabus));
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm(formFrom(syllabus));
            setErrors({});
        }
    }, [syllabus, isOpen]);

    const set = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const setUnit = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            units: prev.units.map((unit, i) =>
                i === index ? { ...unit, [field]: value } : unit,
            ),
        }));
        if (errors.units?.[index]?.[field])
            setErrors((prev) => ({
                ...prev,
                units: prev.units.map((unit, i) =>
                    i === index ? { ...unit, [field]: '' } : unit,
                ),
            }));
    };

    const addUnit = () =>
        setForm((prev) => ({
            ...prev,
            units: [
                ...prev.units,
                {
                    unitNumber:
                        Math.max(
                            0,
                            ...prev.units.map((u) => Number(u.unitNumber) || 0),
                        ) + 1,
                    title: '',
                    content: '',
                    _key: newKey(),
                },
            ],
        }));

    const removeUnit = (index) => {
        setForm((prev) => ({
            ...prev,
            units: prev.units.filter((_, i) => i !== index),
        }));
        setErrors((prev) => ({
            ...prev,
            units: prev.units?.filter((_, i) => i !== index),
        }));
    };

    const validate = () => {
        const unitErrors = form.units.map((unit) => ({
            unitNumber:
                Number(unit.unitNumber) > 0 ? '' : 'Enter a unit number',
            title: String(unit.title || '').trim() ? '' : 'Enter a title',
            content: String(unit.content || '').trim()
                ? ''
                : 'List the topics this unit covers',
        }));
        const hasUnitErrors = unitErrors.some(
            (u) => u.unitNumber || u.title || u.content,
        );
        setErrors({ units: unitErrors });
        return !hasUnitErrors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) {
            toast.error('Check the highlighted units');
            return;
        }

        setSubmitting(true);
        try {
            const updateData = {
                year: Number(form.year),
                semester: Number(form.semester),
                units: form.units.map((unit) => {
                    const clean = {
                        ...unit,
                        unitNumber: Number(unit.unitNumber),
                        title: unit.title.trim(),
                        content: unit.content.trim(),
                    };
                    delete clean._key;
                    return clean;
                }),
                referenceBooks: form.referenceBooks,
                description: form.description,
                isActive: form.isActive,
            };
            const response = await api.put(
                `/syllabus/edit/${syllabus._id}`,
                updateData,
            );
            toast.success('Syllabus saved');
            onUpdate?.(updateData, response.data?.data);
            onClose();
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                    'Couldn’t save the syllabus. Try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const subject = syllabus?.subject;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={submitting}
            size='lg'
            title='Edit syllabus'
            description={[subject?.subjectCode, subject?.subjectName]
                .filter(Boolean)
                .join(' · ')}
            footer={
                <>
                    <Button onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='syllabus-edit-form'
                        variant='primary'
                        disabled={submitting}
                        icon={submitting ? Loader2 : undefined}
                        className={submitting ? '[&>svg]:animate-spin' : ''}
                    >
                        {submitting ? 'Saving…' : 'Save changes'}
                    </Button>
                </>
            }
        >
            <form
                id='syllabus-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-5'
            >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Year' required>
                        <Select
                            value={String(form.year)}
                            onChange={(e) =>
                                set('year', Number(e.target.value))
                            }
                            options={YEARS}
                        />
                    </Field>
                    <Field label='Semester' required>
                        <Select
                            value={String(form.semester)}
                            onChange={(e) =>
                                set('semester', Number(e.target.value))
                            }
                            options={SEMESTERS}
                        />
                    </Field>
                </div>

                <Switch
                    checked={form.isActive}
                    onChange={(on) => set('isActive', on)}
                    label='Show to students'
                    description='Turn off to hide this syllabus without deleting it.'
                    className='p-3 rounded-lg border border-line'
                />

                <Field label='About this subject'>
                    <Textarea
                        value={form.description}
                        onChange={(e) => set('description', e.target.value)}
                        rows={3}
                        placeholder='What the subject covers, in two or three sentences'
                    />
                </Field>

                <fieldset className='flex flex-col gap-3'>
                    <legend className='text-[13px] font-medium text-ink mb-3'>
                        Units
                    </legend>
                    {form.units.length === 0 && (
                        <p className='text-[13px] text-muted'>
                            No units yet. Students see an empty syllabus until
                            you add one.
                        </p>
                    )}
                    {form.units.map((unit, index) => {
                        const unitErrors = errors.units?.[index] || {};
                        return (
                            <div
                                key={unit._key}
                                className='flex flex-col gap-3 p-4 rounded-lg border border-line bg-sunken'
                            >
                                <div className='flex items-start gap-3'>
                                    <Field
                                        label='Unit'
                                        required
                                        error={unitErrors.unitNumber}
                                        className='w-20 shrink-0'
                                    >
                                        <Input
                                            type='number'
                                            min='1'
                                            value={unit.unitNumber}
                                            onChange={(e) =>
                                                setUnit(
                                                    index,
                                                    'unitNumber',
                                                    e.target.value,
                                                )
                                            }
                                            className='font-mono'
                                        />
                                    </Field>
                                    <Field
                                        label='Title'
                                        required
                                        error={unitErrors.title}
                                        className='flex-1 min-w-0'
                                    >
                                        <Input
                                            value={unit.title}
                                            onChange={(e) =>
                                                setUnit(
                                                    index,
                                                    'title',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='Stacks and queues'
                                        />
                                    </Field>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        iconOnly
                                        icon={Trash2}
                                        aria-label={`Remove unit ${unit.unitNumber || index + 1}`}
                                        className='mt-[26px] text-bad-ink hover:text-bad-ink'
                                        onClick={() => removeUnit(index)}
                                    />
                                </div>
                                <Field
                                    label='Topics'
                                    required
                                    error={unitErrors.content}
                                >
                                    <Textarea
                                        value={unit.content}
                                        onChange={(e) =>
                                            setUnit(
                                                index,
                                                'content',
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        placeholder='Stack as an abstract data type, prefix and postfix expressions, queues…'
                                    />
                                </Field>
                            </div>
                        );
                    })}
                    <Button
                        icon={Plus}
                        size='sm'
                        className='self-start'
                        onClick={addUnit}
                    >
                        Add unit
                    </Button>
                </fieldset>

                <Field label='Reference books' hint='One book per line.'>
                    <Textarea
                        value={form.referenceBooks}
                        onChange={(e) => set('referenceBooks', e.target.value)}
                        rows={3}
                        placeholder='Horowitz and Sahni — Fundamentals of Data Structures, Galgotia'
                    />
                </Field>
            </form>
        </Dialog>
    );
};

export default SyllabusEditModal;
