import {
    Bot,
    Users,
    MessageSquare,
    Zap,
    Target,
    TrendingUp,
    BookOpen,
    PieChart,
    Activity,
} from 'lucide-react';

function ChatbotAnalytics({ chatbotData }) {
    if (!chatbotData) return null;

    return (
        <div className='mt-6 md:mt-8'>
            <div className='flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6'>
                <Bot className='w-6 h-6 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400' />
                <h2 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>
                    Chatbot Analytics
                </h2>
            </div>

            {/* Chatbot Overview Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8'>
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                            <p className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                Total Users
                            </p>
                            <p className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                                {chatbotData.totalUsers.toLocaleString()}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                {chatbotData.guestUsers} guests •{' '}
                                {chatbotData.registeredUsers} registered
                            </p>
                        </div>
                        <div className='p-2 md:p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0'>
                            <Users className='w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400' />
                        </div>
                    </div>
                </div>

                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                            <p className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                Total Sessions
                            </p>
                            <p className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                                {chatbotData.totalSessions.toLocaleString()}
                            </p>
                        </div>
                        <div className='p-2 md:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0'>
                            <MessageSquare className='w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400' />
                        </div>
                    </div>
                </div>

                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                            <p className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                Avg Interactions
                            </p>
                            <p className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                                {chatbotData.averageInteractionsPerSession.toFixed(
                                    1,
                                )}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                per session
                            </p>
                        </div>
                        <div className='p-2 md:p-3 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0'>
                            <Zap className='w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400' />
                        </div>
                    </div>
                </div>

                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                            <p className='text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                Resources Viewed
                            </p>
                            <p className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                                {chatbotData.resourceStats.reduce(
                                    (sum, r) => sum + r.count,
                                    0,
                                )}
                            </p>
                        </div>
                        <div className='p-2 md:p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0'>
                            <Target className='w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chatbot Detailed Metrics */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8'>
                {/* Popular Colleges */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between mb-4 md:mb-6'>
                        <h3 className='text-base md:text-xl font-semibold text-gray-900 dark:text-white'>
                            Popular Colleges
                        </h3>
                        <TrendingUp className='w-4 h-4 md:w-5 md:h-5 text-indigo-500' />
                    </div>

                    <div className='space-y-3 md:space-y-4 max-h-80 overflow-y-auto'>
                        {chatbotData.popularColleges &&
                        chatbotData.popularColleges.length > 0 ? (
                            chatbotData.popularColleges.map(
                                (college, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg'
                                    >
                                        <div className='flex items-center space-x-2 md:space-x-3 flex-1 min-w-0'>
                                            <div className='flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs md:text-sm'>
                                                {index + 1}
                                            </div>
                                            <p className='text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                {college.name}
                                            </p>
                                        </div>
                                        <span className='text-xs md:text-sm font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap ml-2'>
                                            {college.count} searches
                                        </span>
                                    </div>
                                ),
                            )
                        ) : (
                            <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-4'>
                                No college data available
                            </p>
                        )}
                    </div>
                </div>

                {/* Popular Subjects */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between mb-4 md:mb-6'>
                        <h3 className='text-base md:text-xl font-semibold text-gray-900 dark:text-white'>
                            Popular Subjects
                        </h3>
                        <BookOpen className='w-4 h-4 md:w-5 md:h-5 text-blue-500' />
                    </div>

                    <div className='space-y-3 md:space-y-4 max-h-80 overflow-y-auto'>
                        {chatbotData.popularSubjects &&
                        chatbotData.popularSubjects.length > 0 ? (
                            chatbotData.popularSubjects.map(
                                (subject, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg'
                                    >
                                        <div className='flex items-center space-x-2 md:space-x-3 flex-1 min-w-0'>
                                            <div className='flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs md:text-sm'>
                                                {index + 1}
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <p className='text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                    {subject.name}
                                                </p>
                                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                    {subject.code}
                                                </p>
                                            </div>
                                        </div>
                                        <span className='text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap ml-2'>
                                            {subject.count} searches
                                        </span>
                                    </div>
                                ),
                            )
                        ) : (
                            <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-4'>
                                No subject data available
                            </p>
                        )}
                    </div>
                </div>

                {/* Resource Types Distribution */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between mb-4 md:mb-6'>
                        <h3 className='text-base md:text-xl font-semibold text-gray-900 dark:text-white'>
                            Resource Types
                        </h3>
                        <PieChart className='w-4 h-4 md:w-5 md:h-5 text-green-500' />
                    </div>

                    <div className='space-y-3 md:space-y-4'>
                        {chatbotData.resourceStats &&
                        chatbotData.resourceStats.length > 0 ? (
                            chatbotData.resourceStats.map((resource, index) => {
                                const total = chatbotData.resourceStats.reduce(
                                    (sum, r) => sum + r.count,
                                    0,
                                );
                                const percentage =
                                    total > 0
                                        ? (
                                              (resource.count / total) *
                                              100
                                          ).toFixed(1)
                                        : 0;
                                const colors = [
                                    'from-yellow-500 to-orange-500',
                                    'from-blue-500 to-cyan-500',
                                    'from-purple-500 to-pink-500',
                                ];
                                return (
                                    <div key={index} className='space-y-2'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 capitalize'>
                                                {resource._id}
                                            </span>
                                            <span className='text-xs md:text-sm font-semibold text-gray-900 dark:text-white'>
                                                {resource.count} ({percentage}%)
                                            </span>
                                        </div>
                                        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                            <div
                                                className={`bg-gradient-to-r ${colors[index % 3]} h-2 rounded-full transition-all duration-300`}
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-4'>
                                No resource data available
                            </p>
                        )}
                    </div>
                </div>

                {/* Daily Active Users */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6'>
                    <div className='flex items-center justify-between mb-4 md:mb-6'>
                        <h3 className='text-base md:text-xl font-semibold text-gray-900 dark:text-white'>
                            Daily Active Users (Last 30 Days)
                        </h3>
                        <Activity className='w-4 h-4 md:w-5 md:h-5 text-purple-500' />
                    </div>

                    <div className='space-y-2 md:space-y-3'>
                        {chatbotData.dailyUsers &&
                        chatbotData.dailyUsers.length > 0 ? (
                            <div className='max-h-64 overflow-y-auto pr-2'>
                                {chatbotData.dailyUsers
                                    .slice(-10)
                                    .reverse()
                                    .map((day, index) => {
                                        const maxCount = Math.max(
                                            ...chatbotData.dailyUsers.map(
                                                (d) => d.count,
                                            ),
                                        );
                                        const percentage =
                                            maxCount > 0
                                                ? (
                                                      (day.count / maxCount) *
                                                      100
                                                  ).toFixed(0)
                                                : 0;
                                        return (
                                            <div
                                                key={index}
                                                className='space-y-1'
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-xs text-gray-600 dark:text-gray-400'>
                                                        {new Date(
                                                            day._id,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                    <span className='text-xs font-semibold text-gray-900 dark:text-white'>
                                                        {day.count} users
                                                    </span>
                                                </div>
                                                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                                    <div
                                                        className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300'
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-4'>
                                No daily user data available
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatbotAnalytics;
