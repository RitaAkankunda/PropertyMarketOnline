"use client";

import { useAuthStore } from "@/store/auth.store";
import { Card } from "@/components/ui";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const { user, token, isAuthenticated, isLoading } = useAuthStore();
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);
  const [authStorage, setAuthStorage] = useState<any>(null);
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('token'));
      
      const authStorageRaw = localStorage.getItem('auth-storage');
      if (authStorageRaw) {
        try {
          setAuthStorage(JSON.parse(authStorageRaw));
        } catch (e) {
          setAuthStorage({ error: 'Failed to parse', raw: authStorageRaw });
        }
      }

      const apiLogsRaw = localStorage.getItem('api_logs');
      if (apiLogsRaw) {
        try {
          setApiLogs(JSON.parse(apiLogsRaw));
        } catch (e) {
          setApiLogs([]);
        }
      }

      const loginLogsRaw = localStorage.getItem('login_logs');
      if (loginLogsRaw) {
        try {
          setLoginLogs(JSON.parse(loginLogsRaw));
        } catch (e) {
          setLoginLogs([]);
        }
      }
    }
  }, []);

  const clearAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('api_logs');
      localStorage.removeItem('login_logs');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Authentication Debug Info</h1>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All & Reload
          </button>
        </div>

        {/* Zustand Store State */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Zustand Auth Store</h2>
          <div className="space-y-2">
            <div><strong>isAuthenticated:</strong> <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>{String(isAuthenticated)}</span></div>
            <div><strong>isLoading:</strong> {String(isLoading)}</div>
            <div><strong>Has Token:</strong> <span className={token ? "text-green-600" : "text-red-600"}>{String(!!token)}</span></div>
            <div><strong>Token Preview:</strong> <code className="text-xs bg-gray-100 p-1 rounded">{token ? `${token.substring(0, 20)}...` : 'null'}</code></div>
            <div><strong>Has User:</strong> <span className={user ? "text-green-600" : "text-red-600"}>{String(!!user)}</span></div>
            {user && (
              <div className="ml-4 mt-2 p-3 bg-gray-50 rounded">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>ID:</strong> {user.id}</div>
              </div>
            )}
          </div>
        </Card>

        {/* LocalStorage Token */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Token</h2>
          <div>
            <strong>Token:</strong> 
            <code className="block text-xs bg-gray-100 p-2 rounded mt-2 break-all">
              {localStorageToken || 'null'}
            </code>
          </div>
        </Card>

        {/* LocalStorage Auth Storage */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Auth Storage (Zustand Persist)</h2>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {authStorage ? JSON.stringify(authStorage, null, 2) : 'null'}
          </pre>
        </Card>

        {/* API Logs */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">API Logs (Last {apiLogs.length})</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {apiLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet</p>
            ) : (
              apiLogs.map((log, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded text-sm border-l-4 border-blue-500">
                  <div className="font-mono text-xs text-gray-500">{log.timestamp}</div>
                  <div className="font-semibold">{log.type}</div>
                  {log.message && <div className="text-gray-700">{log.message}</div>}
                  {log.status && <div>Status: {log.status}</div>}
                  {log.requestUrl && <div className="text-xs text-gray-600">URL: {log.requestUrl}</div>}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Login Logs */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Login Logs (Last {loginLogs.length})</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {loginLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet</p>
            ) : (
              loginLogs.map((log, index) => (
                <div key={index} className={`p-3 rounded text-sm border-l-4 ${
                  log.action === 'error' ? 'bg-red-50 border-red-500' : 
                  log.action === 'attempt' ? 'bg-yellow-50 border-yellow-500' : 
                  'bg-green-50 border-green-500'
                }`}>
                  <div className="font-mono text-xs text-gray-500">{log.timestamp}</div>
                  <div className="font-semibold capitalize">{log.action}</div>
                  {log.email && <div>Email: {log.email}</div>}
                  {log.apiUrl && <div className="text-xs text-gray-600">API: {log.apiUrl}</div>}
                  {log.error && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                      {JSON.stringify(log.error, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
