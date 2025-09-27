import { useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useResources = () => {
    const [courses, setCourses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            setLoadingCourses(true);
            const response = await api.get('/resource/courses');
            const courseOptions = response.data.data.map((course) => ({
                value: course._id,
                label: `${course.courseName} (${course.courseCode})`,
            }));
            setCourses(courseOptions);
        } catch {
            toast.error('Failed to fetch courses');
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    }, []);

    const fetchBranches = useCallback(async (courseId) => {
        try {
            setLoadingBranches(true);
            const response = await api.get(`/resource/branches/${courseId}`);
            const branchOptions = response.data.data.map((branch) => ({
                value: branch._id,
                label: `${branch.branchName} (${branch.course?.courseName || 'N/A'})`,
            }));
            setBranches(branchOptions);
        } catch {
            toast.error('Failed to fetch branches');
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    }, []);

    const fetchSubjects = useCallback(async (branchId = null) => {
        try {
            const response = await api.get(`/resource/subjects/${branchId}`);
            const subjectOptions = response.data.data.map((subject) => ({
                value: subject._id,
                label: `${subject.subjectName} (${subject.subjectCode})`,
            }));
            setSubjects(subjectOptions);
        } catch {
            toast.error('Failed to fetch subjects');
            setSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    }, []);

    return {
        courses,
        branches,
        subjects,
        loadingCourses,
        loadingBranches,
        loadingSubjects,
        fetchCourses,
        fetchBranches,
        fetchSubjects,
    };
};
