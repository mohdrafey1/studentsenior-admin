import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Button, Dialog, Field, Input, Select } from './ui';

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
    value: sem,
    label: `Semester ${sem}`,
}));

const AddSubjectModal = ({
    showModal,
    editingSubject,
    branch, // Optional - when provided, branch/course selection is hidden
    colleges = [],
    courses = [], // Optional - when provided, show course dropdown
    branches = [], // Optional - when provided, show branch dropdown
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        subjectName: '',
        subjectCode: '',
        semester: 1,
        college: '',
        course: '',
        branch: '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Filter branches based on selected course
    const filteredBranches = useMemo(() => {
        if (!formData.course || !branches.length) return branches;
        return branches.filter(
            (b) =>
                b.course?._id === formData.course ||
                b.course === formData.course,
        );
    }, [formData.course, branches]);

    // Determine if we're in "full mode" (need course/branch selection) or "branch mode"
    const isFullMode = !branch && courses.length > 0;

    useEffect(() => {
        if (editingSubject) {
            setFormData({
                subjectName: editingSubject.subjectName || '',
                subjectCode: editingSubject.subjectCode || '',
                semester: editingSubject.semester || 1,
                college:
                    editingSubject.college?._id || editingSubject.college || '',
                course:
                    editingSubject.branch?.course?._id ||
                    editingSubject.branch?.course ||
                    '',
                branch:
                    editingSubject.branch?._id || editingSubject.branch || '',
            });
        } else {
            setFormData({
                subjectName: '',
                subjectCode: '',
                semester: 1,
                college: colleges?.[0]?._id || '',
                course: '',
                branch: branch?._id || '',
            });
        }
        setErrors({});
        // Reset whenever the dialog opens, so a second "Add subject" starts empty.
    }, [editingSubject, colleges, branch, showModal]);

    // When course changes, reset branch selection
    const handleCourseChange = (courseId) => {
        setFormData({
            ...formData,
            course: courseId,
            branch: '', // Reset branch when course changes
        });
        setErrors((prev) => ({ ...prev, course: '', branch: '' }));
    };

    const setField = (name, value) => {
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    if (!showModal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nextErrors = {};
        if (!formData.subjectName.trim())
            nextErrors.subjectName = 'Enter the subject name';
        if (!formData.subjectCode.trim())
            nextErrors.subjectCode = 'Enter the subject code';

        // Determine branch ID to use
        const branchId = isFullMode ? formData.branch : branch?._id;
        if (isFullMode && !formData.course)
            nextErrors.course = 'Choose a course';
        if (!branchId) nextErrors.branch = 'Choose a branch';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            if (!isFullMode && !branchId)
                toast.error('This branch couldn’t be found. Reload the page.');
            return;
        }

        // Get course ID (from branch object or form selection)
        const courseId = isFullMode
            ? formData.course
            : branch?.course?._id || branch?.course;

        setSaving(true);
        try {
            if (editingSubject) {
                await api.put(`/resource/subjects/${editingSubject._id}`, {
                    subjectName: formData.subjectName,
                    subjectCode: formData.subjectCode,
                    semester: formData.semester,
                    college: formData.college,
                    branch: branchId,
                });
                toast.success('Subject saved');
            } else {
                await api.post('/resource/subjects', {
                    subjectName: formData.subjectName,
                    subjectCode: formData.subjectCode,
                    semester: formData.semester,
                    college: formData.college,
                    branch: branchId,
                    course: courseId,
                });
                toast.success('Subject added');
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the subject. Try again.',
            );
        } finally {
            setSaving(false);
        }
    };

    const context = branch
        ? [branch.course?.courseName, branch.branchName]
              .filter(Boolean)
              .join(' · ')
        : undefined;

    return (
        <Dialog
            open={showModal}
            onClose={onClose}
            busy={saving}
            title={editingSubject ? 'Edit subject' : 'Add subject'}
            description={context}
            footer={
                <>
                    <Button onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='subject-form'
                        variant='primary'
                        disabled={saving}
                        icon={saving ? Loader2 : undefined}
                        className={saving ? '[&>svg]:animate-spin' : ''}
                    >
                        {saving
                            ? 'Saving…'
                            : editingSubject
                              ? 'Save changes'
                              : 'Add subject'}
                    </Button>
                </>
            }
        >
            <form
                id='subject-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <Field label='Subject name' required error={errors.subjectName}>
                    <Input
                        value={formData.subjectName}
                        onChange={(e) =>
                            setField('subjectName', e.target.value)
                        }
                        placeholder='Data Structures and Algorithms'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field
                        label='Subject code'
                        required
                        error={errors.subjectCode}
                    >
                        <Input
                            value={formData.subjectCode}
                            onChange={(e) =>
                                setField('subjectCode', e.target.value)
                            }
                            placeholder='KCS301'
                            className='font-mono text-[13px]'
                        />
                    </Field>
                    <Field label='Semester'>
                        <Select
                            value={formData.semester}
                            onChange={(e) =>
                                setField('semester', parseInt(e.target.value))
                            }
                            options={SEMESTER_OPTIONS}
                        />
                    </Field>
                </div>

                <Field label='College'>
                    <Select
                        value={formData.college}
                        onChange={(e) => setField('college', e.target.value)}
                        placeholder='Choose a college'
                        options={colleges.map((college) => ({
                            value: college._id,
                            label: college.name,
                        }))}
                    />
                </Field>

                {/* Course and branch - only in full mode */}
                {isFullMode && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <Field label='Course' required error={errors.course}>
                            <Select
                                value={formData.course}
                                onChange={(e) =>
                                    handleCourseChange(e.target.value)
                                }
                                placeholder='Choose a course'
                                options={courses.map((course) => ({
                                    value: course._id,
                                    label: `${course.courseName} (${course.courseCode})`,
                                }))}
                            />
                        </Field>
                        <Field label='Branch' required error={errors.branch}>
                            <Select
                                value={formData.branch}
                                onChange={(e) =>
                                    setField('branch', e.target.value)
                                }
                                disabled={!formData.course}
                                placeholder={
                                    formData.course
                                        ? 'Choose a branch'
                                        : 'Choose a course first'
                                }
                                options={filteredBranches.map((b) => ({
                                    value: b._id,
                                    label: `${b.branchName} (${b.branchCode})`,
                                }))}
                            />
                        </Field>
                    </div>
                )}
            </form>
        </Dialog>
    );
};

export default AddSubjectModal;
