import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Users, FileText, Settings, BarChart3 } from "lucide-react";
import InstallPWA from "../components/InstallPWA";

const Dashboard = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "Admin":
                return "bg-red-100 text-red-800";
            case "Moderator":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Admin Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                    Welcome, {user?.name || "User"}
                                </span>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                                        user?.role
                                    )}`}
                                >
                                    {user?.role}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* PWA Install Prompt */}
                    <InstallPWA />

                    {/* Welcome Section */}
                    <div className="mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Welcome to Student Senior Admin Dashboard
                                </h3>
                                <div className="mt-2 max-w-xl text-sm text-gray-500">
                                    <p>
                                        Manage your platform content, users, and
                                        settings from this dashboard.
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <span className="text-sm text-gray-600">
                                        Role:{" "}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                                            user?.role
                                        )}`}
                                    >
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Users
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                1,200
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Posts
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                850
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BarChart3 className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Active Sessions
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                342
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Settings className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                System Status
                                            </dt>
                                            <dd className="text-lg font-medium text-green-600">
                                                Healthy
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Recent Activity
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Latest updates and changes in the system
                            </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            <li className="px-4 py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Users className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            New user registration
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            2 minutes ago
                                        </p>
                                    </div>
                                </div>
                            </li>
                            <li className="px-4 py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            New post published
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            5 minutes ago
                                        </p>
                                    </div>
                                </div>
                            </li>
                            <li className="px-4 py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <Settings className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            System maintenance completed
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            10 minutes ago
                                        </p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
