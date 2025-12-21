import { useEffect } from 'react';
import { useOpenAI } from './useOpenAI';
import type { RespondResultOutput } from './types';
import './main.css';

function Success({ response, message, eventSummary }: { 
  response?: string; 
  message?: string; 
  eventSummary?: string;
}) {
  const isAccepted = response === 'accepted';
  const isDeclined = response === 'declined';
  
  const gradientClass = isAccepted 
    ? 'from-green-400 to-emerald-600' 
    : isDeclined 
    ? 'from-red-400 to-rose-600' 
    : 'from-amber-400 to-orange-500';
  
  const bgClass = isAccepted 
    ? 'bg-green-50 dark:bg-green-900/20' 
    : isDeclined 
    ? 'bg-red-50 dark:bg-red-900/20' 
    : 'bg-amber-50 dark:bg-amber-900/20';
    
  const action = isAccepted ? 'Accepted' : isDeclined ? 'Declined' : 'Marked as Maybe';

  return (
    <div className={`p-6 ${bgClass} rounded-xl`}>
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 shadow-lg`}>
          {isAccepted ? (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isDeclined ? (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-text-primary mb-1">
          Invitation {action}!
        </h2>

        {/* Event Name */}
        {eventSummary && (
          <div className="mt-3 px-4 py-2 bg-white/50 dark:bg-black/20 rounded-lg">
            <p className="text-sm font-medium text-text-primary">{eventSummary}</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <p className="text-text-secondary text-sm mt-3 max-w-xs">{message}</p>
        )}

        {/* Confirmation text */}
        <p className="text-xs text-text-tertiary mt-4">
          {isAccepted 
            ? 'The organizer has been notified of your attendance.'
            : isDeclined
            ? 'The organizer has been notified that you won\'t attend.'
            : 'The organizer has been notified that you might attend.'}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error?: string }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Something Went Wrong</h2>
        <p className="text-red-600 dark:text-red-400 text-sm mt-2 max-w-xs">
          {error || 'Failed to respond to invitation. Please try again.'}
        </p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-surface-secondary"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      <p className="text-text-secondary mt-4 text-sm">Sending your response...</p>
    </div>
  );
}

export default function RespondResult() {
  const { data, theme, isLoading, notifyHeight } = useOpenAI<RespondResultOutput>();

  useEffect(() => {
    if (!isLoading) {
      notifyHeight();
    }
  }, [isLoading, data]);

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
        <div className="bg-surface-primary rounded-xl p-6 flex items-center justify-center">
          <p className="text-text-secondary">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="bg-surface-primary rounded-xl overflow-hidden">
        {data.success ? (
          <Success 
            response={data.response} 
            message={data.message} 
            eventSummary={data.eventSummary} 
          />
        ) : (
          <ErrorState error={data.error} />
        )}
      </div>
    </div>
  );
}
