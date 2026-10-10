import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RefreshCw,
  Database,
  Layers,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  GitBranch,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { CacheManager, type StorageBreakdown } from '../services/cacheManager.ts';
import { APP_VERSION_INFO, CHANGELOG_HISTORY } from '../version.ts';
import { sound } from '../services/sound.ts';

interface CacheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CacheModal: React.FC<CacheModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cache' | 'version' | 'changelog'>('cache');
  const [storageData, setStorageData] = useState<StorageBreakdown | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [preserveWallet, setPreserveWallet] = useState(true);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  const fetchStorageData = async () => {
    const data = await CacheManager.getStorageBreakdown();
    setStorageData(data);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStorageData();
      setClearStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteHardClear = async () => {
    sound.playChip();
    setIsClearing(true);
    setClearStatus('Purging Service Worker, CacheStorage buckets, and refreshing assets...');

    try {
      const result = await CacheManager.performHardCacheClear({
        preserveWalletData: preserveWallet,
        forceReload: true,
      });
      setClearStatus(`Successfully purged ${result.clearedCaches} cache stores & unregistered service workers. Reloading...`);
    } catch (err: unknown) {
      setIsClearing(false);
      setClearStatus(err instanceof Error ? err.message : 'Cache clear encountered an error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isClearing}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-amber-300 flex items-center gap-2">
              <span>Version Control & Cache Management</span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                v{APP_VERSION_INFO.version}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Inspect client storage, diagnostic cache buckets, and perform instant hard cache purging.
            </p>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pt-3 pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('cache')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'cache'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Hard Cache Clear
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('version')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'version'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Version & Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'changelog'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Release Changelog
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* TAB 1: HARD CACHE PURGE */}
          {activeTab === 'cache' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-200">When should I use Hard Cache Clear?</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      If you're noticing outdated game screens, stale offline service worker cache, or want to guarantee
                      you are running the newest JavaScript bundles directly from the server.
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnostic Metrics Strip */}
              {storageData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Cache Buckets
                    </span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {storageData.cacheCount} Stores
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Local Storage
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {CacheManager.formatBytes(storageData.localStorageBytes)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Service Worker
                    </span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      {storageData.swRegistered ? 'Active (PWA)' : 'Inactive'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Session Memory
                    </span>
                    <span className="text-sm font-mono font-bold text-purple-400">
                      {CacheManager.formatBytes(storageData.sessionStorageBytes)}
                    </span>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveWallet}
                    onChange={(e) => setPreserveWallet(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/30"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Preserve Practice Wallet & Player Chips (Recommended)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Keeps your play-money balance and sound preferences while deleting all compiled JavaScript, CSS, HTML, and Service Worker caches.
                    </span>
                  </div>
                </label>
              </div>

              {/* Status Message */}
              {clearStatus && (
                <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  <span>{clearStatus}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={handleExecuteHardClear}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/50 cursor-pointer active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Hard Cache Clear & Refresh</span>
                </button>

                <button
                  type="button"
                  disabled={isClearing}
                  onClick={fetchStorageData}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Metrics</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VERSION & DIAGNOSTICS */}
          {activeTab === 'version' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  <span>Application Build Diagnostics</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Version Tag:</span>
                    <span className="font-mono font-bold text-amber-300">v{APP_VERSION_INFO.version}</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Build Identifier:</span>
                    <span className="font-mono text-slate-200">{APP_VERSION_INFO.buildCommit}</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Schema Version:</span>
                    <span className="font-mono text-slate-200">v{APP_VERSION_INFO.schemaVersion} (Auto-migrated)</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Build Timestamp:</span>
                    <span className="font-mono text-slate-200">{APP_VERSION_INFO.buildTime}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Active Suite Capabilities</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                  {APP_VERSION_INFO.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {storageData && storageData.cacheNames.length > 0 && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <span className="font-semibold text-slate-300 block">Active CacheStorage Namespaces:</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                    {storageData.cacheNames.map((cName) => (
                      <span key={cName} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {cName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHANGELOG */}
          {activeTab === 'changelog' && (
            <div className="space-y-4">
              {CHANGELOG_HISTORY.map((entry) => (
                <div
                  key={entry.version}
                  className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        v{entry.version}
                      </span>
                      <h4 className="font-semibold text-slate-200">{entry.title}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {entry.date}
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300 pt-1">
                    {entry.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Client Storage Engine: HTML5 LocalStorage + Cache API</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
