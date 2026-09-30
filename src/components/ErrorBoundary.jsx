import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button, EmptyState } from './ui';

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
                <div className='min-h-screen flex items-center justify-center px-4 py-10 bg-ground text-ink'>
                    <div className='w-full max-w-md bg-sheet border border-line rounded-xl'>
                        <EmptyState
                            icon={AlertCircle}
                            tone='error'
                            title='Something went wrong'
                            description='This page hit an unexpected error. Reload to try again. If it keeps happening, tell the team what you were doing.'
                            action={
                                <div className='flex flex-wrap items-center justify-center gap-2'>
                                    <Button
                                        variant='dark'
                                        icon={RefreshCw}
                                        onClick={this.handleReload}
                                    >
                                        Reload page
                                    </Button>
                                    <Button href='/dashboard'>
                                        Go to Home
                                    </Button>
                                </div>
                            }
                        />
                        {import.meta.env.DEV && this.state.error && (
                            <pre className='mx-6 mb-6 -mt-4 p-3 max-h-48 overflow-auto rounded-lg bg-sunken border border-line-soft font-mono text-[11.5px] leading-relaxed text-bad-ink whitespace-pre-wrap break-words'>
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
