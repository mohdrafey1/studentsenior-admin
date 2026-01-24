import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
                    <div className='max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700'>
                        <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6'>
                            <AlertTriangle className='w-8 h-8 text-red-600 dark:text-red-400' />
                        </div>

                        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-3'>
                            Something went wrong
                        </h2>

                        <p className='text-gray-500 dark:text-gray-400 mb-8 leading-relaxed'>
                            We encountered an unexpected error. Please try
                            reloading the page to resolve the issue.
                        </p>

                        <div className='flex flex-col gap-3'>
                            <button
                                onClick={this.handleReload}
                                className='inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]'
                            >
                                <RefreshCw className='w-4 h-4' />
                                Reload Page
                            </button>

                            {import.meta.env.DEV && this.state.error && (
                                <div className='mt-6 text-left p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-48 text-xs font-mono text-red-600 dark:text-red-400'>
                                    {this.state.error.toString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
