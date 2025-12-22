import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Calendar, Check, ArrowRotateCcw } from '@openai/apps-sdk-ui/components/Icon';
import { useWidget } from '../WidgetContext';
import { theme } from '../theme';
import type { PendingInvite, PendingInvitesOutput } from '../types';

interface InviteCardProps {
  invite: PendingInvite;
  onRespond: (eventId: string, response: string) => Promise<void>;
  isDark: boolean;
}

function InviteCard({ invite, onRespond, isDark }: InviteCardProps) {
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
      return new Date(time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch { return time; }
  };

  return (
    <div className={`rounded-xl border p-4 ${theme.cardInner(isDark)}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${theme.textPrimary(isDark)}`}>{invite.summary}</h3>
          <p className={`text-sm mt-1 ${theme.textPrimary(isDark)}`}>{invite.organizerName || invite.organizerEmail}</p>
        </div>
        <Badge color='success' className={`bg-green-600 text-white ${theme.textPrimary(isDark)} p-2`}>Pending</Badge>
      </div>
      
      <div className={`text-sm mb-3 ${theme.textPrimary(isDark)}`}>
        <p>📅 {formatTime(invite.startTime)}</p>
        {invite.location && <p>📍 {invite.location}</p>}
      </div>

      <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {status === 'idle' && (
          <div className="grid grid-cols-3 gap-2">
            <Button className={`rounded-xl py-4 text-white ${theme.buttonBorder(isDark)} ${theme.buttonShadow()}`} color="success" size="sm" block onClick={() => handleRespond('accepted')}>Accept</Button>
            <Button className={`rounded-xl py-4 text-white ${theme.buttonBorder(isDark)} ${theme.buttonShadow()}`} color="warning" size="sm" block onClick={() => handleRespond('tentative')}>Maybe</Button>
            <Button className={`rounded-xl py-4 text-white ${theme.buttonBorder(isDark)} ${theme.buttonShadow()}`} color="danger" size="sm" block onClick={() => handleRespond('declined')}>Decline</Button>
          </div>
        )}
        {status === 'loading' && <div className={`text-center py-2 text-sm ${theme.textPrimary(isDark)}`}>Sending...</div>}
        {(status === 'accepted' || status === 'declined' || status === 'tentative') && (
          <div className="text-center"><Badge className='p-4' color={status === 'accepted' ? 'success' : status === 'declined' ? 'danger' : 'warning'}>{status === 'accepted' ? '✓ Accepted' : status === 'declined' ? '✗ Declined' : '? Maybe'}</Badge></div>
        )}
        {status === 'error' && <div className="text-center"><Badge color="danger">Failed</Badge></div>}
      </div>
    </div>
  );
}

export function InvitesView() {
  const { isDark, invitesData, setInvitesData, callTool, setWidgetState, notifyHeight } = useWidget();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { notifyHeight(); }, [invitesData, isRefreshing, notifyHeight]);

  const handleRespond = async (eventId: string, response: string) => {
    try {
      await callTool('respond_to_invite', { event_id: eventId, response });
      // Response is shown inline in the InviteCard, no need to navigate
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
      <div className={`p-6 rounded-xl border shadow-sm ${theme.card(isDark)}`}>
        <p className={`text-center ${theme.textPrimary(isDark)}`}>No invites data</p>
        <div className="flex justify-center mt-4">
          <Button variant="outline" color="secondary" size="sm" onClick={handleBack}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  const invites = invitesData.invites || [];

  return (
    <div className={`rounded-xl border shadow-sm ${theme.card(isDark)}`}>
      {invites.length === 0 ? (
        <div className="py-12 text-center px-6">
          <div className={`size-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-green-600`}>
            <Check className="size-8 text-white" />
          </div>
          <h2 className={`text-xl font-semibold mb-2 ${theme.textPrimary(isDark)}`}>All Caught Up!</h2>
          <p className={`text-sm mb-6 ${theme.textPrimary(isDark)}`}>No pending invitations.</p>
          <div className="flex gap-2 justify-center">
            <Button className={`${theme.textSecondary(isDark)} bg-white text-black p-5 rounded-xl ${theme.buttonBorder(isDark)} ${theme.buttonShadow()}`} variant="outline" color="secondary" size="sm" onClick={handleBack}>
              ← Back
            </Button>
            <Button className={`${theme.textSecondary(isDark)} bg-white p-5 rounded-xl ${theme.buttonBorder(isDark)} ${theme.buttonShadow()}`} variant="outline" color="primary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? '↻ Refreshing...' : '↻ Refresh'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${theme.iconBg(isDark)}`}>
                <Calendar className="size-5 text-blue-500" />
              </div>
              <h1 className={`text-lg font-semibold ${theme.textPrimary(isDark)}`}>{invites.length} Pending Invites</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button className={`${theme.textPrimary(isDark)} p-2 rounded-xl ${theme.buttonBorder(isDark)} ${theme.buttonShadow()}`} variant="ghost" color="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <ArrowRotateCcw className="size-5" />
              </Button>
            </div>
          </div>
          {isRefreshing && (
            <div className={`flex items-center justify-center gap-2 py-2 mb-3 rounded-lg ${theme.surface(isDark)}`}>
              <div className={`size-4 rounded-full border-2 border-t-blue-500 animate-spin ${theme.spinner(isDark)}`} />
              <span className={`text-sm ${theme.textPrimary(isDark)}`}>Refreshing...</span>
            </div>
          )}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {invites.map((invite) => (
              <InviteCard key={invite.eventId} invite={invite} onRespond={handleRespond} isDark={isDark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

