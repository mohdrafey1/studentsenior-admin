import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../../utils/api';
import useIsDark from '../../hooks/useIsDark';
import Loader from '../../components/Common/Loader';
import { Button, PageHeader, StatusBadge } from '../../components/ui';
import { blogEndpoints, blogRoutes } from './blogApi';
import BlogEditorForm from './BlogEditorForm';

const CLOUD_NAME = import.meta.env.VITE_CLAUDINARY_CLOUD;
const CLOUD_PRESET = import.meta.env.VITE_CLAUDINARY_PRESET;

const EditPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isDark = useIsDark();

    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        banner: '',
        description: '',
        content: '',
        tags: [],
        author: '',
        isDraft: true,
        aiSummary: [],
    });

    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    // Saving used to reuse isLoading, which swapped the whole editor for a
    // spinner while the request ran.
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');

    // Fetch post data
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(blogEndpoints.bySlug(id));
                const post = res.data.data;
                const formattedSummary = Array.isArray(post.summary)
                    ? post.summary.map((g) =>
                          Array.isArray(g)
                              ? g
                              : typeof g === 'object'
                                ? Object.values(g)
                                : [String(g)],
                      )
                    : [];

                setFormData({
                    slug: post.slug || '',
                    title: post.title || '',
                    banner: post.banner || '',
                    description: post.description || '',
                    content: post.content || '',
                    tags: post.tags || [],
                    author: post.author || '',
                    isDraft: post.isDraft ?? true,
                    aiSummary: formattedSummary,
                });
            } catch {
                toast.error('Couldn’t load the post');
                navigate(blogRoutes.list);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [id, navigate]);

    // Validation
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

    // Update post
    const handleUpdate = async (isDraft) => {
        if (!validateForm()) {
            toast.error('Fix the highlighted fields first');
            return;
        }
        setIsSaving(true);
        try {
            // See BlogCreate: aiSummary is form state, and the update schema
            // rejects unknown keys, so sending it 400d the request.
            const { aiSummary, ...post } = formData;
            await api.put(blogEndpoints.update(id), {
                ...post,
                isDraft,
                tags: (post.tags || []).map((t) => t.trim().toLowerCase()),
                summary: aiSummary,
            });
            toast.success(isDraft ? 'Draft saved' : 'Post updated');
            navigate(blogRoutes.list);
        } catch (err) {
            toast.error(
                apiErrorMessage(err, 'Couldn’t save the post. Try again.'),
            );
        } finally {
            setIsSaving(false);
        }
    };

    // AI Summary Generator
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
            toast.error('Couldn’t generate a summary. Try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Image Upload
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

    // Tag Handling
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

    if (isLoading) return <Loader />;

    return (
        <div>
            <PageHeader
                eyebrow='Blog post'
                badge={
                    <StatusBadge
                        status={formData.isDraft ? 'draft' : 'published'}
                    />
                }
                title='Edit post'
                description={
                    formData.isDraft
                        ? 'This post is a draft. Nobody can read it until you publish it.'
                        : 'This post is live on the blog. Saving it as a draft takes it down.'
                }
                actions={
                    <>
                        <Button
                            onClick={() => handleUpdate(true)}
                            disabled={isSaving}
                        >
                            {formData.isDraft ? 'Save draft' : 'Save as draft'}
                        </Button>
                        <Button
                            variant='primary'
                            onClick={() => handleUpdate(false)}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? 'Saving…'
                                : formData.isDraft
                                  ? 'Publish'
                                  : 'Update post'}
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

export default EditPost;
