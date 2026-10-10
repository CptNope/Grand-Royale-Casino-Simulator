import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { sound } from '../services/sound.ts';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running in standalone / installed mode, suppress the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playChip();
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          title="Install Grand Royale app on your device"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-yellow-600/10 hover:from-amber-500/30 hover:to-yellow-600/20 text-amber-300 hover:text-amber-100 text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-emerald-950/80 via-zinc-900/90 to-emerald-950/80 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Play Grand Royale Anywhere</p>
              <p className="text-xs text-zinc-400">Install as a standalone app with offline mode and zero lag.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-md active:scale-95 shrink-0 ml-3"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
        </div>
      )}

      {/* Installation Instruction Modal for iOS Safari or general browser guidance */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Download className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-amber-300">Install Grand Royale PWA</h3>
                <p className="text-xs text-zinc-400">Fast, offline-ready native casino experience</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3.5 text-xs text-zinc-300 py-2">
                <p className="text-zinc-200 font-medium">To install on iPhone or iPad:</p>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                  <Share className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                  <PlusSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>2. Scroll down in the menu and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>3. Tap <strong>Add</strong> in the top-right corner to launch anytime.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs text-zinc-300 py-2">
                <p className="text-zinc-200 font-medium">To install on your browser / desktop:</p>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                  <Download className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>1. Look for the <strong>Install</strong> or <strong>App Available</strong> icon in your address bar (right side in Chrome/Edge).</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>2. Click <strong>Install Grand Royale</strong> to run as a desktop application with full offline support.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium text-xs hover:bg-amber-500/30 transition text-center"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
