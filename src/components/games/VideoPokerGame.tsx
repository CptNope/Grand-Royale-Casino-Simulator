import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, HelpCircle, Award, Sparkles, RefreshCw } from 'lucide-react';
import type { Card, VideoPokerState, GameSettings, PokerHandRank } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface VideoPokerGameProps {
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
  settings: GameSettings;
  isReducedMotion: boolean;
}

const PAYTABLE_ROWS: { rank: PokerHandRank; name: string; multiplier: number }[] = [
  { rank: 'royal_flush', name: 'Royal Flush', multiplier: 250 },
  { rank: 'straight_flush', name: 'Straight Flush', multiplier: 50 },
  { rank: 'four_of_a_kind', name: '4 of a Kind', multiplier: 25 },
  { rank: 'full_house', name: 'Full House', multiplier: 9 },
  { rank: 'flush', name: 'Flush', multiplier: 6 },
  { rank: 'straight', name: 'Straight', multiplier: 4 },
  { rank: 'three_of_a_kind', name: '3 of a Kind', multiplier: 3 },
  { rank: 'two_pair', name: 'Two Pair', multiplier: 2 },
  { rank: 'jacks_or_better', name: 'Jacks or Better', multiplier: 1 },
];

export const VideoPokerGame: React.FC<VideoPokerGameProps> = ({
  balance,
  onBalanceUpdate,
  settings,
  isReducedMotion,
}) => {
  const [bet, setBet] = useState(50);
  const [selectedChip, setSelectedChip] = useState(50);
  const [gameState, setGameState] = useState<VideoPokerState | null>(null);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [isDealing, setIsDealing] = useState(false);
  const [message, setMessage] = useState('Place your bet and press DEAL to begin.');
  const [showRules, setShowRules] = useState(false);

  const isHoldingPhase = gameState?.phase === 'holding';

  const handleChipSelect = (val: number) => {
    setSelectedChip(val);
    if (!isHoldingPhase) {
      setBet(Math.min(settings.maxBet, Math.max(settings.minBet, val)));
    }
  };

  const handleToggleHold = (idx: number) => {
    if (!isHoldingPhase || isDealing) return;
    sound.playHold();
    setHeld((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleDeal = async () => {
    if (balance < bet) {
      setMessage('Insufficient chips for this bet.');
      return;
    }

    try {
      setIsDealing(true);
      sound.playChip();
      sound.playCard();
      setMessage('Choose which cards to HOLD, then press DRAW.');
      setHeld([false, false, false, false, false]);

      const res = await api.dealVideoPoker(bet);
      onBalanceUpdate(res.balance);
      setGameState(res.state);

      // Auto-hold cards for natural winning pairs or better
      if (res.state.handRank && res.state.handRank !== 'high_card') {
        setMessage(`Current hand: ${res.state.handName}. Select cards to hold and press DRAW.`);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error dealing cards');
    } finally {
      setIsDealing(false);
    }
  };

  const handleDraw = async () => {
    if (!gameState || gameState.phase !== 'holding' || isDealing) return;

    try {
      setIsDealing(true);
      sound.playCard();

      const res = await api.drawVideoPoker(gameState.gameId, held);
      onBalanceUpdate(res.balance);
      setGameState(res.state);

      if (res.state.payout && res.state.payout > 0) {
        sound.playWin();
        setMessage(`WINNER! ${res.state.handName} pays ${res.state.payout.toLocaleString()} chips!`);

        if (['royal_flush', 'straight_flush', 'four_of_a_kind', 'full_house'].includes(res.state.handRank || '')) {
          if (!isReducedMotion) {
            confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
          }
        }
      } else {
        setMessage(`${res.state.handName || 'Game Over'}. No win. Better luck next hand!`);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error drawing cards');
    } finally {
      setIsDealing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fairness HUD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 font-bold shadow-lg">
            <Award className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-amber-300 tracking-wider">JACKS OR BETTER</h2>
            <p className="text-xs text-zinc-400">Classic 9/6 Video Poker · 99.54% Return to Player</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState?.serverSeedHash && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Provably Fair RNG</span>
            </div>
          )}
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Paytable & Rules</span>
          </button>
        </div>
      </div>

      {/* Main Video Poker Cabinet */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0e1726] via-[#09101d] to-[#040810] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Scanline Glow */}
        <div className="absolute inset-0 bg-radial from-blue-900/10 via-transparent to-transparent pointer-events-none" />

        {/* Compact Dynamic Paytable Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 p-2 sm:p-3 rounded-xl bg-zinc-950/80 border border-blue-500/20 text-center mb-6 text-xs">
          {PAYTABLE_ROWS.map((row) => {
            const isMatch = gameState?.handRank === row.rank;
            return (
              <div
                key={row.rank}
                className={`flex flex-col p-1.5 rounded-lg transition-colors ${
                  isMatch
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-lg scale-105 border border-yellow-200'
                    : 'bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <span className="text-[10px] sm:text-[11px] truncate">{row.name}</span>
                <span className={`font-mono text-xs font-bold ${isMatch ? 'text-zinc-950' : 'text-amber-400'}`}>
                  {row.multiplier}x
                </span>
              </div>
            );
          })}
        </div>

        {/* 5 Cards Display Area */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-3xl mx-auto my-6 sm:my-8 min-h-[160px] sm:min-h-[200px]">
          {([0, 1, 2, 3, 4] as const).map((idx) => {
            const card: Card | undefined = gameState?.hand[idx];
            const isHeld = held[idx];
            const isRed = card?.suit === '♥' || card?.suit === '♦';

            return (
              <div key={idx} className="flex flex-col items-center">
                {/* Hold Status Badge */}
                <div className="h-6 sm:h-7 mb-1.5 flex items-center justify-center">
                  {isHoldingPhase && (
                    <button
                      type="button"
                      onClick={() => handleToggleHold(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow ${
                        isHeld
                          ? 'bg-amber-400 text-zinc-950 ring-2 ring-yellow-200 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {isHeld ? 'HELD' : 'HOLD'}
                    </button>
                  )}
                  {gameState?.phase === 'finished' && isHeld && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      HELD
                    </span>
                  )}
                </div>

                {/* Card Surface */}
                <div
                  onClick={() => handleToggleHold(idx)}
                  className={`w-full aspect-[2.5/3.5] rounded-xl sm:rounded-2xl transition-all duration-200 flex flex-col justify-between p-2 sm:p-3 relative select-none ${
                    isHoldingPhase ? 'cursor-pointer hover:scale-105' : ''
                  } ${
                    card
                      ? isHeld
                        ? 'bg-gradient-to-b from-white to-amber-50 border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-102 -translate-y-1'
                        : 'bg-white border border-zinc-300 shadow-lg'
                      : 'bg-zinc-900/80 border-2 border-dashed border-zinc-700/80 flex items-center justify-center'
                  }`}
                >
                  {card ? (
                    <>
                      <div className={`text-left font-bold text-sm sm:text-lg leading-none ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {card.value}
                        <span className="block text-xs sm:text-sm">{card.suit}</span>
                      </div>

                      <div className={`text-center text-2xl sm:text-4xl ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {card.suit}
                      </div>

                      <div className={`text-right font-bold text-sm sm:text-lg leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {card.value}
                        <span className="block text-xs sm:text-sm">{card.suit}</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                      <Sparkles className="w-5 h-5 text-zinc-600" />
                      <span className="text-[10px] mt-1 font-mono uppercase">Card {idx + 1}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Banner */}
        <div className="max-w-xl mx-auto text-center py-2 px-4 rounded-xl bg-zinc-950/70 border border-white/5 mb-6">
          <p className="text-sm font-semibold text-amber-200">{message}</p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono">Current Wager</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-amber-400">{bet.toLocaleString()}</span>
                <span className="text-xs text-zinc-400">chips</span>
              </div>
            </div>

            {!isHoldingPhase && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBet(Math.max(settings.minBet, bet - 25))}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-white cursor-pointer font-bold"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setBet(Math.min(settings.maxBet, bet + 25))}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-white cursor-pointer font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setBet(Math.min(settings.maxBet, bet * 2))}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 cursor-pointer font-bold"
                >
                  2x
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isHoldingPhase ? (
              <button
                type="button"
                onClick={handleDraw}
                disabled={isDealing}
                className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isDealing ? 'DRAWING...' : 'DRAW CARDS'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeal}
                disabled={isDealing || balance < bet}
                className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isDealing ? 'DEALING...' : 'DEAL'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chip Selector */}
      <ChipSelector
        selectedChip={selectedChip}
        onSelectChip={handleChipSelect}
        currentBet={bet}
        onDoubleBet={() => !isHoldingPhase && setBet((b) => Math.min(settings.maxBet, b * 2))}
        onClearBet={() => !isHoldingPhase && setBet(settings.minBet)}
        disabled={isHoldingPhase || isDealing}
      />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-amber-500/30 p-6 shadow-2xl text-zinc-200">
            <h3 className="font-display font-bold text-lg text-amber-300 mb-2">Video Poker (Jacks or Better) Rules</h3>
            <div className="space-y-3 text-xs leading-relaxed text-zinc-300 max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>Objective:</strong> Build the highest-ranking 5-card poker hand using standard 52-card deck.
              </p>
              <p>
                <strong>Gameplay:</strong>
                <br />1. Select your bet and click <strong>DEAL</strong> to receive your opening 5 cards.
                <br />2. Click on cards (or the HOLD buttons) to retain any cards you want to keep.
                <br />3. Click <strong>DRAW</strong> to discard unheld cards and replace them with fresh cards from the remaining deck.
              </p>
              <p>
                <strong>Payout Hierarchy:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Royal Flush:</strong> 250x (10-J-Q-K-A of the same suit)</li>
                <li><strong>Straight Flush:</strong> 50x (5 consecutive cards in suit)</li>
                <li><strong>4 of a Kind:</strong> 25x (4 cards of identical rank)</li>
                <li><strong>Full House:</strong> 9x (3 of a kind plus a pair)</li>
                <li><strong>Flush:</strong> 6x (5 cards of the same suit)</li>
                <li><strong>Straight:</strong> 4x (5 consecutive ranks, any suit)</li>
                <li><strong>3 of a Kind:</strong> 3x (3 cards of identical rank)</li>
                <li><strong>Two Pair:</strong> 2x (two distinct pairs)</li>
                <li><strong>Jacks or Better:</strong> 1x (a pair of Jacks, Queens, Kings, or Aces)</li>
              </ul>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
