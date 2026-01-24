import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Loader2, Mail, Lock } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
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

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='h-screen w-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'>
            {/* Cosmic Background Elements */}
            <div className='absolute inset-0 overflow-hidden'>
                {/* Stars */}
                <div className='absolute inset-0'>
                    {[...Array(100)].map((_, i) => (
                        <div
                            key={i}
                            className='absolute w-1 h-1 bg-white rounded-full animate-pulse'
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Large Planets */}
                <div className='absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full blur-sm opacity-60 animate-pulse'></div>
                <div className='absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-sm opacity-50 animate-pulse delay-1000'></div>
                <div className='absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-sm opacity-40 animate-pulse delay-500'></div>

                {/* Shooting Stars */}
                <div className='absolute top-1/4 left-1/3 w-2 h-2 bg-white rounded-full animate-ping'></div>
                <div className='absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping delay-2000'></div>
            </div>

            {/* Main Container - Horizontal Layout */}
            <div className='relative z-10 h-full w-full flex items-center justify-center px-4 sm:px-6 lg:px-8'>
                <div className='w-full max-w-6xl flex items-center justify-center gap-8 lg:gap-12'>
                    {/* Left Side - Branding */}
                    <div className='hidden lg:flex flex-1 flex-col items-center justify-center text-center animate-fade-in'>
                        <div className='mb-8'>
                            <div className='flex items-center justify-center  p-6 rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl mb-6 border border-white/20'>
                                <GraduationCap className='h-16 w-16 text-white' />
                            </div>
                            <h1 className='text-4xl lg:text-5xl font-bold text-white mb-4'>
                                SIGN IN TO YOUR
                            </h1>
                            <h1 className='text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4'>
                                ADVENTURE!
                            </h1>
                            <p className='text-xl text-white/80 mb-8'>
                                Student Senior Admin Dashboard
                            </p>
                            <div className='w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full'></div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className='w-full max-w-md lg:max-w-lg'>
                        {/* Mobile Logo */}
                        <div className='lg:hidden text-center mb-6 animate-fade-in'>
                            <div className='flex justify-center mb-4'>
                                <div className='p-3 rounded-2xl bg-white/10 backdrop-blur-md shadow-xl border border-white/20'>
                                    <GraduationCap className='h-8 w-8 text-white' />
                                </div>
                            </div>
                            <h1 className='text-2xl font-bold text-white mb-1'>
                                Student Senior
                            </h1>
                            <p className='text-sm text-white/80'>
                                Admin Dashboard
                            </p>
                        </div>

                        {/* Login Form Card - Glassmorphism */}
                        <div className='bg-white/10 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 animate-slide-up'>
                            <div className='text-center mb-6 lg:mb-8'>
                                <h2 className='text-2xl sm:text-3xl font-bold text-white mb-2'>
                                    SIGN IN
                                </h2>
                                <p className='text-sm sm:text-base text-white/80'>
                                    Sign in with email address
                                </p>
                            </div>

                            <form
                                className='space-y-4 sm:space-y-6'
                                onSubmit={handleSubmit}
                            >
                                {/* Email Field */}
                                <div className='space-y-2'>
                                    <div className='relative group'>
                                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                            <Mail className='h-5 w-5 text-white/60' />
                                        </div>
                                        <input
                                            id='email'
                                            name='email'
                                            type='email'
                                            autoComplete='email'
                                            required
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white/10 backdrop-blur-sm ${
                                                errors.email
                                                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                                    : 'border-white/20 focus:border-white/40 focus:ring-white/20'
                                            } focus:outline-none focus:ring-4 text-white placeholder-white/60`}
                                            placeholder='Yourname@gmail.com'
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-blue-500/10 transition-all duration-300 pointer-events-none'></div>
                                    </div>
                                    {errors.email && (
                                        <p className='text-xs sm:text-sm text-red-300 animate-shake'>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className='space-y-2'>
                                    <div className='relative group'>
                                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                            <Lock className='h-5 w-5 text-white/60' />
                                        </div>
                                        <input
                                            id='password'
                                            name='password'
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete='current-password'
                                            required
                                            className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-all duration-300 bg-white/10 backdrop-blur-sm ${
                                                errors.password
                                                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                                                    : 'border-white/20 focus:border-white/40 focus:ring-white/20'
                                            } focus:outline-none focus:ring-4 text-white placeholder-white/60`}
                                            placeholder='Enter your password'
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type='button'
                                            className='absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200'
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className='h-5 w-5 text-white/60 hover:text-white' />
                                            ) : (
                                                <Eye className='h-5 w-5 text-white/60 hover:text-white' />
                                            )}
                                        </button>
                                        <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-blue-500/10 transition-all duration-300 pointer-events-none'></div>
                                    </div>
                                    {errors.password && (
                                        <p className='text-xs sm:text-sm text-red-300 animate-shake'>
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Error Message */}
                                {errors.submit && (
                                    <div className='bg-red-500/20 border border-red-400/30 rounded-xl p-3 sm:p-4 animate-shake backdrop-blur-sm'>
                                        <p className='text-xs sm:text-sm text-red-200'>
                                            {errors.submit}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type='submit'
                                    disabled={isLoading}
                                    className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base'
                                >
                                    {isLoading ? (
                                        <div className='flex items-center justify-center'>
                                            <Loader2 className='h-5 w-5 animate-spin mr-2' />
                                            Signing in...
                                        </div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>

                                {/* Sign Up Link */}
                                <div className='text-center pt-3 sm:pt-4'>
                                    <p className='text-xs sm:text-sm text-white/80'>
                                        Don't have an account?{' '}
                                        <Link
                                            to='/signup'
                                            className='font-semibold text-white hover:text-purple-300 transition-colors duration-200 hover:underline'
                                        >
                                            Sign up here
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
