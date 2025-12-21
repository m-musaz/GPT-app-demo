import { useEffect } from 'react';
import { useOpenAI } from './useOpenAI';
import type { AuthStatusOutput } from './types';
import './main.css';

function Connected({ email, sendFollowUp }: { email?: string | null; sendFollowUp: (msg: string) => void }) {
  return (
    <div className="p-6">
      {/* Success Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Connected!</h2>
          <p className="text-sm text-text-secondary">Google Calendar is linked</p>
        </div>
      </div>

      {/* Account Info */}
      {email && (
        <div className="mb-6 p-4 bg-surface-secondary rounded-xl border border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">Signed in as</p>
              <p className="text-sm font-medium text-text-primary">{email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="space-y-3 mb-6">
        <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium mb-3">What you can do</p>
        {[
          { icon: '📅', text: 'View pending calendar invitations' },
          { icon: '✓', text: 'Accept invites with one click' },
          { icon: '✗', text: 'Decline invites you can\'t attend' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-surface-secondary/50 rounded-lg">
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm text-text-secondary">{item.text}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => sendFollowUp('Show my pending calendar invitations')}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
      >
        <span>View Pending Invites</span>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

function NotConnected({ authUrl, openExternal }: { authUrl: string; openExternal: (url: string) => void }) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Google Calendar</h2>
        <p className="text-text-secondary max-w-xs mx-auto">
          Link your Google account to manage calendar invitations directly from ChatGPT
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: '🔒', label: 'Secure' },
          { icon: '⚡', label: 'Fast' },
          { icon: '🔄', label: 'Synced' },
        ].map((item, i) => (
          <div key={i} className="text-center p-3 bg-surface-secondary rounded-xl">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs text-text-tertiary font-medium">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Google Sign In Button */}
      <button
        onClick={() => openExternal(authUrl)}
        className="w-full py-3.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 text-zinc-800 dark:text-white"
      >
        {/* Google Logo */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Privacy Note */}
      <p className="text-xs text-text-tertiary text-center mt-4">
        We only access your calendar events. Your data stays private.
      </p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-surface-secondary"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      <p className="text-text-secondary mt-4 text-sm">Checking connection...</p>
    </div>
  );
}

export default function AuthStatus() {
  const { data, theme, isLoading, error, openExternal, sendFollowUp, notifyHeight } = useOpenAI<AuthStatusOutput>();

  useEffect(() => {
    if (!isLoading) {
      notifyHeight();
    }
  }, [isLoading, data]);

  const containerClass = theme === 'dark' ? 'dark' : '';

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="min-h-[280px] bg-surface-primary rounded-xl">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <div className="min-h-[280px] bg-surface-primary rounded-xl flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-text-secondary text-center text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={containerClass}>
        <div className="min-h-[280px] bg-surface-primary rounded-xl flex items-center justify-center">
          <p className="text-text-secondary">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="bg-surface-primary rounded-xl overflow-hidden">
        {data.authenticated ? (
          <Connected email={data.email} sendFollowUp={sendFollowUp} />
        ) : (
          <NotConnected authUrl={data.authUrl || ''} openExternal={openExternal} />
        )}
      </div>
    </div>
  );
}
