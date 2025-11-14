import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

const ConnectionStatus = () => {
  const { isConnected, connectionStatus, retryCount, retry } = useRealtimeConnection();

  if (isConnected && connectionStatus === 'CONNECTED') {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className={`border-2 ${
        connectionStatus === 'ERROR' ? 'border-red-500 bg-red-50' : 
        connectionStatus === 'RECONNECTING' ? 'border-yellow-500 bg-yellow-50' : 
        'border-green-500 bg-green-50'
      }`}>
        <div className="flex items-center gap-2">
          {connectionStatus === 'ERROR' ? (
            <WifiOff className="h-4 w-4 text-red-600" />
          ) : connectionStatus === 'RECONNECTING' ? (
            <RotateCcw className="h-4 w-4 text-yellow-600 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4 text-green-600" />
          )}
          
          <AlertDescription className="flex-1">
            {connectionStatus === 'ERROR' && (
              <div>
                <div className="font-medium text-red-800">Connection Lost</div>
                <div className="text-sm text-red-600">
                  Real-time updates may not work. {retryCount > 0 && `(Retry ${retryCount})`}
                </div>
              </div>
            )}
            {connectionStatus === 'RECONNECTING' && (
              <div>
                <div className="font-medium text-yellow-800">Reconnecting...</div>
                <div className="text-sm text-yellow-600">
                  Attempting to restore connection
                </div>
              </div>
            )}
          </AlertDescription>

          {connectionStatus === 'ERROR' && (
            <Button
              size="sm"
              variant="outline"
              onClick={retry}
              className="ml-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
};

export default ConnectionStatus;
