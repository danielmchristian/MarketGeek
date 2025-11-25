// src/utils/config.ts
// Configuration for WashGuard Pro API client
// Following UNC Charlotte ITSC 4155 guidelines for environment management

/// <reference types="vite/client" />

export interface AppConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  enableMockData: boolean;
}

// API Configuration - Use the main config below instead
// export const API_BASE_URL = ... (moved to config object)

// Other configuration constants
export const APP_CONFIG = {
  name: 'MarketGeek',
  version: '1.0.0',
  environment: 'development'
};

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  TOKEN: '/token',
  PROTECTED_DATA: '/protected_data'
};

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

  // Production environment - Azure Web App deployment
  return '/api';  // Relative path for same-domain deployment
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

// Export for backward compatibility
export const API_BASE_URL = config.apiBaseUrl;

export default config;
