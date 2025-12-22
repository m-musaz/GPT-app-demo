import { useEffect, useState, useRef, useCallback } from 'react';
import { useOpenAI } from './useOpenAI';
import type { AuthStatusOutput } from './types';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Calendar, Check } from '@openai/apps-sdk-ui/components/Icon';
import './main.css';

// Polling constants
const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes (OAuth link expiry)

interface ConnectedProps {
  email?: string | null;
  isDark: boolean;
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

function Connected({ email, isDark, callTool }: ConnectedProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewInvites = async () => {
    try {
      setIsLoading(true);
      console.log('[Widget] Calling get_pending_reservations...');
      // Call the tool directly - ChatGPT will render the pending-invites widget
      await callTool('get_pending_reservations', {});
    } catch (err) {
      console.error('[Widget] Failed to get pending invites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If dark mode, show white widget. If light mode, show dark widget.
  return (
    <div className={`p-6 rounded-xl border shadow-sm ${isDark ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-50' : 'bg-green-900/30'}`}>
            <Check className="size-6 text-green-500" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-900' : 'text-white'}`}>Connected</h2>
            <p className={`text-sm ${isDark ? 'text-black' : 'text-zinc-400'}`}>Google Calendar linked</p>
          </div>
        </div>
        <Badge color="success">Active</Badge>
      </div>

      {email && (
        <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-gray-50 border-gray-200' : 'bg-zinc-800 border-zinc-700'}`}>
          <p className={`text-xs uppercase tracking-wide font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Signed in as</p>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-900' : 'text-white'}`}>{email}</p>
        </div>
      )}

      <Button color="primary" block onClick={handleViewInvites} disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Calendar />
            View Pending Invites
          </>
        )}
      </Button>
    </div>
  );
}

interface NotConnectedProps {
  authUrl: string;
  openExternal: (options: { href: string }) => void;
  isDark: boolean;
  onStartPolling: () => void;
  isPolling: boolean;
}

function NotConnected({ authUrl, openExternal, isDark, onStartPolling, isPolling }: NotConnectedProps) {
  const handleConnect = () => {
    console.log('[Widget] Connect clicked, authUrl:', authUrl);
    if (authUrl && authUrl.length > 0) {
      // Open Google auth in new tab
      openExternal({ href: authUrl });
      // Start polling for auth status
      onStartPolling();
    } else {
      console.error('[Widget] No auth URL available');
    }
  };

  // If dark mode, show white widget. If light mode, show dark widget.
  return (
    <div className={`p-6 rounded-xl border shadow-sm ${isDark ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'}`}>
      <div className="flex flex-col items-center text-center">
        <div className={`size-14 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-gray-100' : 'bg-zinc-800'}`}>
          <Calendar className="size-7 text-primary" />
        </div>
        
        <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-black' : 'text-white'}`}>
          {isPolling ? 'Waiting for Sign In...' : 'Connect Google Calendar'}
        </h2>
        
        <p className={`text-sm mb-6 max-w-[280px] ${isDark ? 'text-black' : 'text-zinc-400'}`}>
          {isPolling 
            ? 'Complete the sign-in in the new tab. This will update automatically.'
            : 'Link your Google account to manage calendar invitations directly from ChatGPT'
          }
        </p>

        {isPolling ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className={`size-6 rounded-full border-2 border-t-primary animate-spin ${isDark ? 'border-gray-300' : 'border-zinc-600'}`} />
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>
              Checking every few seconds...
            </p>
          </div>
        ) : authUrl && authUrl.length > 0 ? (
          <Button variant="outline" className='text-black' color="primary" block onClick={handleConnect}>
            <svg className="size-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className={`size-4 rounded-full border-2 border-t-primary animate-spin ${isDark ? 'border-gray-300' : 'border-zinc-600'}`} />
            <p className={`text-sm ${isDark ? 'text-black' : 'text-zinc-400'}`}>Loading...</p>
          </div>
        )}

        <p className={`text-xs mt-4 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
          We only access your calendar events.
        </p>
      </div>
    </div>
  );
}

function Loading({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className={`size-5 rounded-full border-2 border-t-primary animate-spin ${isDark ? 'border-gray-300' : 'border-zinc-600'}`} />
      <p className={`text-sm ${isDark ? 'text-black' : 'text-zinc-400'}`}>Checking connection...</p>
    </div>
  );
}

export default function AuthStatus() {
  const { data, theme, isLoading, error, openExternal, notifyHeight, callTool, setWidgetState, openai } = useOpenAI<AuthStatusOutput>();
  const isDark = theme === 'dark';
  
  // Local state for polling and auth data (overrides initial data when polling succeeds)
  const [isPolling, setIsPolling] = useState(false);
  const [authData, setAuthData] = useState<AuthStatusOutput | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartTimeRef = useRef<number | null>(null);

  // Use authData if available (from polling), otherwise use initial data
  const currentData = authData || data;

  // Polling function
  const pollAuthStatus = useCallback(async () => {
    try {
      console.log('[Widget] Polling auth status...');
      
      // Check if we've exceeded max polling duration
      if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > MAX_POLL_DURATION_MS) {
        console.log('[Widget] Polling timeout - stopping');
        setIsPolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }

      // Call the check_auth_status tool
      const result = await callTool('check_auth_status', {});
      console.log('[Widget] Poll result:', result);
      
      // The result should contain structuredContent with auth status
      const response = result as { structuredContent?: AuthStatusOutput };
      if (response?.structuredContent?.authenticated) {
        console.log('[Widget] User authenticated! Stopping polling.');
        setAuthData(response.structuredContent);
        setIsPolling(false);
        
        // Persist state so it survives re-renders
        setWidgetState({ authenticated: true, email: response.structuredContent.email });
        
        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('[Widget] Poll error:', err);
      // Continue polling on error
    }
  }, [callTool, setWidgetState]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    console.log('[Widget] Starting auth status polling');
    setIsPolling(true);
    pollStartTimeRef.current = Date.now();
    
    // Poll immediately, then every POLL_INTERVAL_MS
    pollAuthStatus();
    pollIntervalRef.current = setInterval(pollAuthStatus, POLL_INTERVAL_MS);
  }, [isPolling, pollAuthStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Notify height changes
  useEffect(() => {
    if (!isLoading) notifyHeight();
  }, [isLoading, currentData, isPolling, notifyHeight]);

  // Check widgetState on mount to restore polling state or auth status
  useEffect(() => {
    const widgetState = openai?.widgetState as { authenticated?: boolean; email?: string } | null;
    if (widgetState?.authenticated) {
      setAuthData({ authenticated: true, email: widgetState.email || undefined, authUrl: undefined });
    }
  }, [openai?.widgetState]);

  // If dark mode, show white widget. If light mode, show dark widget.
  if (isLoading) {
    return (
      <div className={`p-4 rounded-xl border shadow-sm ${isDark ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'}`}>
        <Loading isDark={isDark} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl border text-center shadow-sm ${isDark ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'}`}>
        <p className={isDark ? 'text-black' : 'text-zinc-400'}>{error}</p>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className={`p-6 rounded-xl border text-center shadow-sm ${isDark ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'}`}>
        <p className={isDark ? 'text-black' : 'text-zinc-400'}>No data</p>
      </div>
    );
  }

  return currentData.authenticated 
    ? <Connected email={currentData.email} callTool={callTool} isDark={isDark} /> 
    : <NotConnected 
        authUrl={currentData.authUrl || ''} 
        openExternal={openExternal} 
        isDark={isDark}
        onStartPolling={startPolling}
        isPolling={isPolling}
      />;
}
