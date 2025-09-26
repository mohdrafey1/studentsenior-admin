import React, { useState, useEffect } from "react";
import {
    X,
    Save,
    AlertTriangle,
    User,
    Type,
    FileText,
    Mail,
    Phone,
    Building,
    GraduationCap,
    Calendar,
    Briefcase,
    Loader,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const SeniorEditModal = ({ isOpen, onClose, senior, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        branch: "",
        graduationYear: "",
        currentPosition: "",
        bio: "",
        linkedinProfile: "",
        skills: "",
    });
    const [errors, setErrors] = useState({});

    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from(
        { length: 10 },
        (_, i) => currentYear - 5 + i
    );

    useEffect(() => {
        if (senior && isOpen) {
            setFormData({
                name: senior.name || "",
                email: senior.email || "",
                phoneNumber: senior.phoneNumber || "",
                branch: senior.branch || "",
                graduationYear: senior.graduationYear || "",
                currentPosition: senior.currentPosition || "",
                bio: senior.bio || "",
                linkedinProfile: senior.linkedinProfile || "",
                skills: Array.isArray(senior.skills)
                    ? senior.skills.join(", ")
                    : senior.skills || "",
            });
            setErrors({});
        }
    }, [senior, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (
            formData.phoneNumber &&
            !/^\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))
        ) {
            newErrors.phoneNumber =
                "Please enter a valid 10-digit phone number";
        }

        if (!formData.branch.trim()) {
            newErrors.branch = "Branch is required";
        }

        if (
            formData.graduationYear &&
            (isNaN(formData.graduationYear) ||
                formData.graduationYear < 2000 ||
                formData.graduationYear > currentYear + 5)
        ) {
            newErrors.graduationYear = "Please enter a valid graduation year";
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
            const updatedSenior = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                branch: formData.branch.trim(),
                graduationYear: formData.graduationYear
                    ? Number(formData.graduationYear)
                    : undefined,
                currentPosition: formData.currentPosition.trim(),
                bio: formData.bio.trim(),
                linkedinProfile: formData.linkedinProfile.trim(),
                skills: formData.skills
                    ? formData.skills
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter((skill) => skill)
                    : [],
            };

            await api.put(`/senior/edit/${senior._id}`, updatedSenior);
            toast.success("Senior profile updated successfully!");
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    "Failed to update senior profile"
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
                        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Edit Senior Profile
                                        </h3>
                                        <p className="text-sm text-purple-100">
                                            Update senior student information
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
                                        <User className="h-5 w-5 text-purple-500" />
                                        Basic Information
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            label="Full Name"
                                            icon={
                                                <Type className="h-4 w-4 text-gray-500" />
                                            }
                                            required
                                            description="Senior's full name"
                                            error={errors.name}
                                        >
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.name
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder="Enter full name..."
                                            />
                                        </FormField>

                                        <FormField
                                            label="Email Address"
                                            icon={
                                                <Mail className="h-4 w-4 text-gray-500" />
                                            }
                                            required
                                            description="Contact email address"
                                            error={errors.email}
                                        >
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.email
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder="Enter email address..."
                                            />
                                        </FormField>

                                        <FormField
                                            label="Phone Number"
                                            icon={
                                                <Phone className="h-4 w-4 text-gray-500" />
                                            }
                                            description="10-digit phone number (optional)"
                                            error={errors.phoneNumber}
                                        >
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.phoneNumber
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder="Enter phone number..."
                                            />
                                        </FormField>

                                        <FormField
                                            label="Current Position"
                                            icon={
                                                <Briefcase className="h-4 w-4 text-gray-500" />
                                            }
                                            description="Current job or position"
                                            error={errors.currentPosition}
                                        >
                                            <input
                                                type="text"
                                                name="currentPosition"
                                                value={formData.currentPosition}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="e.g., Software Engineer, Student, etc."
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Academic Information Section */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-blue-500" />
                                        Academic Information
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            label="Branch"
                                            icon={
                                                <Building className="h-4 w-4 text-gray-500" />
                                            }
                                            required
                                            description="Academic branch/department"
                                            error={errors.branch}
                                        >
                                            <input
                                                type="text"
                                                name="branch"
                                                value={formData.branch}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.branch
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder="e.g., Computer Science, Mechanical Engineering"
                                            />
                                        </FormField>

                                        <FormField
                                            label="Graduation Year"
                                            icon={
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                            }
                                            description="Year of graduation"
                                            error={errors.graduationYear}
                                        >
                                            <select
                                                name="graduationYear"
                                                value={formData.graduationYear}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.graduationYear
                                                        ? "border-red-300 dark:border-red-600"
                                                        : "border-gray-300 dark:border-gray-600"
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                            >
                                                <option value="">
                                                    Select graduation year
                                                </option>
                                                {graduationYears.map((year) => (
                                                    <option
                                                        key={year}
                                                        value={year}
                                                    >
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>
                                    </div>
                                </div>

                                {/* Additional Information Section */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-green-500" />
                                        Additional Information
                                    </h3>

                                    <div className="space-y-6">
                                        <FormField
                                            label="Bio"
                                            icon={
                                                <FileText className="h-4 w-4 text-gray-500" />
                                            }
                                            description="Brief description about the senior"
                                        >
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </FormField>

                                        <FormField
                                            label="LinkedIn Profile"
                                            icon={
                                                <User className="h-4 w-4 text-gray-500" />
                                            }
                                            description="LinkedIn profile URL"
                                        >
                                            <input
                                                type="url"
                                                name="linkedinProfile"
                                                value={formData.linkedinProfile}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </FormField>

                                        <FormField
                                            label="Skills"
                                            icon={
                                                <Building className="h-4 w-4 text-gray-500" />
                                            }
                                            description="Comma-separated list of skills"
                                        >
                                            <input
                                                type="text"
                                                name="skills"
                                                value={formData.skills}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="e.g., JavaScript, React, Node.js, Python"
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Senior Information */}
                                {senior && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                            <User className="h-5 w-5 text-purple-500" />
                                            Profile Information
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-gray-500 dark:text-gray-400">
                                                    Profile ID
                                                </label>
                                                <div className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                                                    {senior._id}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-gray-500 dark:text-gray-400">
                                                    Created By
                                                </label>
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-900 dark:text-gray-100">
                                                        {senior.owner
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
                                        {senior &&
                                            new Date(
                                                senior.updatedAt ||
                                                    senior.createdAt
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
                                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Update Profile
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

export default SeniorEditModal;
