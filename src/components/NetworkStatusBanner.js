import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NetworkContext } from '../context/NetworkContext';

export default function NetworkStatusBanner() {
  const { isOffline, isSyncing, syncError } = useContext(NetworkContext);

  if (!isOffline && !isSyncing && !syncError) return null;

  let bgColor = 'bg-accent'; // Default for syncing
  let text = 'Syncing offline progress...';
  let showLoader = true;

  if (isOffline) {
    bgColor = 'bg-danger';
    text = 'Offline Mode - Saving progress locally';
    showLoader = false;
  } else if (syncError) {
    bgColor = 'bg-danger';
    text = syncError;
    showLoader = false;
  }

  return (
    <View className={`w-full ${bgColor} py-2 px-4 flex-row justify-center items-center shadow-sm z-50`}>
      {showLoader && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
      <Text className="text-white font-bold text-sm text-center">{text}</Text>
    </View>
  );
}
