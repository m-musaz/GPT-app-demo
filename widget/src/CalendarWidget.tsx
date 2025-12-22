import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useOpenAI } from './useOpenAI';
import type { AuthStatusOutput, PendingInvitesOutput, PendingInvite, RespondResultOutput } from './types';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Calendar, Check, X } from '@openai/apps-sdk-ui/components/Icon';
import './main.css';

// ============================================
// Custom 3D Button Component
// ============================================
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  isDark?: boolean;
}

function Button3D({ children, onClick, disabled, variant = 'primary', size = 'md', block, isDark }: ButtonProps) {
  const baseStyles = `
    relative overflow-hidden font-semibold transition-all duration-200 ease-out
    rounded-xl flex items-center justify-center gap-2
    transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
    disabled:transform-none
  `;
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: isDark
      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-400 hover:to-purple-500 border border-indigo-400/20'
      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:from-indigo-400 hover:to-purple-500 border border-white/20',
    secondary: isDark
      ? 'bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 shadow-lg shadow-black/20'
      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-lg shadow-slate-200/50',
    success: isDark
      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-400/20'
      : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 border border-white/20',
    danger: isDark
      ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 border border-rose-400/20'
      : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 border border-white/20',
    warning: isDark
      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 border border-amber-400/20'
      : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 border border-white/20',
    ghost: isDark
      ? 'bg-transparent text-slate-300 hover:bg-slate-800/60 border border-transparent hover:border-slate-700'
      : 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${block ? 'w-full' : ''} btn-shine`}
    >
      {children}
    </button>
  );
}

// ============================================
// 3D Card Component
// ============================================
interface Card3DProps {
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
  hover?: boolean;
}

function Card3D({ children, isDark, className = '', hover = true }: Card3DProps) {
  const baseStyles = isDark
    ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 border border-slate-700/50'
    : 'bg-gradient-to-br from-white via-white to-slate-50/80 border border-slate-200/80';
  
  return (
    <div className={`
      ${baseStyles}
      rounded-2xl p-6 
      shadow-elevated-lg
      ${hover ? 'card-3d' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

// ============================================
// Icon Container with 3D effect
// ============================================
function IconContainer({ children, variant, isDark, size = 'md' }: { 
  children: React.ReactNode; 
  variant: 'primary' | 'success' | 'danger' | 'warning';
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeStyles = {
    sm: 'size-10',
    md: 'size-14',
    lg: 'size-16',
  };

  const variantStyles = {
    primary: isDark
      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 shadow-indigo-500/20'
      : 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200/50 shadow-indigo-200/30',
    success: isDark
      ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/30 shadow-emerald-500/20'
      : 'bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-200/50 shadow-emerald-200/30',
    danger: isDark
      ? 'bg-gradient-to-br from-rose-500/20 to-red-500/20 border-rose-500/30 shadow-rose-500/20'
      : 'bg-gradient-to-br from-rose-100 to-red-100 border-rose-200/50 shadow-rose-200/30',
    warning: isDark
      ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-amber-500/20'
      : 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200/50 shadow-amber-200/30',
  };

  return (
    <div className={`
      ${sizeStyles[size]} 
      ${variantStyles[variant]}
      rounded-2xl flex items-center justify-center
      border shadow-lg
    `}>
      {children}
    </div>
  );
}

// ============================================
// Context for sharing data between views
// ============================================
interface WidgetContextType {
  theme: 'light' | 'dark';
  isDark: boolean;
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  openExternal: (options: { href: string }) => void;
  notifyHeight: () => void;
  setWidgetState: (state: Record<string, unknown>) => void;
  authData: AuthStatusOutput | null;
  setAuthData: (data: AuthStatusOutput | null) => void;
  invitesData: PendingInvitesOutput | null;
  setInvitesData: (data: PendingInvitesOutput | null) => void;
  respondData: RespondResultOutput | null;
  setRespondData: (data: RespondResultOutput | null) => void;
}

const WidgetContext = createContext<WidgetContextType | null>(null);

function useWidget() {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error('useWidget must be used within WidgetProvider');
  return ctx;
}

// ============================================
// Auth View (/ route)
// ============================================
function AuthView({ initialAuthData }: { initialAuthData: AuthStatusOutput | null }) {
  const { isDark, callTool, openExternal, setWidgetState, setInvitesData, notifyHeight, authData, setAuthData } = useWidget();
  const navigate = useNavigate();
  const [isPolling, setIsPolling] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);

  const currentAuth = authData || initialAuthData;
  const isAuthenticated = currentAuth?.authenticated ?? false;

  useEffect(() => { notifyHeight(); }, [isAuthenticated, isPolling, notifyHeight]);

  // Polling for auth status
  useEffect(() => {
    if (!isPolling) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const result = await callTool('check_auth_status', {}) as { structuredContent?: AuthStatusOutput };
        if (result?.structuredContent?.authenticated) {
          setAuthData(result.structuredContent);
          setWidgetState({ authenticated: true, email: result.structuredContent.email });
          setIsPolling(false);
        }
      } catch (err) {
        console.error('[Widget] Poll error:', err);
      }
    }, 3000);

    const timeout = setTimeout(() => setIsPolling(false), 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPolling, callTool, setWidgetState, setAuthData]);

  const handleConnect = () => {
    if (currentAuth?.authUrl) {
      openExternal({ href: currentAuth.authUrl });
      setIsPolling(true);
    }
  };

  const handleViewInvites = async () => {
    try {
      setIsLoadingInvites(true);
      const result = await callTool('get_pending_reservations', {}) as { structuredContent?: PendingInvitesOutput };
      if (result?.structuredContent) {
        setInvitesData(result.structuredContent);
        setWidgetState({ view: 'invites', invites: result.structuredContent });
        navigate('/invites');
      }
    } catch (err) {
      console.error('[Widget] Failed to get invites:', err);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  // Connected State
  if (isAuthenticated) {
    return (
      <Card3D isDark={isDark}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <IconContainer variant="success" isDark={isDark}>
              <Check className="size-7 text-emerald-500" />
            </IconContainer>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Connected
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Google Calendar linked
              </p>
            </div>
          </div>
          <Badge color="success">Active</Badge>
        </div>

        {currentAuth?.email && (
          <div className={`
            mb-6 p-4 rounded-xl border
            ${isDark 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-slate-50 border-slate-200/80'}
          `}>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Signed in as
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentAuth.email}
            </p>
          </div>
        )}

        <Button3D 
          variant="primary" 
          block 
          onClick={handleViewInvites} 
          disabled={isLoadingInvites}
          isDark={isDark}
          size="lg"
        >
          {isLoadingInvites ? (
            <>
              <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Calendar className="size-5" />
              View Pending Invites
            </>
          )}
        </Button3D>
      </Card3D>
    );
  }

  // Not Connected State
  return (
    <Card3D isDark={isDark}>
      <div className="flex flex-col items-center text-center">
        <div className="float">
          <IconContainer variant="primary" isDark={isDark} size="lg">
            <Calendar className="size-8 text-indigo-500" />
          </IconContainer>
        </div>
        
        <h2 className={`text-xl font-bold mt-5 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {isPolling ? 'Waiting for Sign In...' : 'Connect Google Calendar'}
        </h2>
        
        <p className={`text-sm mb-6 max-w-[300px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {isPolling 
            ? 'Complete the sign-in in the new tab. This will update automatically.'
            : 'Link your Google account to manage calendar invitations directly from ChatGPT'
          }
        </p>

        {isPolling ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className={`
              size-10 rounded-full border-3 border-t-indigo-500 animate-spin
              ${isDark ? 'border-slate-700' : 'border-slate-200'}
            `} />
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Checking every few seconds...
            </p>
          </div>
        ) : currentAuth?.authUrl ? (
          <Button3D variant="secondary" block onClick={handleConnect} isDark={isDark} size="lg">
            <svg className="size-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button3D>
        ) : (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className={`
              size-5 rounded-full border-2 border-t-indigo-500 animate-spin
              ${isDark ? 'border-slate-700' : 'border-slate-200'}
            `} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
          </div>
        )}

        <p className={`text-xs mt-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          🔒 We only access your calendar events
        </p>
      </div>
    </Card3D>
  );
}

// ============================================
// Invite Card Component
// ============================================
function InviteCard({ invite, onRespond, isDark }: { 
  invite: PendingInvite; 
  onRespond: (eventId: string, response: string) => Promise<void>; 
  isDark: boolean 
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'accepted' | 'declined' | 'tentative' | 'error'>('idle');

  const handleRespond = async (response: 'accepted' | 'declined' | 'tentative') => {
    setStatus('loading');
    try {
      await onRespond(invite.eventId, response);
      setStatus(response);
    } catch {
      setStatus('error');
    }
  };

  const formatTime = (time: string) => {
    try {
      return new Date(time).toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } catch { return time; }
  };

  return (
    <div className={`
      rounded-xl border p-4 transition-all duration-200
      ${isDark 
        ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50' 
        : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300/80'}
      shadow-sm hover:shadow-md
    `}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {invite.summary}
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {invite.organizerName || invite.organizerEmail}
          </p>
        </div>
        <Badge color="warning">Pending</Badge>
      </div>
      
      <div className={`text-sm mb-4 space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <p className="flex items-center gap-2">
          <span>📅</span> {formatTime(invite.startTime)}
        </p>
        {invite.location && (
          <p className="flex items-center gap-2">
            <span>📍</span> {invite.location}
          </p>
        )}
      </div>

      <div className={`pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200/80'}`}>
        {status === 'idle' && (
          <div className="grid grid-cols-3 gap-2">
            <Button3D variant="success" size="sm" onClick={() => handleRespond('accepted')} isDark={isDark}>
              Accept
            </Button3D>
            <Button3D variant="warning" size="sm" onClick={() => handleRespond('tentative')} isDark={isDark}>
              Maybe
            </Button3D>
            <Button3D variant="danger" size="sm" onClick={() => handleRespond('declined')} isDark={isDark}>
              Decline
            </Button3D>
          </div>
        )}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className={`size-4 rounded-full border-2 border-t-indigo-500 animate-spin ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sending...</span>
          </div>
        )}
        {(status === 'accepted' || status === 'declined' || status === 'tentative') && (
          <div className="text-center py-1">
            <Badge color={status === 'accepted' ? 'success' : status === 'declined' ? 'danger' : 'warning'}>
              {status === 'accepted' ? '✓ Accepted' : status === 'declined' ? '✗ Declined' : '? Maybe'}
            </Badge>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center py-1">
            <Badge color="danger">Failed - Try again</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Invites View (/invites route)
// ============================================
function InvitesView() {
  const { isDark, invitesData, setInvitesData, callTool, setRespondData, setWidgetState, notifyHeight } = useWidget();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { notifyHeight(); }, [invitesData, isRefreshing, notifyHeight]);

  const handleRespond = async (eventId: string, response: string) => {
    try {
      const result = await callTool('respond_to_invite', { event_id: eventId, response }) as { structuredContent?: RespondResultOutput };
      if (result?.structuredContent) {
        setRespondData(result.structuredContent);
        setWidgetState({ view: 'result', result: result.structuredContent });
        navigate('/result');
      }
    } catch (err) {
      console.error('[Widget] Failed to respond:', err);
      throw err;
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const result = await callTool('get_pending_reservations', {}) as { structuredContent?: PendingInvitesOutput };
      if (result?.structuredContent) {
        setInvitesData(result.structuredContent);
        setWidgetState({ view: 'invites', invites: result.structuredContent });
      }
    } catch (err) {
      console.error('[Widget] Failed to refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!invitesData) {
    return (
      <Card3D isDark={isDark}>
        <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No invites data</p>
        <div className="flex justify-center mt-4">
          <Button3D variant="secondary" size="sm" onClick={handleBack} isDark={isDark}>
            ← Back
          </Button3D>
        </div>
      </Card3D>
    );
  }

  const invites = invitesData.invites || [];

  return (
    <Card3D isDark={isDark} hover={false}>
      {invites.length === 0 ? (
        <div className="py-8 text-center">
          <div className="float">
            <IconContainer variant="success" isDark={isDark} size="lg">
              <Check className="size-8 text-emerald-500" />
            </IconContainer>
          </div>
          <h2 className={`text-xl font-bold mt-5 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            All Caught Up!
          </h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No pending invitations.
          </p>
          <div className="flex gap-3 justify-center">
            <Button3D variant="secondary" size="sm" onClick={handleBack} isDark={isDark}>
              ← Back
            </Button3D>
            <Button3D variant="primary" size="sm" onClick={handleRefresh} disabled={isRefreshing} isDark={isDark}>
              {isRefreshing ? '↻ Refreshing...' : '↻ Refresh'}
            </Button3D>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <IconContainer variant="primary" isDark={isDark} size="sm">
                <Calendar className="size-5 text-indigo-500" />
              </IconContainer>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pending Invites
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button3D variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} isDark={isDark}>
                {isRefreshing ? (
                  <div className={`size-4 rounded-full border-2 border-t-indigo-500 animate-spin ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                ) : (
                  '↻'
                )}
              </Button3D>
              <Badge color="success">{invites.length}</Badge>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {invites.map((invite) => (
              <InviteCard key={invite.eventId} invite={invite} onRespond={handleRespond} isDark={isDark} />
            ))}
          </div>
        </>
      )}
    </Card3D>
  );
}

// ============================================
// Result View (/result route)
// ============================================
function ResultView() {
  const { isDark, respondData, notifyHeight } = useWidget();
  const navigate = useNavigate();

  useEffect(() => { notifyHeight(); }, [respondData, notifyHeight]);

  const handleBack = () => {
    navigate('/invites');
  };

  if (!respondData) {
    return (
      <Card3D isDark={isDark}>
        <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No result data</p>
        <div className="flex justify-center mt-4">
          <Button3D variant="secondary" size="sm" onClick={handleBack} isDark={isDark}>
            ← Back
          </Button3D>
        </div>
      </Card3D>
    );
  }

  const isAccepted = respondData.response === 'accepted';
  const isDeclined = respondData.response === 'declined';
  const action = isAccepted ? 'Accepted' : isDeclined ? 'Declined' : 'Marked as Maybe';
  const badgeColor = isAccepted ? 'success' : isDeclined ? 'danger' : 'warning';
  const variant = isAccepted ? 'success' : isDeclined ? 'danger' : 'warning';
  const iconColor = isAccepted ? 'text-emerald-500' : isDeclined ? 'text-rose-500' : 'text-amber-500';

  if (!respondData.success) {
    return (
      <Card3D isDark={isDark}>
        <div className="text-center py-4">
          <IconContainer variant="danger" isDark={isDark} size="lg">
            <X className="size-8 text-rose-500" />
          </IconContainer>
          <h2 className={`text-xl font-bold mt-5 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Something Went Wrong
          </h2>
          <Badge color="danger">Failed</Badge>
          <p className={`text-sm mt-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            {respondData.error || 'Please try again.'}
          </p>
          <div className="flex justify-center mt-5">
            <Button3D variant="secondary" size="sm" onClick={handleBack} isDark={isDark}>
              ← Back to Invites
            </Button3D>
          </div>
        </div>
      </Card3D>
    );
  }

  return (
    <Card3D isDark={isDark}>
      <div className="text-center py-4">
        <div className="float">
          <IconContainer variant={variant} isDark={isDark} size="lg">
            {isDeclined ? <X className={`size-8 ${iconColor}`} /> : <Check className={`size-8 ${iconColor}`} />}
          </IconContainer>
        </div>
        <h2 className={`text-xl font-bold mt-5 mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Invitation {action}!
        </h2>
        {respondData.eventSummary && (
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4
            ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-slate-100 border border-slate-200/80'}
          `}>
            <Calendar className={`size-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {respondData.eventSummary}
            </span>
          </div>
        )}
        <div className="mb-5">
          <Badge color={badgeColor}>✓ Response Sent</Badge>
        </div>
        <Button3D variant="secondary" size="sm" onClick={handleBack} isDark={isDark}>
          ← Back to Invites
        </Button3D>
      </div>
    </Card3D>
  );
}

// ============================================
// Main Widget with Router
// ============================================
function WidgetRouter({ initialData }: { initialData: unknown }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthData, setInvitesData, setRespondData, authData } = useWidget();
  const [initialRouteSet, setInitialRouteSet] = useState(false);
  
  useEffect(() => {
    console.log('[Widget] Route changed to:', location.pathname);
  }, [location.pathname]);

  // Auto-detect data type and route accordingly on initial load
  useEffect(() => {
    if (initialRouteSet || !initialData) return;
    
    const data = initialData as Record<string, unknown>;
    console.log('[Widget] Auto-detecting data type:', Object.keys(data));
    
    // Check if it's invites data (has 'invites' array)
    if ('invites' in data && Array.isArray(data.invites)) {
      console.log('[Widget] Detected invites data, navigating to /invites');
      setInvitesData(data as unknown as PendingInvitesOutput);
      setAuthData({ authenticated: true });
      navigate('/invites', { replace: true });
      setInitialRouteSet(true);
      return;
    }
    
    // Check if it's respond result data (has 'success' and 'response')
    if ('success' in data && 'response' in data) {
      console.log('[Widget] Detected respond result data, navigating to /result');
      setRespondData(data as unknown as RespondResultOutput);
      navigate('/result', { replace: true });
      setInitialRouteSet(true);
      return;
    }
    
    // Check if auth is required (from get_pending_reservations when not authenticated)
    if ('authRequired' in data && data.authRequired === true) {
      console.log('[Widget] Detected authRequired, showing auth view');
      setAuthData({ 
        authenticated: false, 
        authUrl: data.authUrl as string | undefined 
      });
      setInitialRouteSet(true);
      return;
    }
    
    // Check if it's auth data (has 'authenticated')
    if ('authenticated' in data) {
      console.log('[Widget] Detected auth data, staying on /');
      setAuthData(data as unknown as AuthStatusOutput);
      setInitialRouteSet(true);
      return;
    }
    
    console.log('[Widget] Unknown data type, staying on current route');
    setInitialRouteSet(true);
  }, [initialData, initialRouteSet, navigate, setAuthData, setInvitesData, setRespondData]);

  // Derive initial auth data for AuthView
  const initialAuthData: AuthStatusOutput | null = (() => {
    if (!initialData) return authData;
    const data = initialData as Record<string, unknown>;
    
    if ('authRequired' in data && data.authRequired === true) {
      return { authenticated: false, authUrl: data.authUrl as string | undefined };
    }
    
    if ('authenticated' in data) {
      return initialData as AuthStatusOutput;
    }
    
    return authData;
  })();

  return (
    <Routes>
      <Route path="/" element={<AuthView initialAuthData={initialAuthData} />} />
      <Route path="/invites" element={<InvitesView />} />
      <Route path="/result" element={<ResultView />} />
    </Routes>
  );
}

export default function CalendarWidget() {
  const { data, theme: appTheme, isLoading, error, callTool, openExternal, notifyHeight, setWidgetState, openai } = useOpenAI<AuthStatusOutput>();
  const isDark = appTheme === 'dark';
  
  const [authData, setAuthData] = useState<AuthStatusOutput | null>(null);
  const [invitesData, setInvitesData] = useState<PendingInvitesOutput | null>(null);
  const [respondData, setRespondData] = useState<RespondResultOutput | null>(null);

  useEffect(() => {
    const state = openai?.widgetState as { 
      authenticated?: boolean;
      email?: string;
      view?: string;
      invites?: PendingInvitesOutput;
      result?: RespondResultOutput;
    } | null;
    
    if (state?.authenticated) {
      setAuthData({ authenticated: true, email: state.email || undefined });
    }
    if (state?.invites) setInvitesData(state.invites);
    if (state?.result) setRespondData(state.result);
  }, [openai?.widgetState]);

  const contextValue: WidgetContextType = {
    theme: appTheme,
    isDark,
    callTool,
    openExternal,
    notifyHeight,
    setWidgetState,
    authData,
    setAuthData,
    invitesData,
    setInvitesData,
    respondData,
    setRespondData,
  };

  if (isLoading) {
    return (
      <Card3D isDark={isDark}>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className={`
            size-8 rounded-full border-3 border-t-indigo-500 animate-spin
            ${isDark ? 'border-slate-700' : 'border-slate-200'}
          `} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading...
          </p>
        </div>
      </Card3D>
    );
  }

  if (error) {
    return (
      <Card3D isDark={isDark}>
        <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
      </Card3D>
    );
  }

  return (
    <WidgetContext.Provider value={contextValue}>
      <BrowserRouter>
        <WidgetRouter initialData={data} />
      </BrowserRouter>
    </WidgetContext.Provider>
  );
}
