import { useState, useEffect } from 'react';
import { useOpenAI } from './useOpenAI';
import type { PendingInvitesOutput, PendingInvite } from './types';
import './main.css';

function InviteCard({ invite, onRespond }: { 
  invite: PendingInvite; 
  onRespond: (eventId: string, response: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'accepted' | 'declined' | 'tentative' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleRespond = async (response: 'accepted' | 'declined' | 'tentative') => {
    setStatus('loading');
    setError(null);
    try {
      await onRespond(invite.eventId, response);
      setStatus(response);
    } catch (err: any) {
      setError(err.message || 'Failed to respond');
      setStatus('error');
    }
  };

  const organizer = invite.organizerName || invite.organizerEmail;

  // Format time nicely
  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return time;
    }
  };

  return (
    <div className="bg-surface-primary rounded-2xl border border-border-default p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary leading-tight mb-1 truncate">{invite.summary}</h3>
          <p className="text-sm text-text-secondary flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500"></span>
            {organizer}
          </p>
        </div>
      </div>
      
      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
            <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-text-secondary">{formatTime(invite.startTime)}</span>
        </div>
        
        {invite.location && (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-text-secondary truncate">{invite.location}</span>
          </div>
        )}
      </div>

      {invite.description && (
        <p className="text-sm text-text-tertiary mb-4 line-clamp-2 bg-surface-secondary/50 rounded-lg p-3">
          {invite.description}
        </p>
      )}

      {/* Actions */}
      <div className="pt-3 border-t border-border-default">
        {status === 'idle' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleRespond('accepted')}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all text-sm shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={() => handleRespond('tentative')}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-medium transition-all text-sm shadow-sm"
            >
              Maybe
            </button>
            <button
              onClick={() => handleRespond('declined')}
              className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all text-sm shadow-sm"
            >
              Decline
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center py-2.5">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="ml-2 text-text-secondary text-sm">Sending response...</span>
          </div>
        )}

        {(status === 'accepted' || status === 'declined' || status === 'tentative') && (
          <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm ${
            status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            status === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Marked as Maybe'}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">All Caught Up!</h2>
      <p className="text-text-secondary max-w-xs">
        You have no pending calendar invitations. Enjoy your free time!
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
      <p className="text-text-secondary mt-4 text-sm">Loading invitations...</p>
    </div>
  );
}

export default function PendingInvites() {
  const { data, theme, isLoading, callTool, openExternal, notifyHeight } = useOpenAI<PendingInvitesOutput>();

  useEffect(() => {
    if (!isLoading) {
      notifyHeight();
    }
  }, [isLoading, data]);

  const handleRespond = async (eventId: string, response: string) => {
    await callTool('respond_to_invite', { event_id: eventId, response });
  };

  const containerClass = theme === 'dark' ? 'dark' : '';

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="bg-surface-primary rounded-xl">
          <Loading />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={containerClass}>
        <div className="bg-surface-primary rounded-xl p-6 text-center">
          <p className="text-text-secondary">No data available</p>
        </div>
      </div>
    );
  }

  const invites = data.invites || [];

  return (
    <div className={containerClass}>
      <div className="bg-surface-primary rounded-xl">
        {invites.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">Pending Invites</h1>
                  {data.dateRange && (
                    <p className="text-xs text-text-tertiary">
                      {data.dateRange.start} — {data.dateRange.end}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-bold shadow-sm">
                {invites.length}
              </div>
            </div>

            {/* Invites List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {invites.map((invite) => (
                <InviteCard 
                  key={invite.eventId} 
                  invite={invite} 
                  onRespond={handleRespond}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
