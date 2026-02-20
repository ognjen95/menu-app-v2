import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Radio, Wifi, RefreshCw, WifiOff, X } from 'lucide-react'
import React from 'react'

const LiveAlert = ({
  liveEnabled,
  isLive,
  isReconnecting,
  realtimeStatus,
  t,
  reconnectAttempts,
  maxReconnectAttempts,
  audioUnlocked,
  soundEnabled,
  setReconnectAttempts,
  reconnect,
  handleLiveToggle,
  setLiveAlertDismissed
}: {
  liveEnabled: boolean
  isLive: boolean
  isReconnecting: boolean
  realtimeStatus: string
  t: (key: string) => string,
  reconnectAttempts: number,
  maxReconnectAttempts: number,
  setReconnectAttempts: (attempts: number) => void,
  reconnect: () => void,
  handleLiveToggle: () => void,
  setLiveAlertDismissed: (dismissed: boolean) => void,
  audioUnlocked: boolean
  soundEnabled: boolean
}) => {
  return (
    <Alert
      variant={
        !liveEnabled ? 'warning'
          : isLive ? 'success'
            : (realtimeStatus === 'connecting' || isReconnecting) ? 'warning'
              : realtimeStatus === 'error' ? 'destructive'
                : 'muted'
      }
      className="hidden md:flex items-center justify-between animate-slide-up"
    >
      <div className="flex items-center gap-3">
        {!liveEnabled ? (
          <Radio className="h-5 w-5" />
        ) : isLive ? (
          <Wifi className="h-5 w-5" />
        ) : (realtimeStatus === 'connecting' || isReconnecting) ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : realtimeStatus === 'error' ? (
          <WifiOff className="h-5 w-5" />
        ) : (
          <Radio className="h-5 w-5" />
        )}
        <div>
          <AlertTitle>
            {!liveEnabled
              ? t('liveOff') || 'Real-time updates disabled'
              : isLive
                ? t('liveConnected') || 'Connected - Real-time updates active'
                : isReconnecting
                  ? `${t('reconnecting') || 'Reconnecting'}... (${reconnectAttempts}/${maxReconnectAttempts})`
                  : realtimeStatus === 'connecting'
                    ? t('liveConnecting') || 'Connecting...'
                    : realtimeStatus === 'error' && reconnectAttempts >= maxReconnectAttempts
                      ? t('liveErrorMaxRetries') || 'Connection failed - Manual retry required'
                      : realtimeStatus === 'error'
                        ? t('liveError') || 'Connection error'
                        : t('liveDisconnected') || 'Disconnected'
            }
          </AlertTitle>
          {!liveEnabled && (
            <AlertDescription>
              {t('enableSoundDesc') || 'Get audio alerts when new orders arrive in real-time'}
            </AlertDescription>
          )}
          {liveEnabled && (!audioUnlocked || !soundEnabled) && isLive && (
            <AlertDescription>
              {t('noSoundWarning') || 'Sound notifications are not enabled'}
            </AlertDescription>
          )}
          {isReconnecting && (
            <AlertDescription>
              {t('autoReconnecting') || 'Attempting to reconnect automatically...'}
            </AlertDescription>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {liveEnabled && realtimeStatus === 'error' && !isReconnecting && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReconnectAttempts(0)
              reconnect()
            }}
            className="gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            {t('retry') || 'Retry'}
          </Button>
        )}
        {!liveEnabled && (
          <Button variant="outline" size="sm" onClick={handleLiveToggle} className="gap-1.5">
            <Radio className="h-3 w-3" />
            {t('enableLive') || 'Enable'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLiveAlertDismissed(true)}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}

export default LiveAlert