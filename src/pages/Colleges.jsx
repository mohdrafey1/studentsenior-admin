import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import CollegeList from "../components/College/CollegeList";
import EditCollegeModal from "../components/College/EditCollegeModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import api from "../utils/api";
import toast from "react-hot-toast";

const Colleges = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCollege, setEditingCollege] = useState(null);
    const [collegeToDelete, setCollegeToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    // Fetch colleges
    const fetchColleges = async () => {
        try {
            setLoading(true);
            const response = await api.get("/dashboard/college");
            if (response.data.success) {
                setColleges(response.data.data || []);
            } else {
                throw new Error(
                    response.data.message || "Failed to fetch colleges"
                );
            }
        } catch (error) {
            console.error("Error fetching colleges:", error);
            toast.error(
                error.response?.data?.message || "Failed to fetch colleges"
            );
            setColleges([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColleges();
    }, []);

    // Handle add new college
    const handleAddNew = () => {
        setEditingCollege(null);
        setIsEditModalOpen(true);
    };

    // Handle edit college
    const handleEdit = (college) => {
        setEditingCollege(college);
        setIsEditModalOpen(true);
    };

    // Handle view college
    const handleView = (college) => {
        // For now, we'll just show edit modal in view mode
        // You can create a separate view modal if needed
        setEditingCollege(college);
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
                    `/dashboard/college/${editingCollege._id}`,
                    formData
                );
            } else {
                // Create new college
                response = await api.post("/dashboard/college", formData);
            }

            if (response.data.success) {
                toast.success(
                    editingCollege
                        ? "College updated successfully!"
                        : "College created successfully!"
                );
                setIsEditModalOpen(false);
                setEditingCollege(null);
                await fetchColleges(); // Refresh the list
            } else {
                throw new Error(response.data.message || "Operation failed");
            }
        } catch (error) {
            console.error("Error saving college:", error);
            toast.error(
                error.response?.data?.message || "Failed to save college"
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
                `/dashboard/college/${collegeToDelete._id}`
            );

            if (response.data.success) {
                toast.success("College deleted successfully!");
                setIsDeleteModalOpen(false);
                setCollegeToDelete(null);
                await fetchColleges(); // Refresh the list
            } else {
                throw new Error(response.data.message || "Delete failed");
            }
        } catch (error) {
            console.error("Error deleting college:", error);
            toast.error(
                error.response?.data?.message || "Failed to delete college"
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
        }
    };

    const closeDeleteModal = () => {
        if (!isSubmitting) {
            setIsDeleteModalOpen(false);
            setCollegeToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Colleges Management
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Manage all colleges in the Student Senior
                                platform
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>Welcome, {user?.name}</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="capitalize">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* College List */}
                <CollegeList
                    colleges={colleges}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onAddNew={handleAddNew}
                />

                {/* Edit/Create Modal */}
                <EditCollegeModal
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    college={editingCollege}
                    onSave={handleSaveCollege}
                    loading={isSubmitting}
                />

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title="Delete College"
                    message="Are you sure you want to delete this college? This action will permanently remove all associated data including posts, notes, and user content."
                    itemName={collegeToDelete?.name}
                    loading={isSubmitting}
                />
            </main>
        </div>
    );
};

export default Colleges;
