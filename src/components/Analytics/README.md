# Analytics Components

This directory contains all the refactored components for the Analytics Dashboard.

## Components Structure

### Main Components

- **AnalyticsHeader** - Header section with time range filter, refresh, and export buttons
- **OverviewStats** - Overview statistics cards (Total Content, Total Views, Engagement Rate)
- **ContentDistribution** - Grid of content type cards with progress bars
- **EngagementMetrics** - Engagement metrics with visual bars
- **TopPerformers** - List of top performing content
- **RecentActivity** - Recent activity feed
- **GrowthTrends** - Growth trends with percentage changes
- **AnalyticsInsights** - Insights card with platform recommendations
- **ChatbotAnalytics** - Complete chatbot analytics section

### Utility Components

- **StatCard** - Reusable stat card component
- **ContentCard** - Reusable content card with progress bar

## Features

✅ Fully responsive for mobile, tablet, and desktop
✅ Dark mode support
✅ Modular and reusable components
✅ Easy to maintain and extend
✅ Consistent design system

## Mobile Responsiveness

All components are designed with mobile-first approach:

- Grid layouts adapt from 1 column on mobile to 2-4 columns on desktop
- Text sizes scale appropriately
- Buttons stack vertically on mobile
- Padding and spacing adjusted for smaller screens
- Touch-friendly targets (minimum 44x44px)

## Usage

```jsx
import Analytics from './pages/Analytics/Analytics';

// Or import individual components
import {
    AnalyticsHeader,
    OverviewStats,
    ContentDistribution,
} from './components/Analytics';
```

## Styling

All components use Tailwind CSS with:

- Responsive utilities (sm:, md:, lg:, xl:)
- Dark mode classes (dark:)
- Hover and transition effects
- Consistent color palette
