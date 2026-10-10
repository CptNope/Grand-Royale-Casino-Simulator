import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-zinc-950/90 px-4 py-2.5 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-md animate-fade-in">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <WifiOff className="w-4 h-4 text-amber-400" />
      <div>
        <span className="font-semibold text-white">Offline Mode Active</span>
        <span className="text-zinc-400 ml-1.5 hidden sm:inline">— Games & balances save automatically to local storage.</span>
      </div>
    </div>
  );
};
