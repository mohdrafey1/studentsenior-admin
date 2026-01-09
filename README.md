# Student Senior Admin Dashboard

A modern, responsive Progressive Web Application (PWA) for managing the Student Senior platform. Built with React, featuring authentication, role-based access control, and offline capabilities.

## Features

- 🔐 **Secure Authentication** - JWT-based login/signup with role-based access control
- 📱 **Progressive Web App** - Installable app with offline functionality
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔄 **Real-time Status** - Online/offline indicators and connection status
- 👥 **Role Management** - Admin, Moderator, and Visitor roles with different permissions
- 🛡️ **Security Best Practices** - Protected routes, token validation, and secure API calls

## Tech Stack

### Frontend

- **React** - UI framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **Vite** - Build tool and dev server

### Backend Integration

- **Node.js/Express** - Backend API
- **MongoDB** - Database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB database
- Backend API running

### Installation

1. **Clone and navigate to the admin dashboard:**

    ```bash
    cd studentsenior-admin
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:

    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

4. **Start the development server:**

    ```bash
    npm run dev
    ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Backend Setup

Ensure the backend API is running on the specified port (5000 by default). The backend should have:

- Dashboard authentication endpoints (`/api/dashboard/auth/signup`, `/api/dashboard/auth/signin`)
- Proper CORS configuration
- JWT secret configured

## Authentication

### User Roles

1. **Visitor** - Default role with limited access
2. **Moderator** - Enhanced permissions for content management
3. **Admin** - Full system access

### Signup Process

- Users can signup with email, name, and optional college information
- Secret codes can be provided during signup for elevated roles:
    - Admin secret code grants Admin role
    - Moderator secret code grants Moderator role
    - No secret code defaults to Visitor role

### Login Process

- Email and password authentication
- JWT token stored securely in localStorage
- Automatic redirect to dashboard on successful login
- Token validation on protected routes

## PWA Features

### Installation

- Browser prompt for app installation
- Works on desktop and mobile devices
- Standalone app experience

### Offline Support

- Service worker for caching critical resources
- Offline indicator when network is unavailable
- Graceful degradation of features

### Performance

- Optimized loading with code splitting
- Efficient caching strategies
- Fast, app-like experience

## API Integration

### Authentication Endpoints

```javascript
// Signup
POST /api/dashboard/auth/signup
{
  "email": "user@example.com",
  "name": "User Name",
  "college": "College Name",
  "password": "password123",
  "secretCode": "optional-secret"
}

// Signin
POST /api/dashboard/auth/signin
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response Format

```javascript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "Admin|Moderator|Visitor"
    }
  }
}
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── InstallPWA.jsx  # PWA installation prompt
│   ├── OfflineIndicator.jsx # Network status indicator
│   └── ProtectedRoute.jsx   # Route protection wrapper
├── context/             # React context providers
│   └── AuthContext.jsx # Authentication state management
├── hooks/               # Custom React hooks
│   └── usePWA.js       # PWA-related hooks
├── pages/               # Application pages
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Login.jsx       # Login page
│   └── Signup.jsx      # Signup page
├── utils/               # Utility functions
│   └── api.js          # API client configuration
└── App.jsx             # Main application component
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration for code quality
- Consistent component structure
- Proper error handling
- Responsive design patterns

## Security

### Frontend Security

- Protected routes with authentication checks
- Secure token storage
- Input validation and sanitization
- HTTPS enforcement in production

### Backend Integration

- JWT token validation
- Role-based access control
- Secure password hashing
- API rate limiting (backend)

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Ensure production environment variables are set:

```env
VITE_API_URL=https://your-api-domain.com/api
```

### PWA Deployment

- Ensure HTTPS for PWA features
- Configure proper caching headers
- Test installation on various devices

## Troubleshooting

### Common Issues

1. **Login fails**: Check backend API URL and CORS configuration
2. **PWA not installing**: Ensure HTTPS and proper manifest.json
3. **Offline mode not working**: Verify service worker registration
4. **Token expired**: Implement token refresh or proper error handling

### Debug Mode

Enable debug mode by setting:

```env
VITE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is part of the Student Senior platform and follows the same licensing terms.

## Support

For issues and questions:

- Check existing GitHub issues
- Create new issue with detailed description
- Include browser console logs and network requests

---

Built with ❤️ for the Student Senior community
