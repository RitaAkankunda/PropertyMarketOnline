import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Log the API base URL on initialization (for debugging)
if (typeof window !== "undefined") {
  const initLog = `[API INIT] ${new Date().toISOString()}\nAPI Base URL: ${API_BASE_URL}`;
  console.log("%c" + initLog, "background: #1a1a1a; color: #4fc3f7; padding: 5px; font-size: 12px; font-weight: bold;");
  
  // Store in localStorage for persistence
  const logs = JSON.parse(localStorage.getItem("api_logs") || "[]");
  logs.push({ timestamp: new Date().toISOString(), type: "init", apiUrl: API_BASE_URL });
  localStorage.setItem("api_logs", JSON.stringify(logs.slice(-20))); // Keep last 20 logs
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if we're on the client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request for debugging
      const requestLog = `[API REQUEST] ${new Date().toISOString()}\n${config.method?.toUpperCase()} ${config.baseURL}${config.url}`;
      console.log("%c" + requestLog, "background: #1a1a1a; color: #81c784; padding: 3px; font-size: 11px;");
    }
    return config;
  },
  (error) => {
    if (typeof window !== "undefined") {
      const errorLog = `[API REQUEST ERROR] ${new Date().toISOString()}\n${error.message}`;
      console.error("%c" + errorLog, "background: #1a1a1a; color: #ff6b6b; padding: 3px; font-size: 11px;");
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      const htmlErrorLog = `[API HTML ERROR] ${new Date().toISOString()}\nReceived HTML instead of JSON\nAPI Base URL: ${API_BASE_URL}\nRequest URL: ${response.config.url}\nFull URL: ${response.config.baseURL}${response.config.url}`;
      console.error("%c" + htmlErrorLog, "background: #1a1a1a; color: #ff6b6b; padding: 5px; font-size: 12px; font-weight: bold;");
      
      // Store in localStorage
      if (typeof window !== "undefined") {
        const logs = JSON.parse(localStorage.getItem("api_logs") || "[]");
        logs.push({ 
          timestamp: new Date().toISOString(), 
          type: "html_error", 
          apiUrl: API_BASE_URL,
          requestUrl: response.config.url,
          fullUrl: response.config.baseURL + response.config.url
        });
        localStorage.setItem("api_logs", JSON.stringify(logs.slice(-20)));
      }
      
      return Promise.reject(new Error(`Backend server not responding correctly. Please ensure the backend is running on port 3001. Current API URL: ${API_BASE_URL}`));
    }
    return response;
  },
  (error) => {
    // Check if error response is HTML
    if (error.response?.headers['content-type']?.includes('text/html')) {
      const htmlErrorLog = `[API RESPONSE HTML ERROR] ${new Date().toISOString()}\nBackend error: Received HTML response\nAPI Base URL: ${API_BASE_URL}\nRequest URL: ${error.config?.url}`;
      console.error("%c" + htmlErrorLog, "background: #1a1a1a; color: #ff6b6b; padding: 5px; font-size: 12px; font-weight: bold;");
      error.message = `Backend server not responding correctly. Please ensure the backend is running on port 3001. Current API URL: ${API_BASE_URL}`;
    }
    
    // Network errors (backend not running)
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      const networkErrorLog = `[API NETWORK ERROR] ${new Date().toISOString()}\nCannot connect to backend\nAPI URL: ${API_BASE_URL}\nError Code: ${error.code}`;
      console.error("%c" + networkErrorLog, "background: #1a1a1a; color: #ff6b6b; padding: 5px; font-size: 12px; font-weight: bold;");
      error.message = `Cannot connect to backend server. Please ensure the backend is running on port 3001. API URL: ${API_BASE_URL}`;
    }
    
    // Log all errors persistently
    if (typeof window !== "undefined") {
      const logs = JSON.parse(localStorage.getItem("api_logs") || "[]");
      logs.push({ 
        timestamp: new Date().toISOString(), 
        type: "error", 
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        apiUrl: API_BASE_URL,
        requestUrl: error.config?.url,
        responseData: error.response?.data
      });
      localStorage.setItem("api_logs", JSON.stringify(logs.slice(-20)));
    }
    
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
