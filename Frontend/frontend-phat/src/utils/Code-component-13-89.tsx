// Configuration for WashGuard Pro API client
// Following UNC Charlotte ITSC 4155 guidelines for environment management

export interface AppConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  enableMockData: boolean;
}

// Detect environment and set API URL accordingly
const getApiBaseUrl = (): string => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'http://localhost:8000'; // Server-side fallback
  }

  // Development environment detection
  const isDev = window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('localhost');

  if (isDev) {
    return 'http://localhost:8000'; // Local FastAPI backend
  }

  // Production environment
  // Replace with your actual production API URL
  return 'https://api.washguard.pro';
};

export const config: AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  isDevelopment: typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  ),
  isProduction: typeof window !== 'undefined' && (
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1'
  ),
  enableMockData: true, // Always enable mock data as fallback
};

export default config;