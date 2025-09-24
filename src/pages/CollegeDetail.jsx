import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Users,
    FileText,
    BookOpen,
    MessageSquare,
    Store,
    Briefcase,
    HelpCircle,
    Search,
    Star,
} from "lucide-react";
import Header from "../components/Header";
import api from "../utils/api";
import toast from "react-hot-toast";

// StatCard component similar to the Reports dashboard
const StatCard = ({
    title,
    value,
    icon: Icon,
    bgColor,
    textColor,
    iconColor,
    onClick,
}) => {
    return (
        <button onClick={onClick} className="block group w-full text-left">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div
                    className={`p-6 ${bgColor} bg-opacity-20 dark:bg-opacity-20`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className={`text-lg font-medium ${textColor}`}>
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                                    {value.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`p-3 rounded-lg ${bgColor} bg-opacity-60 dark:bg-opacity-40 ${iconColor}`}
                        >
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center">
                        <span>View details</span>
                        <svg
                            className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>
        </button>
    );
};

const CollegeDetail = () => {
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const [collegeData, setCollegeData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch college data and stats
    const fetchCollegeData = async () => {
        try {
            setLoading(true);

            // Fetch college data using the existing backend endpoint
            const response = await api.get(`/college-data/${collegeslug}`);
            if (response.data.success) {
                setCollegeData(response.data.data);
            } else {
                throw new Error(
                    response.data.message || "College data not found"
                );
            }
        } catch (error) {
            console.error("Error fetching college data:", error);
            if (error.response?.status === 404) {
                toast.error("College not found");
                navigate("/dashboard");
            } else if (error.response?.status !== 403) {
                toast.error("Failed to load college data");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (collegeslug) {
            fetchCollegeData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collegeslug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="flex items-center mb-6">
                            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mr-3"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                        </div>
                        <div className="mb-8">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, index) => (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                                >
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!collegeData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            College Data Not Found
                        </h2>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="text-blue-600 hover:text-blue-500"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Define the stats cards based on backend data structure
    const statsCards = [
        {
            id: "pyqs",
            title: "PYQs",
            value: collegeData.totalNewPyqs || 0,
            icon: Star,
            bgColor: "bg-yellow-100 dark:bg-yellow-900",
            textColor: "text-yellow-600 dark:text-yellow-400",
            iconColor: "text-yellow-500 dark:text-yellow-300",
            href: `/${collegeslug}/pyqs`,
        },
        {
            id: "notes",
            title: "Notes",
            value: collegeData.totalNotes || 0,
            icon: BookOpen,
            bgColor: "bg-green-100 dark:bg-green-900",
            textColor: "text-green-600 dark:text-green-400",
            iconColor: "text-green-500 dark:text-green-300",
            href: `/${collegeslug}/notes`,
        },
        {
            id: "products",
            title: "Store Products",
            value: collegeData.totalProduct || 0,
            icon: Store,
            bgColor: "bg-purple-100 dark:bg-purple-900",
            textColor: "text-purple-600 dark:text-purple-400",
            iconColor: "text-purple-500 dark:text-purple-300",
            href: `/${collegeslug}/products`,
        },
        {
            id: "seniors",
            title: "Total Seniors",
            value: collegeData.totalSeniors || 0,
            icon: Users,
            bgColor: "bg-blue-100 dark:bg-blue-900",
            textColor: "text-blue-600 dark:text-blue-400",
            iconColor: "text-blue-500 dark:text-blue-300",
            href: `/${collegeslug}/seniors`,
        },
        {
            id: "groups",
            title: "WhatsApp Groups",
            value: collegeData.totalGroups || 0,
            icon: MessageSquare,
            bgColor: "bg-indigo-100 dark:bg-indigo-900",
            textColor: "text-indigo-600 dark:text-indigo-400",
            iconColor: "text-indigo-500 dark:text-indigo-300",
            href: `/${collegeslug}/groups`,
        },
        {
            id: "opportunities",
            title: "Opportunities",
            value: collegeData.totalGiveOpportunity || 0,
            icon: Briefcase,
            bgColor: "bg-cyan-100 dark:bg-cyan-900",
            textColor: "text-cyan-600 dark:text-cyan-400",
            iconColor: "text-cyan-500 dark:text-cyan-300",
            href: `/${collegeslug}/opportunities`,
        },
        {
            id: "pyq-requests",
            title: "PYQ Requests",
            value: collegeData.totalRequestedPyqs || 0,
            icon: HelpCircle,
            bgColor: "bg-orange-100 dark:bg-orange-900",
            textColor: "text-orange-600 dark:text-orange-400",
            iconColor: "text-orange-500 dark:text-orange-300",
            href: `/${collegeslug}/pyq-requests`,
        },
        {
            id: "lost-found",
            title: "Lost & Found",
            value: collegeData.totalLostFound || 0,
            icon: Search,
            bgColor: "bg-red-100 dark:bg-red-900",
            textColor: "text-red-600 dark:text-red-400",
            iconColor: "text-red-500 dark:text-red-300",
            href: `/${collegeslug}/lost-found`,
        },
        {
            id: "videos",
            title: "Videos",
            value: collegeData.totalVideos || 0,
            icon: FileText,
            bgColor: "bg-teal-100 dark:bg-teal-900",
            textColor: "text-teal-600 dark:text-teal-400",
            iconColor: "text-teal-500 dark:text-teal-300",
            href: `/${collegeslug}/videos`,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Back Button and Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Dashboard
                    </button>
                </div>

                {/* Statistics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((stat) => (
                        <StatCard
                            key={stat.id}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            bgColor={stat.bgColor}
                            textColor={stat.textColor}
                            iconColor={stat.iconColor}
                            onClick={() => navigate(stat.href)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CollegeDetail;
