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

  const hostname = window.location.hostname;
  
  // Development environment detection
  const isDev = hostname === 'localhost' || 
               hostname === '127.0.0.1' ||
               hostname.includes('localhost') ||
               hostname.includes('127.0.0.1');

  if (isDev) {
    return 'http://localhost:8000'; // Local FastAPI backend
  }

  // Production environment
  // Replace with your actual production API URL when deploying
  return 'https://api.washguard.pro';
};

const getEnvironmentInfo = () => {
  if (typeof window === 'undefined') {
    return { isDevelopment: false, isProduction: false };
  }

  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || 
                       hostname === '127.0.0.1' ||
                       hostname.includes('localhost');
  
  return {
    isDevelopment,
    isProduction: !isDevelopment
  };
};

const envInfo = getEnvironmentInfo();

export const config: AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  isDevelopment: envInfo.isDevelopment,
  isProduction: envInfo.isProduction,
  enableMockData: true, // Always enable mock data as fallback
};

// Simple function to test if API is reachable
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${config.apiBaseUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default config;