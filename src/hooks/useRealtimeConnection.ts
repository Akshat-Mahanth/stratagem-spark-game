import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTED');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Monitor connection status
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('games').select('id').limit(1);
        if (error) {
          setIsConnected(false);
          setConnectionStatus('ERROR');
        } else {
          setIsConnected(true);
          setConnectionStatus('CONNECTED');
          setRetryCount(0);
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionStatus('ERROR');
      }
    };

    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);
    
    // Initial check
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const retry = () => {
    setRetryCount(prev => prev + 1);
    setConnectionStatus('RECONNECTING');
    
    // Attempt to reconnect
    setTimeout(async () => {
      try {
        const { error } = await supabase.from('games').select('id').limit(1);
        if (!error) {
          setIsConnected(true);
          setConnectionStatus('CONNECTED');
          setRetryCount(0);
        } else {
          setIsConnected(false);
          setConnectionStatus('ERROR');
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionStatus('ERROR');
      }
    }, 1000);
  };

  return {
    isConnected,
    connectionStatus,
    retryCount,
    retry
  };
};
