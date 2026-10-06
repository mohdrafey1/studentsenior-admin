import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const INTRO = [
    ['01', 'Review', 'PYQs, notes, seniors and store listings'],
    ['02', 'Settle', 'Payments, refunds and UPI redemptions'],
    ['03', 'Support', 'Users, support tickets and community'],
];

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name] || errors.submit) {
            setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Enter your email';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Enter a valid email, like name@gmail.com';
        }
        if (!formData.password) {
            newErrors.password = 'Enter your password';
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
            // Return to the page that sent them here, if any.
            navigate(location.state?.from?.pathname || '/dashboard', {
                replace: true,
            });
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = (hasError) =>
        `w-full h-[42px] px-3 rounded-[9px] border bg-sheet text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 ${
            hasError ? 'border-bad' : 'border-line-strong'
        }`;

    return (
        <div className='min-h-screen bg-ground flex'>
            <aside className='hidden lg:flex w-[46%] max-w-[680px] m-3 mr-0 p-12 rounded-2xl bg-[#1c1b18] text-[#f3f1ec] flex-col'>
                <div className='flex items-center gap-2.5'>
                    <span className='w-[30px] h-[30px] rounded-lg bg-[#f3f1ec] text-[#1c1b18] flex items-center justify-center font-serif font-bold text-lg leading-none'>
                        S
                    </span>
                    <span className='text-[15px] font-semibold'>
                        StudentSenior
                    </span>
                    <span className='font-mono text-[10px] tracking-[0.08em] px-1.5 py-[3px] rounded-[5px] bg-[#33322e] text-[#d9d5cc]'>
                        ADMIN
                    </span>
                </div>
                <div className='flex-1 flex flex-col justify-center gap-7'>
                    <h1 className='font-serif font-bold text-[48px] xl:text-[54px] leading-[1.08] tracking-[-0.8px] max-w-[520px]'>
                        Keep the library{' '}
                        <span className='italic font-normal'>honest</span>, the
                        payouts on time.
                    </h1>
                    <p className='text-base leading-relaxed text-[#bdb8ae] max-w-[460px]'>
                        The console for reviewing student uploads, settling
                        money and looking after every college on StudentSenior.
                    </p>
                    <div className='grid grid-cols-3 gap-3 max-w-[540px] pt-2'>
                        {INTRO.map(([n, title, text]) => (
                            <div
                                key={n}
                                className='flex flex-col gap-1.5 p-4 rounded-xl border border-[#36352f]'
                            >
                                <span className='font-mono text-[10.5px] tracking-[0.08em] text-[#a29d93]'>
                                    {n}
                                </span>
                                <span className='text-sm font-medium'>
                                    {title}
                                </span>
                                <span className='text-[12.5px] leading-snug text-[#a29d93]'>
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='flex items-center gap-4 text-[12.5px] text-[#a29d93]'>
                    <a
                        href='https://studentsenior.com'
                        className='text-[#d9d5cc] hover:text-white'
                    >
                        studentsenior.com
                    </a>
                    <span aria-hidden='true'>·</span>
                    <span>© {new Date().getFullYear()} StudentSenior</span>
                </div>
            </aside>

            <main className='flex-1 flex items-center justify-center px-5 py-10'>
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className='w-full max-w-[380px] flex flex-col gap-5'
                >
                    <div className='lg:hidden flex items-center gap-2.5 mb-2'>
                        <span className='w-8 h-8 rounded-lg bg-inverse text-on-inverse flex items-center justify-center font-serif font-bold text-lg leading-none'>
                            S
                        </span>
                        <span className='text-[15px] font-semibold text-ink'>
                            StudentSenior Admin
                        </span>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <h2 className='font-serif font-bold text-[30px] tracking-[-0.3px] text-ink'>
                            Sign in
                        </h2>
                        <p className='text-sm text-ink-2'>
                            Use the email your admin set up for you.
                        </p>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label
                            htmlFor='email'
                            className='text-[13px] font-medium text-ink'
                        >
                            Email
                        </label>
                        <input
                            id='email'
                            name='email'
                            type='email'
                            autoComplete='username'
                            placeholder='Yourname@gmail.com'
                            value={formData.email}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={
                                errors.email ? 'email-error' : undefined
                            }
                            className={inputClass(errors.email)}
                        />
                        {errors.email && (
                            <p
                                id='email-error'
                                className='text-[12.5px] text-bad-ink'
                            >
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label
                            htmlFor='password'
                            className='text-[13px] font-medium text-ink'
                        >
                            Password
                        </label>
                        <div className='relative'>
                            <input
                                id='password'
                                name='password'
                                type={showPassword ? 'text' : 'password'}
                                autoComplete='current-password'
                                placeholder='Enter your password'
                                value={formData.password}
                                onChange={handleChange}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={
                                    errors.password
                                        ? 'password-error'
                                        : undefined
                                }
                                className={`${inputClass(errors.password)} pr-11`}
                            />
                            <button
                                type='button'
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                className='absolute right-1 top-1 w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-muted hover:text-ink cursor-pointer'
                            >
                                {showPassword ? (
                                    <EyeOff
                                        className='w-4 h-4'
                                        aria-hidden='true'
                                    />
                                ) : (
                                    <Eye
                                        className='w-4 h-4'
                                        aria-hidden='true'
                                    />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p
                                id='password-error'
                                className='text-[12.5px] text-bad-ink'
                            >
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {errors.submit && (
                        <p
                            role='alert'
                            className='px-3.5 py-3 rounded-[10px] bg-bad-soft text-[13px] text-bad-ink'
                        >
                            {errors.submit}
                        </p>
                    )}

                    <button
                        type='submit'
                        disabled={isLoading}
                        className='flex items-center justify-center gap-2 h-11 rounded-[9px] bg-brand text-white text-[14.5px] font-medium hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
                    >
                        {isLoading ? (
                            <>
                                <Loader2
                                    className='w-4 h-4 animate-spin'
                                    aria-hidden='true'
                                />
                                Signing in…
                            </>
                        ) : (
                            <>
                                Sign in
                                <ArrowRight
                                    className='w-4 h-4'
                                    aria-hidden='true'
                                />
                            </>
                        )}
                    </button>

                    <div className='flex items-start gap-2.5 px-3.5 py-3 rounded-[10px] bg-line-soft text-[13px] leading-relaxed text-ink-2'>
                        <Lock
                            className='w-4 h-4 mt-0.5 text-muted shrink-0'
                            aria-hidden='true'
                        />
                        <span>
                            Access is limited to StudentSenior staff. No account
                            yet? Ask an existing admin to add you.
                        </span>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default Login;
