import { LogLevel } from '@/types';

// Mock Redux state
export const mockReduxState = {
  user: {
    name: 'John Doe',
    isLoggedIn: true,
  },
  settings: {
    theme: 'dark',
    notifications: true,
  },
};

// Mock Redux actions
export const mockActions = [
  {
    type: 'user/login',
    payload: { name: 'John Doe' },
    timestamp: Date.now() - 1000,
  },
  {
    type: 'settings/updateTheme',
    payload: { theme: 'dark' },
    timestamp: Date.now() - 500,
  },
];

// Mock network requests
export const mockNetworkRequests = [
  {
    id: '1',
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    } as Record<string, string>,
    timestamp: Date.now() - 2000,
  },
  {
    id: '2',
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    } as Record<string, string>,
    body: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    timestamp: Date.now() - 1500,
  },
];

// Mock network responses
export const mockNetworkResponses = [
  {
    id: '1',
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    } as Record<string, string>,
    body: {
      users: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ],
    },
    timestamp: Date.now() - 1900,
  },
  {
    id: '2',
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      Location: '/users/3',
    } as Record<string, string>,
    body: {
      id: 3,
      name: 'John Doe',
      email: 'john@example.com',
    },
    timestamp: Date.now() - 1400,
  },
];

// Mock console logs
export const mockConsoleLogs = [
  {
    id: '1',
    level: 'info' as LogLevel,
    message: 'Application started',
    timestamp: Date.now() - 3000,
  },
  {
    id: '2',
    level: 'warn' as LogLevel,
    message: 'Deprecated API endpoint used',
    data: [{ endpoint: '/v1/users' }],
    timestamp: Date.now() - 2500,
  },
  {
    id: '3',
    level: 'error' as LogLevel,
    message: 'Failed to fetch user data',
    data: [{ userId: 123 }],
    stack: `Error: Network request failed
    at fetchUserData (/src/api/users.js:45:12)
    at loadUserProfile (/src/components/Profile.js:23:8)`,
    timestamp: Date.now() - 2000,
  },
  {
    id: '4',
    level: 'debug' as LogLevel,
    message: 'Rendering user profile',
    data: [{ userId: 123, name: 'John Doe' }],
    timestamp: Date.now() - 1500,
  },
];
