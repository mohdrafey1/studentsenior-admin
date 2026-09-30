import { useState, useEffect } from 'react';
import { ImageOff, Loader2, Plus, X } from 'lucide-react';
import { Button, Dialog, Field, Input, Select, Switch, Textarea } from './ui';

const CATEGORIES = [
    'Books',
    'Electronics',
    'Stationery',
    'Courses',
    'Gadgets',
    'Accessories',
    'Software',
    'Other',
];

const EMPTY = {
    name: '',
    description: '',
    price: '',
    image: '',
    buyLink: '',
    category: 'General',
    tags: [],
    isActive: true,
};

const AffiliateProductModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
    isLoading,
}) => {
    const [formData, setFormData] = useState(EMPTY);
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [previewBroken, setPreviewBroken] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                price: initialData.price || '',
                image: initialData.image || '',
                buyLink: initialData.buyLink || initialData.link || '',
                category: initialData.category || 'General',
                tags: initialData.tags || [],
                isActive:
                    initialData.isActive !== undefined
                        ? initialData.isActive
                        : true,
            });
        } else {
            setFormData(EMPTY);
        }
        setErrors({});
        setTagInput('');
        setPreviewBroken(false);
    }, [initialData, isOpen]);

    const setField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const next = {};
        if (!formData.name.trim()) next.name = 'Enter the product name';
        if (!formData.description.trim())
            next.description = 'Add a short description';
        if (formData.price === '' || Number(formData.price) < 0)
            next.price = 'Enter a price of ₹0 or more';
        if (!formData.image.trim()) next.image = 'Add an image link';
        if (!formData.buyLink.trim()) next.buyLink = 'Add the buy link';
        setErrors(next);
        if (Object.keys(next).length) return;
        onSubmit(formData);
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()],
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((tag) => tag !== tagToRemove),
        });
    };

    if (!isOpen) return null;

    // Keep a category the list doesn't know (such as the default "General") selectable.
    const categoryOptions = [
        ...(CATEGORIES.includes(formData.category) || !formData.category
            ? []
            : [formData.category]),
        ...CATEGORIES,
    ].map((cat) => ({ value: cat, label: cat }));

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={isLoading}
            size='lg'
            title={initialData ? 'Edit product' : 'Add product'}
            description={
                initialData
                    ? undefined
                    : 'Students see it with a link to buy it elsewhere.'
            }
            footer={
                <>
                    <Button onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='affiliate-product-form'
                        variant='primary'
                        disabled={isLoading}
                        icon={isLoading ? Loader2 : undefined}
                        className={isLoading ? '[&>svg]:animate-spin' : ''}
                    >
                        {isLoading
                            ? 'Saving…'
                            : initialData
                              ? 'Save changes'
                              : 'Add product'}
                    </Button>
                </>
            }
        >
            <form
                id='affiliate-product-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <Field label='Product name' required error={errors.name}>
                    <Input
                        value={formData.name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder='Engineering Physics textbook'
                    />
                </Field>

                <Field label='Description' required error={errors.description}>
                    <Textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                            setField('description', e.target.value)
                        }
                        placeholder='Why students would want it, in a line or two'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field
                        label='Price'
                        required
                        error={errors.price}
                        hint='In rupees.'
                    >
                        <Input
                            type='number'
                            min='0'
                            value={formData.price}
                            onChange={(e) => setField('price', e.target.value)}
                            placeholder='499'
                            className='font-mono'
                        />
                    </Field>
                    <Field label='Category'>
                        <Select
                            value={formData.category}
                            onChange={(e) =>
                                setField('category', e.target.value)
                            }
                            options={categoryOptions}
                        />
                    </Field>
                </div>

                <div className='flex items-start gap-3'>
                    <Field
                        label='Image link'
                        required
                        error={errors.image}
                        className='flex-1 min-w-0'
                    >
                        <Input
                            type='url'
                            value={formData.image}
                            onChange={(e) => {
                                setField('image', e.target.value);
                                setPreviewBroken(false);
                            }}
                            placeholder='https://example.com/image.jpg'
                        />
                    </Field>
                    {formData.image && (
                        <div className='mt-[25px] w-14 h-14 rounded-lg border border-line bg-sunken overflow-hidden shrink-0 flex items-center justify-center text-muted'>
                            {previewBroken ? (
                                <ImageOff
                                    className='w-5 h-5'
                                    aria-label='The image couldn’t be loaded'
                                />
                            ) : (
                                <img
                                    src={formData.image}
                                    alt='Preview'
                                    className='w-full h-full object-cover'
                                    onError={() => setPreviewBroken(true)}
                                />
                            )}
                        </div>
                    )}
                </div>

                <Field label='Buy link' required error={errors.buyLink}>
                    <Input
                        type='url'
                        value={formData.buyLink}
                        onChange={(e) => setField('buyLink', e.target.value)}
                        placeholder='https://amazon.in/…'
                    />
                </Field>

                <div className='flex flex-col gap-1.5'>
                    <div className='flex items-end gap-2'>
                        <Field
                            label='Tags'
                            hint='Press Enter to add each one.'
                            className='flex-1 min-w-0'
                        >
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleAddTag(e)
                                }
                                placeholder='first-year'
                            />
                        </Field>
                        <Button
                            iconOnly
                            icon={Plus}
                            aria-label='Add tag'
                            onClick={handleAddTag}
                            className='mb-[26px]'
                        />
                    </div>
                    {formData.tags.length > 0 && (
                        <ul className='flex flex-wrap gap-1.5'>
                            {formData.tags.map((tag, index) => (
                                <li
                                    key={index}
                                    className='inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-ground text-[12.5px] text-ink-2'
                                >
                                    #{tag}
                                    <button
                                        type='button'
                                        onClick={() => removeTag(tag)}
                                        aria-label={`Remove tag ${tag}`}
                                        className='w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-line-soft cursor-pointer'
                                    >
                                        <X
                                            className='w-3 h-3'
                                            aria-hidden='true'
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <Switch
                    checked={formData.isActive}
                    onChange={(value) => setField('isActive', value)}
                    label='Show to students'
                    description='Hidden products stay here, but students don’t see them.'
                    className='p-3 rounded-lg border border-line'
                />
            </form>
        </Dialog>
    );
};

export default AffiliateProductModal;
