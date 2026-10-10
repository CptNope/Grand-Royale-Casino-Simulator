import React from 'react';
import {
  Gamepad2,
  FlaskConical,
  ArrowLeftRight,
  ScrollText,
  ShieldCheck,
  User,
  Database,
  Sparkles,
} from 'lucide-react';
import type { Player } from '../types/casino.ts';
import { sound } from '../services/sound.ts';

interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  player: Player | null;
  onOpenProfile: () => void;
  onOpenCacheModal: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onTabChange,
  player,
  onOpenProfile,
  onOpenCacheModal,
}) => {
  const tabs = [
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'experiment', label: 'Lab', icon: FlaskConical },
    { id: 'transfers', label: 'Trade', icon: ArrowLeftRight },
    { id: 'rules', label: 'Rules', icon: ScrollText },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090c10]/95 backdrop-blur-lg border-t border-slate-800/90 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around px-1 py-1.5 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sound.playChip();
                onTabChange(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${isActive ? 'font-bold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Quick Profile / Balance Button */}
        <button
          type="button"
          onClick={() => {
            sound.playChip();
            onOpenProfile();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer select-none active:scale-95"
          title="Player Profile"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-[9px] shadow-sm">
            {player ? player.username.slice(0, 1).toUpperCase() : <User className="w-3 h-3 text-slate-950" />}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-normal text-amber-300 font-mono leading-none">
            {player ? (player.balance > 99999 ? `${Math.round(player.balance / 1000)}k` : player.balance) : 'Profile'}
          </span>
        </button>

        {/* Quick Cache / Diagnostic Button */}
        <button
          type="button"
          onClick={() => {
            sound.playChip();
            onOpenCacheModal();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-400 hover:text-amber-300 transition-all cursor-pointer select-none active:scale-95"
          title="Version & Hard Cache Clear"
        >
          <Database className="w-4 h-4 stroke-[1.75]" />
          <span className="text-[10px] tracking-tight mt-0.5 font-normal leading-none">
            Cache
          </span>
        </button>
      </div>
    </nav>
  );
};
