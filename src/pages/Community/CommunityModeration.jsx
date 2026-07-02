import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MessagesSquare, Flag, Trash2, CheckCircle, Users } from 'lucide-react';

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : '';

const CommunityModeration = () => {
    const [tab, setTab] = useState('reports');
    const [groups, setGroups] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/community-chat/groups');
            if (res.data.success) setGroups(res.data.data.groups || []);
        } catch {
            toast.error('Failed to load groups');
        }
    };

    const fetchReports = async () => {
        try {
            const res = await api.get('/community-chat/reports?status=open');
            if (res.data.success) setReports(res.data.data.reports || []);
        } catch {
            toast.error('Failed to load reports');
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchGroups(), fetchReports()]).finally(() =>
            setLoading(false),
        );
    }, []);

    const deleteGroup = async (groupId) => {
        if (!window.confirm('Delete this group? Members lose access.')) return;
        try {
            await api.delete(`/community-chat/groups/${groupId}`);
            toast.success('Group deleted');
            setGroups((prev) => prev.filter((g) => g._id !== groupId));
        } catch {
            toast.error('Failed to delete group');
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            await api.delete(`/community-chat/messages/${messageId}`);
            toast.success('Message deleted');
            fetchReports();
        } catch {
            toast.error('Failed to delete message');
        }
    };

    const resolveReport = async (reportId) => {
        try {
            await api.patch(`/community-chat/reports/${reportId}/resolve`);
            toast.success('Report resolved');
            setReports((prev) => prev.filter((r) => r._id !== reportId));
        } catch {
            toast.error('Failed to resolve report');
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='pt-4 md:pt-6 pb-8 md:pb-12'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6'>
                    <div className='flex items-center gap-3'>
                        <MessagesSquare className='w-8 h-8 text-blue-600 dark:text-blue-400' />
                        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                            Community Moderation
                        </h1>
                    </div>

                    {/* Tabs */}
                    <div className='flex gap-2'>
                        <button
                            onClick={() => setTab('reports')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                                tab === 'reports'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <Flag className='w-4 h-4' /> Reports ({reports.length})
                        </button>
                        <button
                            onClick={() => setTab('groups')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                                tab === 'groups'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <Users className='w-4 h-4' /> Groups ({groups.length})
                        </button>
                    </div>

                    {loading && (
                        <p className='text-gray-500 dark:text-gray-400'>
                            Loading…
                        </p>
                    )}

                    {/* Reports tab */}
                    {tab === 'reports' && (
                        <div className='space-y-3'>
                            {reports.length === 0 && !loading ? (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No open reports. 🎉
                                </p>
                            ) : (
                                reports.map((r) => (
                                    <div
                                        key={r._id}
                                        className='bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700'
                                    >
                                        <div className='flex items-start justify-between gap-4'>
                                            <div className='min-w-0'>
                                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {r.group?.name || 'Group'} ·{' '}
                                                    {formatDate(r.createdAt)}
                                                </p>
                                                <p className='mt-1 font-medium text-gray-900 dark:text-white break-words'>
                                                    “{r.message?.content ||
                                                        '(message unavailable)'}
                                                    ”
                                                </p>
                                                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                                                    Reason: {r.reason}
                                                </p>
                                                {r.message?.deleted && (
                                                    <span className='text-xs text-gray-400'>
                                                        (message already deleted)
                                                    </span>
                                                )}
                                            </div>
                                            <div className='flex flex-col gap-2 shrink-0'>
                                                {r.message &&
                                                    !r.message.deleted && (
                                                        <button
                                                            onClick={() =>
                                                                deleteMessage(
                                                                    r.message._id,
                                                                )
                                                            }
                                                            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm'
                                                        >
                                                            <Trash2 className='w-4 h-4' />{' '}
                                                            Delete msg
                                                        </button>
                                                    )}
                                                <button
                                                    onClick={() =>
                                                        resolveReport(r._id)
                                                    }
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm'
                                                >
                                                    <CheckCircle className='w-4 h-4' />{' '}
                                                    Resolve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Groups tab */}
                    {tab === 'groups' && (
                        <div className='space-y-3'>
                            {groups.length === 0 && !loading ? (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No groups yet.
                                </p>
                            ) : (
                                groups.map((g) => (
                                    <div
                                        key={g._id}
                                        className='bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4'
                                    >
                                        <div className='min-w-0'>
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {g.name}
                                            </p>
                                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                {g.college?.name || '—'} ·{' '}
                                                {g.memberCount} members · by{' '}
                                                {g.creator?.username || '—'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteGroup(g._id)}
                                            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm shrink-0'
                                        >
                                            <Trash2 className='w-4 h-4' /> Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CommunityModeration;
