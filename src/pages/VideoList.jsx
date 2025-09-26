import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
    Play,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    ThumbsUp,
    ExternalLink,
} from "lucide-react";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import VideoEditModal from "../components/VideoEditModal";

const VideoList = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        variant: "danger",
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || "Confirm Action",
                message: config.message,
                variant: config.variant || "danger",
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    useEffect(() => {
        fetchVideos();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/video/${collegeslug}`);

            setVideos(response.data.data.videos);

            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch videos");
            toast.error("Failed to fetch videos");
        } finally {
            setLoading(false);
        }
    };
    const handleEdit = (video) => {
        setEditingVideo(video);
        setShowModal(true);
    };

    const handleDelete = async (video) => {
        const confirmed = await showConfirm({
            title: "Delete Video",
            message: `Are you sure you want to delete "${video.title}"? This action cannot be undone.`,
            variant: "danger",
        });

        if (confirmed) {
            try {
                await api.delete(`/video/delete/${video._id}`);
                setVideos(videos.filter((v) => v._id !== video._id));
                toast.success("Video deleted successfully");
            } catch (err) {
                toast.error(
                    err.response?.data?.message || "Failed to delete video"
                );
            }
        }
        closeConfirm();
    };

    const handleView = (video) => {
        navigate(`/${collegeslug}/videos/${video._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingVideo(null);
    };

    const handleModalSuccess = (updatedVideo) => {
        if (editingVideo) {
            // Update existing video
            setVideos((prev) =>
                prev.map((v) => (v._id === updatedVideo._id ? updatedVideo : v))
            );
        } else {
            // Add new video
            setVideos((prev) => [updatedVideo, ...prev]);
        }
        handleModalClose();
    };

    const getStatusColor = (status) => {
        const colors = {
            approved:
                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            pending:
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            rejected:
                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status) => {
        const icons = {
            approved: CheckCircle,
            pending: Clock,
            rejected: XCircle,
        };
        const Icon = icons[status] || Clock;
        return <Icon className="h-4 w-4" />;
    };

    // Get unique subjects for filter
    const subjects = [
        "all",
        ...new Set(
            videos
                ?.map((v) => v.subject?.subjectName || v.subject)
                .filter(Boolean)
        ),
    ];

    // Filter videos based on search, subject, and status
    const filteredVideos = videos.filter((video) => {
        const subjectName = video.subject?.subjectName || video.subject || "";
        const matchesSearch =
            video.title?.toLowerCase().includes(search.toLowerCase()) ||
            video.description?.toLowerCase().includes(search.toLowerCase()) ||
            subjectName.toLowerCase().includes(search.toLowerCase()) ||
            video.owner?.username?.toLowerCase().includes(search.toLowerCase());

        const matchesSubject =
            subjectFilter === "all" || subjectName === subjectFilter;
        const matchesStatus =
            statusFilter === "all" || video.submissionStatus === statusFilter;

        return matchesSearch && matchesSubject && matchesStatus;
    });

    // Pagination
    const totalItems = filteredVideos.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentVideos = filteredVideos.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Loading videos...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
                        <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
                            Error Loading Videos
                        </div>
                        <p className="text-red-500 dark:text-red-300 mb-4">
                            {error}
                        </p>
                        <button
                            onClick={fetchVideos}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                                    <Play className="h-8 w-8 text-white" />
                                </div>
                                Educational Videos
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Manage educational video content for this
                                college
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <Play className="h-4 w-4" />
                            <span>Add Video</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search by title, subject, creator..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={subjectFilter}
                                onChange={(e) => {
                                    setSubjectFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                {subjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject === "all"
                                            ? "All Subjects"
                                            : subject}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="all">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    Total: {videos.length}
                                </span>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    Showing: {currentVideos.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Videos Grid */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {currentVideos.length === 0 ? (
                        <div className="p-12 text-center">
                            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No videos found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {search ||
                                subjectFilter !== "all" ||
                                statusFilter !== "all"
                                    ? "Try adjusting your search criteria"
                                    : "No videos have been uploaded yet"}
                            </p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Upload First Video
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {currentVideos.map((video) => (
                                <div
                                    key={video._id}
                                    className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => handleView(video)}
                                >
                                    {/* Video Thumbnail */}
                                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-600">
                                        {video.thumbnailUrl ? (
                                            <img
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play className="h-12 w-12 text-gray-400" />
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className="absolute top-2 left-2">
                                            <span
                                                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    video.submissionStatus
                                                )}`}
                                            >
                                                {getStatusIcon(
                                                    video.submissionStatus
                                                )}
                                                <span className="capitalize">
                                                    {video.submissionStatus}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Video Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                                            {video.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                            {video.description}
                                        </p>

                                        {/* Video Meta */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(
                                                        video.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Subject and Creator */}
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-1">
                                                <BookOpen className="h-3 w-3 text-blue-500" />
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                    {video.subject
                                                        ?.subjectName ||
                                                        video.subject}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <User className="h-3 w-3 text-gray-400" />
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {video.owner.username}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <div className="flex space-x-1">
                                                {video.videoUrl && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(
                                                                video.videoUrl,
                                                                "_blank"
                                                            );
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Watch Video"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(video);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                                    title="Edit Video"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(video);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete Video"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            totalItems={totalItems}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <VideoEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                video={editingVideo}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default VideoList;
