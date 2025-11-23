// src/utils/config.ts
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
  // SSR / Node fallback
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  const hostname = window.location.hostname;

  const isDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1');

  if (isDev) {
    // Local FastAPI backend
    return 'http://localhost:8000';
  }

  // Production environment
  // TODO: replace with your real deployed backend URL
  return 'https://api.washguard.pro';
};

const getEnvironmentInfo = () => {
  if (typeof window === 'undefined') {
    return { isDevelopment: false, isProduction: false };
  }

  const hostname = window.location.hostname;
  const isDevelopment =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('localhost');

  return {
    isDevelopment,
    isProduction: !isDevelopment,
  };
};

const envInfo = getEnvironmentInfo();

export const config: AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  isDevelopment: envInfo.isDevelopment,
  isProduction: envInfo.isProduction,
  // This just controls how we *handle* failures, not the UI mock arrays
  enableMockData: true,
};

export const testApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds

    const response = await fetch(`${config.apiBaseUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

export default config;
