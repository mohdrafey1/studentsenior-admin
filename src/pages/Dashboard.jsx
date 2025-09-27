import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CollegeList from '../components/College/CollegeList';
import EditCollegeModal from '../components/College/EditCollegeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import InstallPWA from '../components/InstallPWA';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCollege, setEditingCollege] = useState(null);
    const [collegeToDelete, setCollegeToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);

    // Fetch colleges
    const fetchColleges = async () => {
        try {
            setLoading(true);
            const response = await api.get('/college');
            if (response.data.success) {
                setColleges(response.data.data || []);
            } else {
                throw new Error(
                    response.data.message || 'Failed to fetch colleges',
                );
            }
        } catch (error) {
            console.error('Error fetching colleges:', error);
            toast.error(
                error.response?.data?.message || 'Failed to fetch colleges',
            );
            setColleges([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColleges();
    }, []);

    // Handle edit college
    const handleEdit = (college) => {
        setEditingCollege(college);
        setIsViewMode(false);
        setIsEditModalOpen(true);
    };

    // Handle view college
    const handleView = (college) => {
        setEditingCollege(college);
        setIsViewMode(true);
        setIsEditModalOpen(true);
    };

    // Handle delete college
    const handleDelete = (college) => {
        setCollegeToDelete(college);
        setIsDeleteModalOpen(true);
    };

    // Save college (create or update)
    const handleSaveCollege = async (formData) => {
        try {
            setIsSubmitting(true);
            let response;

            if (editingCollege) {
                // Update existing college
                response = await api.put(
                    `/college/${editingCollege._id}`,
                    formData,
                );
            } else {
                // This shouldn't happen since we only edit existing colleges
                throw new Error('No college selected for editing');
            }

            console.log(response);

            if (response.data.success) {
                toast.success(
                    response.data.message || 'College updated successfully!',
                );
                setIsEditModalOpen(false);
                setEditingCollege(null);
                await fetchColleges(); // Refresh the list
            } else {
                throw new Error(response.data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving college:', error);
            toast.error(
                error.response?.data?.message || 'Failed to save college',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Confirm delete college
    const handleConfirmDelete = async () => {
        if (!collegeToDelete) return;

        try {
            setIsSubmitting(true);
            const response = await api.delete(
                `/college/${collegeToDelete._id}`,
            );

            if (response.data.success) {
                toast.success('College deleted successfully!');
                setIsDeleteModalOpen(false);
                setCollegeToDelete(null);
                await fetchColleges(); // Refresh the list
            } else {
                throw new Error(response.data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting college:', error);
            toast.error(
                error.response?.data?.message || 'Failed to delete college',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close modals
    const closeEditModal = () => {
        if (!isSubmitting) {
            setIsEditModalOpen(false);
            setEditingCollege(null);
            setIsViewMode(false);
        }
    };

    const closeDeleteModal = () => {
        if (!isSubmitting) {
            setIsDeleteModalOpen(false);
            setCollegeToDelete(null);
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />

            <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
                <div className='space-y-6'>
                    {/* Colleges Section */}
                    <div>
                        <div className='mb-6'>
                            <h3 className='text-lg leading-6 font-medium text-gray-900 dark:text-white'>
                                Colleges Management
                            </h3>
                            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                                Manage all colleges in the Student Senior
                                platform
                            </p>
                        </div>

                        <CollegeList
                            colleges={colleges}
                            loading={loading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={handleView}
                        />
                    </div>

                    {/* Edit/Create Modal */}
                    <EditCollegeModal
                        isOpen={isEditModalOpen}
                        onClose={closeEditModal}
                        college={editingCollege}
                        onSave={handleSaveCollege}
                        loading={isSubmitting}
                        readOnly={isViewMode}
                    />

                    {/* Delete Confirmation Modal */}
                    <DeleteConfirmationModal
                        isOpen={isDeleteModalOpen}
                        onClose={closeDeleteModal}
                        onConfirm={handleConfirmDelete}
                        title='Delete College'
                        message='Are you sure you want to delete this college? This action will permanently remove all associated data including posts, notes, and user content.'
                        itemName={collegeToDelete?.name}
                        loading={isSubmitting}
                    />
                </div>
            </main>
            {/* PWA Install Prompt */}
            <InstallPWA />
        </div>
    );
};

export default Dashboard;
