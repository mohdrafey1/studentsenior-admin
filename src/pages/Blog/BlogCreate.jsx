import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../../utils/api';
import useIsDark from '../../hooks/useIsDark';
import { Button, PageHeader } from '../../components/ui';
import { blogEndpoints, blogRoutes } from './blogApi';
import BlogEditorForm from './BlogEditorForm';

const CLOUD_NAME = import.meta.env.VITE_CLAUDINARY_CLOUD;
const CLOUD_PRESET = import.meta.env.VITE_CLAUDINARY_PRESET;

const CreatePost = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        banner: '',
        description: '',
        content: '# Start writing your post here...',
        tags: [],
        author: 'Sahil Verma',
        isDraft: true,
        aiSummary: [], // AI summary: [[ "Sentence 1", "Sentence 2", ... ], ...]
    });

    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');
    // The rich-text editor only reads its content when it mounts, so a
    // restored draft remounts it; otherwise the editor kept showing the
    // starter text and the first keystroke overwrote the restored body.
    const [editorKey, setEditorKey] = useState(0);
    const isDark = useIsDark();

    // Auto slug generator
    useEffect(() => {
        if (formData.title && !formData.slug) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .trim();
            setFormData((p) => ({ ...p, slug }));
        }
    }, [formData.title, formData.slug]);

    // Auto-save draft
    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('draft_post', JSON.stringify(formData));
        }, 2000);
        return () => clearTimeout(timeout);
    }, [formData]);

    // Restore saved draft safely
    useEffect(() => {
        const saved = localStorage.getItem('draft_post');
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
                                  : typeof g === 'object'
                                    ? Object.values(g)
                                    : [String(g)],
                          )
                        : [],
                }));
                setEditorKey((key) => key + 1);
                toast.success('Draft restored from this browser');
            } catch {
                toast.error('Couldn’t restore your saved draft');
            }
        }
    }, []);

    // Form validation
    const validateForm = () => {
        const e = {};
        if (!formData.slug.match(/^[a-z0-9-]+$/))
            e.slug = 'Use lowercase words joined by hyphens, like how-to-study';
        if (!formData.title.trim()) e.title = 'Add a title';
        if (!formData.banner.startsWith('https://'))
            e.banner = 'Add a banner link that starts with https://';
        if ((formData.description || '').length > 200)
            e.description = 'Keep the description to 200 characters';
        if (!formData.content.trim()) e.content = 'Write the post body';
        if (!formData.author.trim()) e.author = 'Add the author’s name';
        if ((formData.tags || []).length === 0) e.tags = 'Add at least one tag';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // Image upload to Cloudinary
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', CLOUD_PRESET);

        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                data,
            );
            setFormData((p) => ({ ...p, banner: res.data.secure_url }));
            toast.success('Image uploaded');
        } catch {
            toast.error('Couldn’t upload the image. Try again.');
        }
    };

    // AI summary generator (supports nested arrays)
    const handleGenerateSummary = async () => {
        if (!formData.content.trim())
            return toast.error('Write the post before generating a summary');

        try {
            setIsGenerating(true);
            toast.success('Generating summary…');

            const res = await api.post(blogEndpoints.aiSummary, {
                prompt: formData.content,
            });

            // Guaranteed string[][] by the response schema on the server.
            const summaries = res.data?.data?.summary ?? [];

            if (summaries.length > 0) {
                setFormData((p) => ({ ...p, aiSummary: summaries }));
                toast.success('Summary generated');
            } else toast.error('No summary came back. Try again.');
        } catch (err) {
            console.error(err);
            toast.error(
                apiErrorMessage(err, 'Couldn’t generate a summary. Try again.'),
            );
        } finally {
            setIsGenerating(false);
        }
    };

    // Submit Post
    const handleSubmit = async (isDraft) => {
        if (!validateForm()) {
            toast.error('Fix the highlighted fields first');
            return;
        }
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
            localStorage.removeItem('draft_post');
            toast.success(isDraft ? 'Draft saved' : 'Post published');
            navigate(blogRoutes.list);
        } catch (err) {
            console.error(err);
            toast.error(
                apiErrorMessage(err, 'Couldn’t save the post. Try again.'),
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Tags
    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTags = tagInput
                .split(',')
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean);
            const unique = newTags.filter(
                (t) => !(formData.tags || []).includes(t),
            );
            setFormData((p) => ({
                ...p,
                tags: [...(p.tags || []), ...unique],
            }));
            setTagInput('');
        }
    };

    const removeTag = (t) =>
        setFormData((p) => ({
            ...p,
            tags: (p.tags || []).filter((x) => x !== t),
        }));

    return (
        <div>
            <PageHeader
                title='New post'
                description='Your work is kept in this browser as you type, until you save or publish it.'
                actions={
                    <>
                        <Button
                            onClick={() => handleSubmit(true)}
                            disabled={isLoading}
                        >
                            Save draft
                        </Button>
                        <Button
                            variant='primary'
                            onClick={() => handleSubmit(false)}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving…' : 'Publish'}
                        </Button>
                    </>
                }
            />

            <BlogEditorForm
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isDark={isDark}
                editorKey={editorKey}
                tagInput={tagInput}
                setTagInput={setTagInput}
                onAddTag={handleAddTag}
                onRemoveTag={removeTag}
                onUpload={handleImageUpload}
                onGenerateSummary={handleGenerateSummary}
                isGenerating={isGenerating}
            />
        </div>
    );
};

export default CreatePost;
