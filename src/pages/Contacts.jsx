import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
    PhoneCall,
    Search,
    ArrowLeft,
    Loader,
    Mail,
    MessageSquare,
    Calendar,
    Trash2,
} from "lucide-react";

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const contactsPerPage = 10;
    const navigate = useNavigate();

    const fetchContacts = async () => {
        try {
            setError(null);
            const response = await api.get("/stats/contact-us");
            setContacts(response.data.data || []);
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setError("Failed to load contact requests");
            toast.error("Failed to load contact requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleDelete = async (contactId) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this contact request?"
            )
        ) {
            return;
        }

        try {
            await api.delete(`/stats/contact-us/${contactId}`);
            setContacts(
                contacts.filter((contact) => contact._id !== contactId)
            );
            toast.success("Contact request deleted successfully");
        } catch (error) {
            console.error("Error deleting contact:", error);
            toast.error("Failed to delete contact request");
        }
    };

    // Filter contacts based on search
    const filteredContacts = contacts.filter(
        (contact) =>
            (contact.name?.toLowerCase() || "").includes(
                searchQuery.trim().toLowerCase()
            ) ||
            (contact.email?.toLowerCase() || "").includes(
                searchQuery.trim().toLowerCase()
            ) ||
            (contact.message?.toLowerCase() || "").includes(
                searchQuery.trim().toLowerCase()
            )
    );

    // Pagination logic
    const indexOfLastContact = currentPage * contactsPerPage;
    const indexOfFirstContact = indexOfLastContact - contactsPerPage;
    const currentContacts = filteredContacts.slice(
        indexOfFirstContact,
        indexOfLastContact
    );
    const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center space-x-2">
                        <Loader className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                            Loading contact requests...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="pt-6 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate("/reports")}
                                className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center">
                                <div className="bg-pink-600 text-white p-3 rounded-lg mr-4">
                                    <PhoneCall className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Contact Requests
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Manage and respond to user inquiries
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-pink-50 dark:bg-pink-900/30 px-6 py-3 rounded-lg">
                            <div className="text-sm text-pink-600 dark:text-pink-400">
                                Total Requests:
                            </div>
                            <div className="text-2xl font-bold text-pink-800 dark:text-pink-300">
                                {contacts.length}
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or message..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8">
                            <div className="flex items-center">
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Contacts Table */}
                    {currentContacts.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Contact Info
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Message
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {currentContacts.map((contact) => (
                                            <tr
                                                key={contact._id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {contact.name ||
                                                                "N/A"}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                            <Mail className="w-3 h-3 mr-1" />
                                                            {contact.email ||
                                                                "N/A"}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                                        {contact.message ||
                                                            "No message"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {contact.createdAt
                                                            ? new Date(
                                                                  contact.createdAt
                                                              ).toLocaleDateString()
                                                            : "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                contact._id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        currentPage - 1
                                                    )
                                                }
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        currentPage + 1
                                                    )
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing{" "}
                                                    <span className="font-medium">
                                                        {indexOfFirstContact +
                                                            1}
                                                    </span>{" "}
                                                    to{" "}
                                                    <span className="font-medium">
                                                        {Math.min(
                                                            indexOfLastContact,
                                                            filteredContacts.length
                                                        )}
                                                    </span>{" "}
                                                    of{" "}
                                                    <span className="font-medium">
                                                        {
                                                            filteredContacts.length
                                                        }
                                                    </span>{" "}
                                                    results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() =>
                                                            handlePageChange(
                                                                currentPage - 1
                                                            )
                                                        }
                                                        disabled={
                                                            currentPage === 1
                                                        }
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                                                    >
                                                        Previous
                                                    </button>
                                                    {Array.from(
                                                        { length: totalPages },
                                                        (_, i) => i + 1
                                                    ).map((page) => (
                                                        <button
                                                            key={page}
                                                            onClick={() =>
                                                                handlePageChange(
                                                                    page
                                                                )
                                                            }
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                page ===
                                                                currentPage
                                                                    ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-400"
                                                                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() =>
                                                            handlePageChange(
                                                                currentPage + 1
                                                            )
                                                        }
                                                        disabled={
                                                            currentPage ===
                                                            totalPages
                                                        }
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                                                    >
                                                        Next
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center p-12">
                            <PhoneCall className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                No Contact Requests Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                No contact requests match your current search.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Contacts;
