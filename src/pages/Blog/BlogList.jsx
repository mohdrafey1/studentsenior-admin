import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "../../utils/api";
import { blogEndpoints, blogRoutes } from "./blogApi";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  Search,
  Filter,
  Calendar,
  Tag,
  LayoutGrid,
  List,
  FileEdit,
  ExternalLinkIcon,
  CheckCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner";

const POSTS_PER_PAGE = 6;

const AllPosts = () => {
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get(blogEndpoints.list);
        setAllPosts(res.data.data);
        applyFilter(res.data.data);
      } catch (err) {
        toast.error(apiErrorMessage(err, "Failed to fetch posts"));
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const applyFilter = (data) => {
    let filtered = data;
    if (filter === "published") filtered = data.filter((p) => !p.isDraft);
    else if (filter === "draft") filtered = data.filter((p) => p.isDraft);
    setPosts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilter(allPosts);
  }, [filter]);

  const deletePost = async (id) => {
    try {
      await api.delete(blogEndpoints.remove(id));
      return { success: true };
    } catch (err) {
      return { success: false, error: apiErrorMessage(err, "Failed to delete post") };
    }
  };

  const handleDeletePost = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const result = await deletePost(id);
      if (result.success) {
        toast.success("Post deleted successfully");
        const updated = allPosts.filter((p) => p.slug !== id);
        setAllPosts(updated);
        applyFilter(updated);
      } else {
        toast.error(result.error);
      }
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handlePageChange = (page) => setCurrentPage(page);
  const allTags = [...new Set(allPosts.flatMap((post) => post.tags))];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            All Blog Posts
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View, edit, and manage your blog posts
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">

          {/* Create Button */}
          <Link
            to={blogRoutes.create}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Post
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder=" Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 
              bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
              focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 
              bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
              focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            {(searchTerm || selectedTag || filter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTag("");
                  setFilter("all");
                }}
                className="px-4 py-2.5 rounded-xl border border-indigo-500 text-indigo-600 
                hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:text-indigo-300 transition text-sm font-medium"
              >
                Reset
              </button>
            )}
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition ${viewMode === "grid"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition ${viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      {loading ? (
        <div className="p-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : currentPosts.length === 0 ? (
        <div className="p-10 text-center">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Posts Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try changing filters or create a new one.
          </p>
          <Link
            to={blogRoutes.create}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Post
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        // 🧱 GRID VIEW
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all">
          {currentPosts.map((post) => (
            <div
              key={post.slug}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition group"
            >
              <img
                src={post.banner}
                alt={post.title}
                className="h-40 w-full object-cover group-hover:opacity-90 transition"
              />
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span
                    className={`flex items-center px-2 py-1 text-xs rounded-full   bg-indigo-100 dark:bg-indigo-900/40 
                   ${post.isDraft
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : "bg-green-100 text-green-800 border border-green-300"}
                      `}
                  >
                    {post.isDraft ? (
                      <Clock className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {post.isDraft ? "Draft" : "Published"}
                  </span>

                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    >
                      <Tag className="w-3 h-3 mr-1" /> {tag}
                    </span>
                  ))}
                </div>

                {/* Footer with Actions */}
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-4 h-4 text-red-500" /> {post.total_likes}
                    <Eye className="w-4 h-4 text-blue-500" /> {post.total_reads}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/blog/edit/${post.slug}`}
                      className="p-1.5 text-indigo-500 hover:text-indigo-700 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                      title="Edit Post"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      target="_blank"
                      to={`https://blog.studentsenior.com/${post.slug}`}
                      className="p-1.5 text-green-500 hover:text-green-700 rounded-full hover:bg-green-50 dark:hover:bg-green-900/40"
                      title="View Post"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.slug, post.title)}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 dark:hover:bg-red-900/40"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 📋 LIST VIEW
        <div className="space-y-3 transition-all">
          {currentPosts.map((post) => (
            <div
              key={post.slug}
              className="flex flex-col sm:flex-row items-start sm:items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition p-4"
            >
              <img
                src={post.banner}
                alt={post.title}
                className="w-full sm:w-40 h-28 rounded-lg object-cover"
              />
              <div className="flex-1 sm:ml-4 mt-3 sm:mt-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`flex items-center px-2 py-1 text-xs rounded-full   bg-indigo-100 dark:bg-indigo-900/40 
                   ${post.isDraft
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : "bg-green-100 text-green-800 border border-green-300"}
                      `}
                  >
                    {post.isDraft ? (
                      <Clock className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {post.isDraft ? "Draft" : "Published"}
                  </span>

                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <Link
                  to={`/blog/edit/${post.slug}`}
                  className="p-1.5 text-indigo-500 hover:text-indigo-700 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                  title="Edit Post"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <Eye className="w-4 h-4 text-blue-500" /> {post.total_reads}

                <Link
                  to={`https://blog.studentsenior.com/${post.slug}`}
                  className="p-1.5 text-green-500 hover:text-green-700 rounded-full hover:bg-green-50 dark:hover:bg-green-900/40"
                  title="View Post"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDeletePost(post.slug, post.title)}
                  className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 dark:hover:bg-red-900/40"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredPosts.length > POSTS_PER_PAGE && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${currentPage === i + 1
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPosts;
