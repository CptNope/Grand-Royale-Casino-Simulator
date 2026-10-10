import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, HelpCircle, Layers, Award, Play, RotateCcw, RefreshCw } from 'lucide-react';
import type { Card, BlackjackState, GameSettings } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface BlackjackGameProps {
  playerBalance: number;
  gameSettings: GameSettings;
  blackjackPayoutMultiplier: number; // 1.5 for 3:2
  onBalanceUpdate: (newBalance: number) => void;
  isReducedMotion: boolean;
  onRefillChips?: () => void;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  playerBalance,
  gameSettings,
  blackjackPayoutMultiplier,
  onBalanceUpdate,
  isReducedMotion,
  onRefillChips,
}) => {
  const [currentBet, setCurrentBet] = useState(50);
  const [selectedChip, setSelectedChip] = useState(50);
  const [handState, setHandState] = useState<BlackjackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const isPlaying = handState && handState.status === 'player_turn';

  // Keyboard shortcuts (Hit = H, Stand = S, Double = D, Deal = Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'Space' && !isPlaying && !isLoading) {
        e.preventDefault();
        if (currentBet <= playerBalance) handleDeal();
      } else if (isPlaying && !isLoading) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          handleAction('hit');
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleAction('stand');
        } else if (e.key.toLowerCase() === 'd' && handState?.canDouble) {
          e.preventDefault();
          handleAction('double');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleDeal = async () => {
    if (isLoading || isPlaying) return;
    if (currentBet > playerBalance) {
      setErrorMsg('Insufficient play-chips balance. Click Refill to get more chips!');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    sound.playChip();

    try {
      sound.playCard();
      const resp = await api.dealBlackjack(currentBet);
      setHandState(resp.hand);
      onBalanceUpdate(resp.balance);
      setIsLoading(false);

      if (resp.hand.status === 'player_blackjack') {
        sound.playJackpot();
        if (!isReducedMotion) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#22c55e', '#ffffff'],
          });
        }
      } else if (resp.hand.status === 'push') {
        sound.playWin();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Deal failed');
    }
  };

  const handleAction = async (action: 'hit' | 'stand' | 'double') => {
    if (!handState || !isPlaying || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (action === 'hit' || action === 'double') {
        sound.playCard();
      }
      if (action === 'double') {
        sound.playChip();
      }

      const resp = await api.actionBlackjack(handState.id, action);
      setHandState(resp.hand);
      onBalanceUpdate(resp.balance);
      setIsLoading(false);

      if (resp.hand.status === 'player_won' || resp.hand.status === 'dealer_bust') {
        sound.playWin();
        if (resp.hand.payout >= resp.hand.bet * 2 && !isReducedMotion) {
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        }
      } else if (resp.hand.status === 'player_bust' || resp.hand.status === 'dealer_won') {
        sound.playReelStop(0.8);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const renderCard = (card: Card, index: number) => {
    if (card.hidden) {
      return (
        <div
          key={`hidden_${index}`}
          className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-gradient-to-br from-red-800 to-red-950 border-2 border-red-400/80 shadow-md flex items-center justify-center select-none"
        >
          <div className="w-12 h-20 sm:w-16 sm:h-24 rounded border border-dashed border-red-300/40 flex items-center justify-center">
            <span className="font-display text-xl font-bold text-red-200/60">♠</span>
          </div>
        </div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';

    return (
      <div
        key={`${card.value}_${card.suit}_${index}`}
        className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-white border border-slate-300 shadow-lg flex flex-col justify-between p-2 select-none transform transition-transform hover:-translate-y-1"
      >
        <div className={`text-left leading-none font-bold text-sm sm:text-base ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          <div>{card.value}</div>
          <div className="text-xs">{card.suit}</div>
        </div>

        <div className={`text-center font-bold text-2xl sm:text-3xl ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.suit}
        </div>

        <div className={`text-right leading-none font-bold text-sm sm:text-base ${isRed ? 'text-red-600' : 'text-slate-900'} rotate-180`}>
          <div>{card.value}</div>
          <div className="text-xs">{card.suit}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Royal Velvet Blackjack</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Dealer stands on 17
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Natural 21 pays {blackjackPayoutMultiplier === 1.5 ? '3:2' : '6:5'} · Hotkeys: [H] Hit · [S] Stand · [D] Double · [Space] Deal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefillChips && playerBalance < currentBet && (
            <button
              type="button"
              onClick={onRefillChips}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition-colors cursor-pointer animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Free Refill +5,000 Chips</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Table Rules</span>
          </button>
        </div>
      </div>

      {/* Out of Chips Notice */}
      {playerBalance < currentBet && !isPlaying && (
        <div className="p-4 bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="font-bold text-amber-300 text-sm block">Out of Practice Chips!</span>
            <span className="text-xs text-slate-300">
              You need at least {currentBet} chips to deal a hand. Click below to receive +5,000 free chips right now!
            </span>
          </div>
          {onRefillChips && (
            <button
              type="button"
              onClick={onRefillChips}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs uppercase rounded-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer shadow"
            >
              Refill +5,000 Chips Now
            </button>
          )}
        </div>
      )}

      {showRules && (
        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
          <h4 className="font-semibold text-amber-400">Blackjack Table Regulations</h4>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Dealer must stand on all 17s (hard and soft).</li>
            <li>Blackjack (Ace + 10-value) pays {blackjackPayoutMultiplier === 1.5 ? '3 to 2' : '6 to 5'}.</li>
            <li>Double Down is permitted on initial two cards (draws exactly one additional card).</li>
            <li>Ties result in a Push (original wager returned in full).</li>
          </ul>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="font-bold underline ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Felt Blackjack Table Surface */}
      <div className="bg-casino-felt rounded-2xl border-4 border-[#3a2210] p-4 sm:p-8 shadow-2xl relative overflow-hidden min-h-[480px] flex flex-col justify-between">
        {/* Subtle table arc line */}
        <div className="absolute inset-x-8 top-1/2 h-48 border-t-2 border-dashed border-amber-400/20 rounded-[100%] pointer-events-none" />

        {/* Dealer Zone */}
        <div className="relative text-center space-y-3 z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-200/80 font-semibold">
              Dealer Hand
            </span>
            {handState && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/30 tabular-nums">
                {handState.dealerScore} {handState.dealerScore > 21 ? '(Bust)' : ''}
              </span>
            )}
          </div>

          <div className="flex justify-center gap-3 min-h-[100px] sm:min-h-[120px] items-center">
            {handState && handState.dealerCards.length > 0 ? (
              handState.dealerCards.map((c, i) => renderCard(c, i))
            ) : (
              <div className="text-xs text-amber-300/40 italic flex items-center gap-1.5">
                <Layers className="w-4 h-4 opacity-40" />
                <span>Place bet below and press DEAL HAND</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Table Status Banner with DEAL NEW HAND button */}
        <div className="py-2 text-center z-10">
          {handState && handState.status !== 'betting' && (
            <div className="inline-flex flex-col items-center gap-2 px-6 py-3 rounded-2xl backdrop-blur-md border shadow-xl bg-slate-950/90 border-slate-700 animate-fade-in">
              {handState.status === 'player_turn' && (
                <span className="text-xs sm:text-sm font-semibold text-amber-300">
                  Your turn: Choose Hit [H], Stand [S], or Double Down [D]
                </span>
              )}
              {handState.status === 'player_blackjack' && (
                <span className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>NATURAL BLACKJACK! Paid +{handState.payout} chips</span>
                </span>
              )}
              {handState.status === 'player_won' && (
                <span className="text-sm sm:text-base font-bold text-emerald-400">
                  YOU WON! Paid +{handState.payout} chips
                </span>
              )}
              {handState.status === 'dealer_bust' && (
                <span className="text-sm sm:text-base font-bold text-emerald-400">
                  DEALER BUSTS! You Win +{handState.payout} chips
                </span>
              )}
              {handState.status === 'player_bust' && (
                <span className="text-sm sm:text-base font-bold text-rose-400">
                  BUST! ({handState.playerScore}) You lost {handState.bet} chips
                </span>
              )}
              {handState.status === 'dealer_won' && (
                <span className="text-sm sm:text-base font-bold text-rose-400">
                  Dealer Wins ({handState.dealerScore} vs {handState.playerScore})
                </span>
              )}
              {handState.status === 'push' && (
                <span className="text-sm sm:text-base font-bold text-amber-300">
                  PUSH (Tie) — Wager returned in full
                </span>
              )}

              {/* Deal New Hand Quick Button on Table */}
              {!isPlaying && (
                <button
                  type="button"
                  disabled={isLoading || currentBet > playerBalance}
                  onClick={handleDeal}
                  className="mt-1 px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase rounded-xl tracking-wider shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>DEAL NEW HAND ({currentBet} CHIPS)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Player Zone */}
        <div className="relative text-center space-y-3 z-10">
          <div className="flex justify-center gap-3 min-h-[100px] sm:min-h-[120px] items-center">
            {handState && handState.playerCards.length > 0 ? (
              handState.playerCards.map((c, i) => renderCard(c, i))
            ) : (
              <div className="w-20 h-28 rounded-lg border-2 border-dashed border-amber-400/30 flex items-center justify-center text-amber-400/40 text-xs font-mono">
                Player Box
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-200/80 font-semibold">
              Player Hand
            </span>
            {handState && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/30 tabular-nums">
                {handState.playerScore} {handState.playerScore > 21 ? '(Bust)' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Betting & Play Action Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4">
        {!isPlaying ? (
          <>
            <div className="flex items-center justify-between gap-2 pb-1">
              <span className="text-xs font-semibold text-slate-300">Set Wager & Chips:</span>
              <div className="flex items-center gap-1.5">
                {[25, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sound.playChip();
                      setCurrentBet(amt);
                    }}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                      currentBet === amt
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <ChipSelector
              selectedChip={selectedChip}
              onSelectChip={(val) => {
                setSelectedChip(val);
                setCurrentBet(val);
              }}
              currentBet={currentBet}
              onDoubleBet={() => setCurrentBet(Math.min(gameSettings.maxBet, currentBet * 2))}
              onClearBet={() => setCurrentBet(gameSettings.minBet)}
              disabled={isLoading}
            />

            <button
              type="button"
              disabled={isLoading || currentBet > playerBalance}
              onClick={handleDeal}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-display font-bold text-base uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>Dealing Cards...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>DEAL HAND ({currentBet.toLocaleString()} CHIPS)</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleAction('hit')}
              className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wide cursor-pointer active:scale-95 flex flex-col items-center justify-center"
            >
              <span className="text-base">HIT</span>
              <span className="text-[10px] opacity-75 font-mono">[H]</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleAction('stand')}
              className="py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wide cursor-pointer active:scale-95 flex flex-col items-center justify-center"
            >
              <span className="text-base">STAND</span>
              <span className="text-[10px] opacity-75 font-mono">[S]</span>
            </button>
            <button
              type="button"
              disabled={isLoading || !handState?.canDouble}
              onClick={() => handleAction('double')}
              className="py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl shadow-md transition-all uppercase tracking-wide cursor-pointer active:scale-95 disabled:cursor-not-allowed flex flex-col items-center justify-center"
            >
              <span className="text-base">DOUBLE</span>
              <span className="text-[10px] font-mono">+{handState?.bet} chips [D]</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
