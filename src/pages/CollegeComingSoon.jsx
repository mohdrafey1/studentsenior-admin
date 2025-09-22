import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import {
    ArrowLeft,
    Construction,
    Users,
    FileText,
    BookOpen,
    MessageSquare,
    Store,
    Briefcase,
    HelpCircle,
    Search,
    Star,
    GraduationCap,
} from "lucide-react";

const CollegeComingSoon = () => {
    const navigate = useNavigate();
    const { collegeslug, category } = useParams();

    const getCategoryInfo = (category) => {
        switch (category) {
            case "pyqs":
                return {
                    title: "Previous Year Questions",
                    icon: <Star className="w-8 h-8" />,
                    color: "yellow",
                    description:
                        "Browse and manage PYQ collections for this college",
                };
            case "notes":
                return {
                    title: "Study Notes",
                    icon: <BookOpen className="w-8 h-8" />,
                    color: "green",
                    description:
                        "Access and organize study materials and notes",
                };
            case "products":
                return {
                    title: "Store Products",
                    icon: <Store className="w-8 h-8" />,
                    color: "purple",
                    description:
                        "Manage store products and merchandise for this college",
                };
            case "seniors":
                return {
                    title: "Senior Students",
                    icon: <Users className="w-8 h-8" />,
                    color: "blue",
                    description:
                        "Connect with and manage senior student profiles",
                };
            case "groups":
                return {
                    title: "WhatsApp Groups",
                    icon: <MessageSquare className="w-8 h-8" />,
                    color: "green",
                    description:
                        "Manage WhatsApp groups and communication channels",
                };
            case "opportunities":
                return {
                    title: "Career Opportunities",
                    icon: <Briefcase className="w-8 h-8" />,
                    color: "indigo",
                    description:
                        "View and manage job and internship opportunities",
                };
            case "pyq-requests":
                return {
                    title: "PYQ Requests",
                    icon: <HelpCircle className="w-8 h-8" />,
                    color: "orange",
                    description:
                        "Manage student requests for previous year questions",
                };
            case "lost-found":
                return {
                    title: "Lost & Found",
                    icon: <Search className="w-8 h-8" />,
                    color: "red",
                    description:
                        "Help students find lost items and report found items",
                };
            case "videos":
                return {
                    title: "Educational Videos",
                    icon: <FileText className="w-8 h-8" />,
                    color: "cyan",
                    description:
                        "Manage educational videos and learning content",
                };
            default:
                return {
                    title: "College Details",
                    icon: <GraduationCap className="w-8 h-8" />,
                    color: "gray",
                    description: "Detailed view of college statistics and data",
                };
        }
    };

    const categoryInfo = getCategoryInfo(category);

    const colorClasses = {
        yellow: "bg-yellow-600 text-yellow-100 border-yellow-500",
        green: "bg-green-600 text-green-100 border-green-500",
        purple: "bg-purple-600 text-purple-100 border-purple-500",
        blue: "bg-blue-600 text-blue-100 border-blue-500",
        indigo: "bg-indigo-600 text-indigo-100 border-indigo-500",
        orange: "bg-orange-600 text-orange-100 border-orange-500",
        red: "bg-red-600 text-red-100 border-red-500",
        cyan: "bg-cyan-600 text-cyan-100 border-cyan-500",
        gray: "bg-gray-600 text-gray-100 border-gray-500",
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="pt-6 pb-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex items-center mb-8">
                        <button
                            onClick={() => navigate(`/${collegeslug}`)}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center">
                            <div
                                className={`p-3 rounded-lg mr-4 ${
                                    colorClasses[categoryInfo.color]
                                }`}
                            >
                                {categoryInfo.icon}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {categoryInfo.title}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {categoryInfo.description}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    College:{" "}
                                    {collegeslug
                                        .replace(/-/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                            l.toUpperCase()
                                        )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <Construction className="w-24 h-24 mx-auto text-gray-400 mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Feature Coming Soon
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                We're building comprehensive{" "}
                                {categoryInfo.title.toLowerCase()} management
                                specifically for{" "}
                                {collegeslug.replace(/-/g, " ")} college. This
                                feature will help you manage and organize all
                                related data efficiently.
                            </p>
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                        Planned Features:
                                    </h3>
                                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                                        <li>• Advanced search and filtering</li>
                                        <li>
                                            • College-specific data management
                                        </li>
                                        <li>
                                            • Real-time statistics and analytics
                                        </li>
                                        <li>
                                            • Export and reporting capabilities
                                        </li>
                                        <li>
                                            • Student and admin collaboration
                                            tools
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() =>
                                            navigate(`/${collegeslug}`)
                                        }
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to College Stats
                                    </button>
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                        className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                    >
                                        Back to Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CollegeComingSoon;
