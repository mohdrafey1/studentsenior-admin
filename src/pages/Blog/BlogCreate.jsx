import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api, { apiErrorMessage } from "../../utils/api";
import { blogEndpoints, blogRoutes } from "./blogApi";
import {
  ArrowLeft,
  Save,
  Send,
  FileEdit,
  Eye,
  Code2,
  ImagePlus,
  Tags,
  Type,
  User,
  Sparkles,
} from "lucide-react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  linkDialogPlugin,
  CreateLink,
  InsertThematicBreak,
  ListsToggle,
  tablePlugin,
  imagePlugin,
  InsertImage,
  codeBlockPlugin,
  InsertCodeBlock,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  codeMirrorPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import useIsDark from "../../hooks/useIsDark";

const CLOUD_NAME = import.meta.env.VITE_CLAUDINARY_CLOUD;
const CLOUD_PRESET = import.meta.env.VITE_CLAUDINARY_PRESET;

const CreatePost = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    banner: "",
    description: "",
    content: "# Start writing your post here...",
    tags: [],
    author: "Sahil Verma",
    isDraft: true,
    aiSummary: [], // ✅ AI Summary: [[ "Sentence 1", "Sentence 2", ... ], ...]
  });

  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const isDark = useIsDark();


  // Auto slug generator
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
      setFormData((p) => ({ ...p, slug }));
    }
  }, [formData.title, formData.slug]);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("draft_post", JSON.stringify(formData));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [formData]);

  // Restore saved draft safely
  useEffect(() => {
    const saved = localStorage.getItem("draft_post");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          aiSummary: Array.isArray(parsed.aiSummary)
            ? parsed.aiSummary.map((g) =>
              Array.isArray(g)
                ? g
                : typeof g === "object"
                  ? Object.values(g)
                  : [String(g)]
            )
            : [],
        }));
        toast.success("Draft restored successfully!");
      } catch {
        toast.error("Failed to restore draft.");
      }
    }
  }, []);

  // Form validation
  const validateForm = () => {
    const e = {};
    if (!formData.slug.match(/^[a-z0-9-]+$/))
      e.slug = "Slug must be lowercase and hyphen-separated";
    if (!formData.title.trim()) e.title = "Title is required";
    if (!formData.banner.startsWith("https://"))
      e.banner = "Banner must start with https://";
    if ((formData.description || "").length > 200)
      e.description = "Max 200 characters allowed";
    if (!formData.content.trim()) e.content = "Content required";
    if (!formData.author.trim()) e.author = "Author name required";
    if ((formData.tags || []).length === 0) e.tags = "Add at least one tag";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Image upload to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        data
      );
      setFormData((p) => ({ ...p, banner: res.data.secure_url }));
      toast.success("Image uploaded successfully!");
    } catch {
      toast.error("Image upload failed.");
    }
  };

  // ✅ Safe AI Summary Generator (supports nested array)
  const handleGenerateSummary = async () => {
    if (!formData.content.trim())
      return toast.error("Please add content before generating summary.");

    try {
      setIsGenerating(true);
      toast.success("Generating AI Summary...");

      const res = await api.post(blogEndpoints.aiSummary, {
        prompt: formData.content,
      });

      // Guaranteed string[][] by the response schema on the server.
      const summaries = res.data?.data?.summary ?? [];

      if (summaries.length > 0) {
        setFormData((p) => ({ ...p, aiSummary: summaries }));
        toast.success("AI Summary generated successfully!");
      } else toast.error("No valid summary returned.");
    } catch (err) {
      console.error(err);
      toast.error(apiErrorMessage(err, "Failed to generate summary."));
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Post
  const handleSubmit = async (isDraft) => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // aiSummary is client-side form state, not an API field. The create
      // schema rejects unknown keys, so sending it 400d the whole request --
      // which is why both Publish and Draft silently failed.
      const { aiSummary, ...post } = formData;
      await api.post(blogEndpoints.create, {
        ...post,
        isDraft,
        tags: (post.tags || []).map((t) => t.trim().toLowerCase()),
        summary: aiSummary, // stored as array-of-arrays
      });
      localStorage.removeItem("draft_post");
      toast.success(isDraft ? "Draft saved!" : "Post published!");
      navigate(blogRoutes.list);
    } catch (err) {
      console.error(err);
      toast.error(apiErrorMessage(err, "Error creating post."));
    } finally {
      setIsLoading(false);
    }
  };

  // Tags
  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTags = tagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const unique = newTags.filter((t) => !(formData.tags || []).includes(t));
      setFormData((p) => ({ ...p, tags: [...(p.tags || []), ...unique] }));
      setTagInput("");
    }
  };

  const removeTag = (t) =>
    setFormData((p) => ({
      ...p,
      tags: (p.tags || []).filter((x) => x !== t),
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="sticky top-16 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(blogRoutes.list)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">🧾 Create New Post</h1>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="flex p-4 justify-end gap-3">
        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Generating..." : "AI Summary"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium shadow"
        >
          <Save className="w-4 h-4" /> Draft
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow"
        >
          <Send className="w-4 h-4" /> Publish
        </button>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 xl:grid-cols-4 gap-6 dark:text-white text-black">
        {/* Editor Section */}
        <section className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            {["editor", "preview", "raw"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === tab
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
                  }`}
              >
                {tab === "editor" && <FileEdit className="w-4 h-4" />}
                {tab === "preview" && <Eye className="w-4 h-4" />}
                {tab === "raw" && <Code2 className="w-4 h-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* MDX Editor / Preview / Raw */}
          <div className="min-h-[60vh] dark:text-white text-black">
            {activeTab === "editor" && (
              <MDXEditor
                markdown={formData.content}
                className={`${isDark ? "dark-theme dark-editor" : ""}`}
                onChange={(c) => setFormData((p) => ({ ...p, content: c }))}
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  linkPlugin(),
                  linkDialogPlugin(),
                  quotePlugin(),
                  tablePlugin(),
                  thematicBreakPlugin(),
                  markdownShortcutPlugin(),
                  imagePlugin(),
                  codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
                  codeMirrorPlugin({
                    // Without registered languages the "Insert code block"
                    // toolbar button renders disabled, and fenced blocks in
                    // existing posts have no editor to open in.
                    codeBlockLanguages: {
                      js: "JavaScript",
                      jsx: "JSX",
                      ts: "TypeScript",
                      tsx: "TSX",
                      json: "JSON",
                      html: "HTML",
                      css: "CSS",
                      bash: "Bash",
                      python: "Python",
                      sql: "SQL",
                      yaml: "YAML",
                      txt: "Plain text",
                    },
                  }),
                  directivesPlugin({
                    directiveDescriptors: [AdmonitionDirectiveDescriptor],
                  }),
                  diffSourcePlugin({ viewMode: "rich-text" }),
                  toolbarPlugin({
                    toolbarContents: () => (
                      <DiffSourceToggleWrapper>
                        <UndoRedo />
                        <BoldItalicUnderlineToggles />
                        <BlockTypeSelect />
                        <CreateLink />
                        <InsertImage />
                        <InsertThematicBreak />
                        <ListsToggle />
                        <InsertCodeBlock />
                      </DiffSourceToggleWrapper>
                    ),
                  }),
                ]}
              />
            )}

            {activeTab === "preview" && (
              <div
                className="prose dark:prose-invert p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-black"
                >
                <ReactMarkdown skipHtml>{formData.content}</ReactMarkdown>
              </div>
            )}

            {activeTab === "raw" && (
              <textarea
                className="w-full h-[60vh] p-3 border rounded-lg font-mono text-sm dark:bg-gray-700 dark:text-white text-black"
                value={formData.content}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, content: e.target.value }))
                }
              />
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">

          {/* Meta Fields */}
          <MetaField
            icon={<FileEdit />}
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            error={errors.title}
          />
          <MetaField
            icon={<Type />}
            label="Slug"
            name="slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData((p) => ({ ...p, slug: e.target.value }))
            }
            error={errors.slug}
          />
          <MetaField
            icon={<User />}
            label="Author"
            name="author"
            value={formData.author}
            onChange={(e) =>
              setFormData((p) => ({ ...p, author: e.target.value }))
            }
            error={errors.author}
          />

          {/* Description */}
          <div>
            <label className="text-sm font-medium">📝 Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              maxLength={200}
              className="w-full mt-1 border rounded-lg p-2 text-sm dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.description || "").length}/200
            </p>
          </div>

          {/* Banner */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <ImagePlus className="w-4 h-4" /> Banner Image
            </label>
            <input
              type="text"
              name="banner"
              value={formData.banner}
              onChange={(e) =>
                setFormData((p) => ({ ...p, banner: e.target.value }))
              }
              placeholder="Paste image URL or upload below"
              className="w-full mt-1 border rounded-lg p-2 text-sm dark:bg-gray-700"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-3 text-sm w-full file:mr-3 file:py-2 file:px-4 file:rounded-md file:bg-indigo-100 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Tags className="w-4 h-4" /> Tags
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full border rounded-lg mt-1 p-2 text-sm dark:bg-gray-700"
              placeholder="Press Enter to add"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.tags || []).map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center gap-1"
                >
                  {t}
                  <button
                    onClick={() => removeTag(t)}
                    className="hover:text-red-500 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          {/* ✅ AI Summary */}
          <div className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
              🤖 AI Summary (Groups × Sentences)
            </h3>

            {formData.aiSummary.length === 0 ? (
              <p className="text-xs text-gray-500">No summary generated yet.</p>
            ) : (
              <ul className="space-y-3">
                {formData.aiSummary.map((group, groupIdx) => {
                  const safeGroup = Array.isArray(group)
                    ? group
                    : typeof group === "object"
                      ? Object.values(group)
                      : [String(group)];

                  return (
                    <li
                      key={groupIdx}
                      className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          Group {groupIdx + 1}
                        </h4>
                        <button
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              aiSummary: p.aiSummary.filter(
                                (_, i) => i !== groupIdx
                              ),
                            }))
                          }
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-1">
                        {safeGroup.map((sentence, sentIdx) => (
                          <input
                            key={sentIdx}
                            type="text"
                            value={sentence}
                            onChange={(e) => {
                              const updated = [...formData.aiSummary];
                              const grp = Array.isArray(updated[groupIdx])
                                ? [...updated[groupIdx]]
                                : [String(updated[groupIdx])];
                              grp[sentIdx] = e.target.value;
                              updated[groupIdx] = grp;
                              setFormData((p) => ({ ...p, aiSummary: updated }));
                            }}
                            className="w-full text-xs bg-white dark:bg-gray-800 rounded-md px-2 py-1 outline-none"
                          />
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </aside>
      </main>
    </div>
  );
};

// Reusable MetaField
const MetaField = ({ label, icon, name, value, onChange, error }) => (
  <div>
    <label htmlFor={name} className="text-sm font-medium flex items-center gap-2">
      {icon} {label}
    </label>
    <input
      id={name}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full border rounded-lg mt-1 p-2 text-sm dark:bg-gray-700"
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default CreatePost;
