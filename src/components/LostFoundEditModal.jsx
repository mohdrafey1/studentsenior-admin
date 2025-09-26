import React, { useState, useEffect } from "react";
import {
    X,
    Loader,
    Search as SearchIcon,
    Save,
    Upload,
    Image as ImageIconLucide,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const LostFoundEditModal = ({ isOpen, onClose, item, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "lost",
        location: "",
        date: "",
        currentStatus: "open",
        imageUrl: "",
        whatsapp: "",
    });
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || "",
                description: item.description || "",
                type: item.type || "lost",
                location: item.location || "",
                date: item.date
                    ? new Date(item.date).toISOString().split("T")[0]
                    : "",
                currentStatus: item.currentStatus || "open",
                imageUrl: item.imageUrl || "",
                whatsapp: item.whatsapp || "",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                type: "lost",
                location: "",
                date: new Date().toISOString().split("T")[0],
                currentStatus: "open",
                imageUrl: "",
                whatsapp: "",
            });
        }
        setErrors({});
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setImageLoading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            // Note: This would typically upload to a cloud service
            // For now, we'll create a mock URL or use a local preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData((prev) => ({
                    ...prev,
                    imageUrl: e.target.result,
                }));
                setImageLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
            setImageLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!formData.location.trim()) {
            newErrors.location = "Location is required";
        }

        if (!formData.date) {
            newErrors.date = "Date is required";
        }

        if (!formData.whatsapp.trim()) {
            newErrors.whatsapp = "WhatsApp number is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (item) {
                // Update existing item
                await api.put(`/lostandfound/edit/${item._id}`, formData);
                toast.success("Item updated successfully");
            } else {
                // Create new item
                await api.post("/lostandfound/create", formData);
                toast.success("Item created successfully");
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving item:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to save item";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <SearchIcon className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {item
                                ? "Edit Lost & Found Item"
                                : "Create Lost & Found Item"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Item Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                    errors.title
                                        ? "border-red-300 dark:border-red-600"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder="e.g., Black iPhone 13, Blue water bottle"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Type and Status */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type *
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="lost">Lost</option>
                                    <option value="found">Found</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    name="currentStatus"
                                    value={formData.currentStatus}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                    errors.description
                                        ? "border-red-300 dark:border-red-600"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder="Provide detailed description including colors, brand, distinctive features..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Location and Date */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                        errors.location
                                            ? "border-red-300 dark:border-red-600"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                    placeholder="e.g., Library 2nd floor, Cafeteria"
                                />
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.location}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                        errors.date
                                            ? "border-red-300 dark:border-red-600"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                />
                                {errors.date && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.date}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* WhatsApp Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                WhatsApp Number *
                            </label>
                            <input
                                type="text"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                    errors.whatsapp
                                        ? "border-red-300 dark:border-red-600"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder="+1234567890"
                            />
                            {errors.whatsapp && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.whatsapp}
                                </p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Item Image
                            </label>
                            <div className="space-y-4">
                                {formData.imageUrl && (
                                    <div className="relative inline-block">
                                        <img
                                            src={formData.imageUrl}
                                            alt="Item preview"
                                            className="h-32 w-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    imageUrl: "",
                                                }))
                                            }
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {imageLoading ? (
                                                <Loader className="h-8 w-8 animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <ImageIconLucide className="h-8 w-8 mb-2 text-gray-400" />
                                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold">
                                                            Click to upload
                                                        </span>{" "}
                                                        or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        PNG, JPG or GIF (MAX.
                                                        5MB)
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={imageLoading}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    <span>{item ? "Update" : "Create"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LostFoundEditModal;
