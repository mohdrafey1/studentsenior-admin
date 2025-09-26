import React, { useState, useEffect } from "react";
import {
    X,
    Save,
    AlertTriangle,
    Package,
    Type,
    FileText,
    DollarSign,
    Tag,
    CheckCircle2,
    Clock,
    XCircle,
    User,
    Loader,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const ProductEditModal = ({ isOpen, onClose, product, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
        condition: "new",
        status: "available",
    });
    const [errors, setErrors] = useState({});

    const conditionOptions = [
        { value: "new", label: "New", icon: <Package className="h-4 w-4" /> },
        {
            value: "like-new",
            label: "Like New",
            icon: <Package className="h-4 w-4" />,
        },
        { value: "good", label: "Good", icon: <Package className="h-4 w-4" /> },
        { value: "fair", label: "Fair", icon: <Package className="h-4 w-4" /> },
    ];

    const statusOptions = [
        {
            value: "available",
            label: "Available",
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-green-600 dark:text-green-400",
        },
        {
            value: "sold",
            label: "Sold",
            icon: <XCircle className="h-4 w-4" />,
            color: "text-red-600 dark:text-red-400",
        },
        {
            value: "pending",
            label: "Pending",
            icon: <Clock className="h-4 w-4" />,
            color: "text-yellow-600 dark:text-yellow-400",
        },
    ];

    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                title: product.title || "",
                description: product.description || "",
                price: product.price || "",
                category: product.category || "",
                condition: product.condition || "new",
                status: product.status || "available",
            });
            setErrors({});
        }
    }, [product, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (
            !formData.price ||
            isNaN(formData.price) ||
            Number(formData.price) < 0
        ) {
            newErrors.price = "Valid price is required";
        }

        if (!formData.category.trim()) {
            newErrors.category = "Category is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the validation errors");
            return;
        }

        setIsSubmitting(true);

        try {
            const updatedProduct = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                category: formData.category.trim(),
                condition: formData.condition,
                status: formData.status,
            };

            await api.put(`/store/edit/${product._id}`, updatedProduct);
            toast.success("Product updated successfully!");
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Failed to update product"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormField = ({
        label,
        icon,
        children,
        required = false,
        description,
        error,
    }) => (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {icon}
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );

    const getCurrentCondition = () => {
        return conditionOptions.find(
            (option) => option.value === formData.condition
        );
    };

    const getCurrentStatus = () => {
        return statusOptions.find((option) => option.value === formData.status);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>
                <span
                    className="hidden sm:inline-block sm:align-middle sm:h-screen"
                    aria-hidden="true"
                >
                    &#8203;
                </span>
                <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10">
                    <div className="flex flex-col h-full max-h-[90vh]">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Package className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Edit Product
                                        </h3>
                                        <p className="text-sm text-green-100">
                                            Update product information and
                                            settings
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Basic Information Section */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <Package className="h-5 w-5 text-green-500" />
                                        Basic Information
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            label="Title"
                                            icon={
                                                <Type className="h-4 w-4 text-gray-500" />
                                            }
                                            required
                                            description="Clear and descriptive product title"
                                            error={errors.title}
                                        >
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.title
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder="Enter product title..."
                                            />
                                        </FormField>

                                        <FormField
                                            label="Category"
                                            icon={
                                                <Tag className="h-4 w-4 text-gray-500" />
                                            }
                                            required
                                            description="Product category or type"
                                            error={errors.category}
                                        >
                                            <input
                                                type="text"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.category
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder="e.g., Electronics, Books, Clothing"
                                            />
                                        </FormField>
                                    </div>

                                    <FormField
                                        label="Description"
                                        icon={
                                            <FileText className="h-4 w-4 text-gray-500" />
                                        }
                                        required
                                        description="Detailed description of the product"
                                        error={errors.description}
                                    >
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                                                errors.description
                                                    ? "border-red-300 dark:border-red-600"
                                                    : "border-gray-300 dark:border-gray-600"
                                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                            placeholder="Enter product description..."
                                        />
                                    </FormField>

                                    <FormField
                                        label="Price"
                                        icon={
                                            <DollarSign className="h-4 w-4 text-gray-500" />
                                        }
                                        required
                                        description="Product price in rupees"
                                        error={errors.price}
                                    >
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                errors.price
                                                    ? "border-red-300 dark:border-red-600"
                                                    : "border-gray-300 dark:border-gray-600"
                                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                            placeholder="0.00"
                                        />
                                    </FormField>
                                </div>

                                {/* Status and Condition Section */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                        Status & Condition
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            label="Condition"
                                            icon={getCurrentCondition()?.icon}
                                            description="Current condition of the product"
                                        >
                                            <select
                                                name="condition"
                                                value={formData.condition}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                {conditionOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </FormField>

                                        <FormField
                                            label="Availability Status"
                                            icon={getCurrentStatus()?.icon}
                                            description="Current availability status"
                                        >
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                {statusOptions.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>
                                    </div>
                                </div>

                                {/* Product Information */}
                                {product && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                            <Package className="h-5 w-5 text-purple-500" />
                                            Product Information
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-gray-500 dark:text-gray-400">
                                                    Product ID
                                                </label>
                                                <div className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                                                    {product._id}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-gray-500 dark:text-gray-400">
                                                    Owner
                                                </label>
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-900 dark:text-gray-100">
                                                        {product.owner
                                                            ?.username || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Last updated:{" "}
                                        {product &&
                                            new Date(
                                                product.updatedAt ||
                                                    product.createdAt
                                            ).toLocaleString()}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Update Product
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductEditModal;
