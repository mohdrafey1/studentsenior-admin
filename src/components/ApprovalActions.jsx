import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const ApprovalActions = ({
    resourceId,
    resourceType,
    currentStatus,
    apiEndpoint,
    onStatusChange,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectError, setRejectError] = useState('');

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'success',
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || 'Confirm Action',
                message: config.message,
                variant: config.variant || 'success',
                onConfirm: () => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const handleCloseConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const handleApprove = async () => {
        const confirmed = await showConfirm({
            title: 'Approve Resource',
            message: `Are you sure you want to approve this ${resourceType}? It will become visible to all users.`,
            variant: 'success',
        });

        if (!confirmed) return;

        setIsProcessing(true);
        try {
            const updateData = {
                submissionStatus: 'approved',
                rejectionReason: '', // Clear any previous rejection reason
            };

            await api.put(apiEndpoint, updateData);
            toast.success(`${resourceType} approved successfully!`);
            onStatusChange && onStatusChange('approved');
        } catch (error) {
            console.error('Error approving resource:', error);
            toast.error(
                error.response?.data?.message ||
                    `Failed to approve ${resourceType}`,
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectClick = () => {
        setShowRejectModal(true);
        setRejectionReason('');
        setRejectError('');
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            setRejectError('Rejection reason is required');
            return;
        }

        setIsProcessing(true);
        try {
            const updateData = {
                submissionStatus: 'rejected',
                rejectionReason: rejectionReason.trim(),
            };

            await api.put(apiEndpoint, updateData);
            toast.success(`${resourceType} rejected successfully!`);
            setShowRejectModal(false);
            onStatusChange && onStatusChange('rejected');
        } catch (error) {
            console.error('Error rejecting resource:', error);
            toast.error(
                error.response?.data?.message ||
                    `Failed to reject ${resourceType}`,
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // Only show for pending resources
    if (currentStatus !== 'pending') {
        return null;
    }

    return (
        <>
            <div className='py-4 max-w-xs mx-auto border-t border-gray-100 dark:border-gray-700'>
                <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-3'>
                    Quick Actions
                </dt>
                <dd className='flex gap-2'>
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isProcessing ? (
                            <Loader className='h-4 w-4 animate-spin' />
                        ) : (
                            <CheckCircle className='h-4 w-4' />
                        )}
                        Approve
                    </button>
                    <button
                        onClick={handleRejectClick}
                        disabled={isProcessing}
                        className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <XCircle className='h-4 w-4' />
                        Reject
                    </button>
                </dd>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            {/* Rejection Reason Modal */}
            {showRejectModal && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50'>
                    <div className='flex items-center justify-center min-h-screen p-4'>
                        <div
                            className='fixed inset-0'
                            onClick={() =>
                                !isProcessing && setShowRejectModal(false)
                            }
                        ></div>

                        <div className='relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md'>
                            {/* Header */}
                            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Reject {resourceType}
                                </h3>
                                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                                    Please provide a reason for rejection
                                </p>
                            </div>

                            {/* Body */}
                            <div className='p-4'>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                    Rejection Reason{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => {
                                        setRejectionReason(e.target.value);
                                        setRejectError('');
                                    }}
                                    rows={4}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white resize-none ${
                                        rejectError
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter the reason for rejecting this submission...'
                                    disabled={isProcessing}
                                />
                                {rejectError && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {rejectError}
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700'>
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    disabled={isProcessing}
                                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={isProcessing}
                                    className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2'
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader className='h-4 w-4 animate-spin' />
                                            Rejecting...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className='h-4 w-4' />
                                            Reject
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApprovalActions;
