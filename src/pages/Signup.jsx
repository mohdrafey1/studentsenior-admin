import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        college: '',
        password: '',
        confirmPassword: '',
        secretCode: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.name) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const signupData = {
                email: formData.email,
                name: formData.name,
                college: formData.college,
                password: formData.password,
                secretCode: formData.secretCode || '',
            };

            await signup(signupData);
            navigate('/dashboard');
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-md w-full space-y-8'>
                <div>
                    <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
                        Create Admin Account
                    </h2>
                    <p className='mt-2 text-center text-sm text-gray-600'>
                        Sign up for admin dashboard access
                    </p>
                </div>
                <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
                    <div className='rounded-md shadow-sm space-y-4'>
                        <div>
                            <label
                                htmlFor='email'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Email Address
                            </label>
                            <input
                                id='email'
                                name='email'
                                type='email'
                                autoComplete='email'
                                required
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.email
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder='Enter your email'
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && (
                                <p className='mt-1 text-sm text-red-600'>
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor='name'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Full Name
                            </label>
                            <input
                                id='name'
                                name='name'
                                type='text'
                                autoComplete='name'
                                required
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.name
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder='Enter your full name'
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className='mt-1 text-sm text-red-600'>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor='college'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                College (Optional)
                            </label>
                            <input
                                id='college'
                                name='college'
                                type='text'
                                className='appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                                placeholder='Enter your college name'
                                value={formData.college}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='password'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Password
                            </label>
                            <div className='relative'>
                                <input
                                    id='password'
                                    name='password'
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete='new-password'
                                    required
                                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                                        errors.password
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder='Enter your password'
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type='button'
                                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className='h-4 w-4 text-gray-400' />
                                    ) : (
                                        <Eye className='h-4 w-4 text-gray-400' />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className='mt-1 text-sm text-red-600'>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor='confirmPassword'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Confirm Password
                            </label>
                            <div className='relative'>
                                <input
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete='new-password'
                                    required
                                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                                        errors.confirmPassword
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder='Confirm your password'
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type='button'
                                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className='h-4 w-4 text-gray-400' />
                                    ) : (
                                        <Eye className='h-4 w-4 text-gray-400' />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className='mt-1 text-sm text-red-600'>
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor='secretCode'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Secret Code (Optional)
                            </label>
                            <input
                                id='secretCode'
                                name='secretCode'
                                type='text'
                                className='appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                                placeholder='Enter secret code for Admin/Moderator access'
                                value={formData.secretCode}
                                onChange={handleChange}
                            />
                            <div className='mt-1 flex items-center text-sm text-gray-500'>
                                <Info className='h-4 w-4 mr-1' />
                                <span>
                                    Leave empty for Visitor access, or enter
                                    code for elevated permissions
                                </span>
                            </div>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className='rounded-md bg-red-50 p-4'>
                            <p className='text-sm text-red-800'>
                                {errors.submit}
                            </p>
                        </div>
                    )}

                    <div>
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {isLoading
                                ? 'Creating Account...'
                                : 'Create Account'}
                        </button>
                    </div>

                    <div className='text-center'>
                        <p className='text-sm text-gray-600'>
                            Already have an account?{' '}
                            <Link
                                to='/login'
                                className='font-medium text-blue-600 hover:text-blue-500'
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
