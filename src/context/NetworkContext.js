import React, { createContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncOfflineActions } from '../services/syncManager';

export const NetworkContext = createContext({
  isOffline: false,
  isSyncing: false,
  syncError: null,
  syncData: async () => {},
});

export const NetworkProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const syncData = useCallback(async () => {
    if (isOffline || isSyncing) return;
    
    setIsSyncing(true);
    setSyncError(null);
    try {
      const success = await syncOfflineActions();
      if (!success) {
        setSyncError('Some items failed to sync. Will retry later.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError('Sync failed. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, isSyncing]);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      // isInternetReachable may be null initially on Android or specific connections
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      const wasOffline = isOffline;
      setIsOffline(offline);
      
      // If we just reconnected, try triggering a sync
      if (wasOffline && !offline) {
        syncData();
      }
    });

    return () => unsubscribe();
  }, [isOffline, syncData]);

  // Try syncing on mount in case app was closed while online with pending actions
  useEffect(() => {
    if (!isOffline) {
      syncData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  return (
    <NetworkContext.Provider value={{ isOffline, isSyncing, syncError, syncData }}>
      {children}
    </NetworkContext.Provider>
  );
};
