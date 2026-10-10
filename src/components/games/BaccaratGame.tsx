import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, HelpCircle, Award, Sparkles, RotateCcw } from 'lucide-react';
import type { Card, BaccaratResult, BaccaratBetType, GameSettings, BaccaratBetItem } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface BaccaratGameProps {
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
  settings: GameSettings;
  isReducedMotion: boolean;
}

export const BaccaratGame: React.FC<BaccaratGameProps> = ({
  balance,
  onBalanceUpdate,
  settings,
  isReducedMotion,
}) => {
  const [bets, setBets] = useState<Record<BaccaratBetType, number>>({
    player: 0,
    banker: 0,
    tie: 0,
    player_pair: 0,
    banker_pair: 0,
  });
  const [selectedChip, setSelectedChip] = useState(50);
  const [result, setResult] = useState<BaccaratResult | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [history, setHistory] = useState<('player' | 'banker' | 'tie')[]>(['banker', 'player', 'banker', 'banker', 'player', 'tie', 'player']);
  const [message, setMessage] = useState('Place your bets on Player, Banker, or Tie, then press DEAL.');
  const [showRules, setShowRules] = useState(false);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const handlePlaceBet = (betType: BaccaratBetType) => {
    if (isDealing) return;
    if (balance < totalBet + selectedChip) {
      setMessage('Insufficient chips for this bet.');
      return;
    }
    if (totalBet + selectedChip > settings.maxBet) {
      setMessage(`Maximum total bet is ${settings.maxBet.toLocaleString()} chips.`);
      return;
    }

    sound.playChip();
    setBets((prev) => ({
      ...prev,
      [betType]: prev[betType] + selectedChip,
    }));
  };

  const handleClearBets = () => {
    if (isDealing) return;
    sound.playChip();
    setBets({
      player: 0,
      banker: 0,
      tie: 0,
      player_pair: 0,
      banker_pair: 0,
    });
  };

  const handleDoubleBets = () => {
    if (isDealing) return;
    if (balance < totalBet * 2) {
      setMessage('Insufficient chips to double bets.');
      return;
    }
    sound.playChip();
    setBets((prev) => ({
      player: prev.player * 2,
      banker: prev.banker * 2,
      tie: prev.tie * 2,
      player_pair: prev.player_pair * 2,
      banker_pair: prev.banker_pair * 2,
    }));
  };

  const handleDeal = async () => {
    if (isDealing || totalBet === 0) return;
    if (totalBet < settings.minBet) {
      setMessage(`Minimum bet is ${settings.minBet} chips.`);
      return;
    }

    try {
      setIsDealing(true);
      sound.playCard();
      setMessage('Dealing cards...');

      const betList: BaccaratBetItem[] = (Object.keys(bets) as BaccaratBetType[])
        .filter((k) => bets[k] > 0)
        .map((k) => ({ betType: k, amount: bets[k] }));

      const res = await api.playBaccarat(betList);
      onBalanceUpdate(res.balance);
      setResult(res.result);
      setHistory((prev) => [res.result.winner, ...prev.slice(0, 19)]);

      if (res.result.isNatural) {
        sound.playNatural();
      }

      if (res.result.totalPayout > 0) {
        sound.playWin();
        const outcomeWord = res.result.winner === 'player' ? 'PLAYER' : res.result.winner === 'banker' ? 'BANKER' : 'TIE';
        setMessage(`${outcomeWord} WINS (${res.result.playerScore} vs ${res.result.bankerScore})! Payout: ${res.result.totalPayout.toLocaleString()} chips.`);

        if (!isReducedMotion && res.result.totalPayout > totalBet) {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        const outcomeWord = res.result.winner === 'player' ? 'Player' : res.result.winner === 'banker' ? 'Banker' : 'Tie';
        setMessage(`${outcomeWord} wins (${res.result.playerScore} vs ${res.result.bankerScore}). No payout on active bets.`);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error playing hand');
    } finally {
      setIsDealing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fairness HUD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white font-bold shadow-lg">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-blue-200 tracking-wider">ROYAL BACCARAT</h2>
            <p className="text-xs text-zinc-400">Punto Banco High Roller · 1.06% House Edge</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result?.serverSeedHash && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Provably Fair</span>
            </div>
          )}
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tableau Rules</span>
          </button>
        </div>
      </div>

      {/* Main Oval Table Felt */}
      <div className="rounded-3xl border-4 border-amber-600/40 bg-gradient-to-b from-[#0a1e3f] via-[#06142c] to-[#030914] p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Felt Texture & Outer Oval Line */}
        <div className="absolute inset-4 rounded-2xl border border-blue-400/20 pointer-events-none" />

        {/* Bead Plate Road History */}
        <div className="flex items-center gap-2 mb-6 p-2 rounded-xl bg-zinc-950/70 border border-white/10 max-w-lg mx-auto">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 px-2 shrink-0">Bead Road</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {history.map((h, i) => (
              <span
                key={i}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  h === 'player'
                    ? 'bg-blue-600 text-white'
                    : h === 'banker'
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
                title={h.toUpperCase()}
              >
                {h === 'player' ? 'P' : h === 'banker' ? 'B' : 'T'}
              </span>
            ))}
          </div>
        </div>

        {/* Hands Display: Player vs Banker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto my-6">
          {/* Player Hand */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30">
            <div className="flex items-center justify-between w-full mb-3 px-2">
              <span className="font-display font-bold text-sm tracking-wider text-blue-300">PLAYER</span>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                SCORE: {result ? result.playerScore : '—'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[120px]">
              {result ? (
                result.playerHand.map((c, i) => {
                  const isRed = c.suit === '♥' || c.suit === '♦';
                  return (
                    <div
                      key={i}
                      className="w-16 sm:w-20 aspect-[2.5/3.5] bg-white rounded-xl shadow-lg border border-zinc-200 p-2 flex flex-col justify-between select-none"
                    >
                      <div className={`text-xs font-bold leading-none ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {c.value}{c.suit}
                      </div>
                      <div className={`text-center text-xl sm:text-2xl ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {c.suit}
                      </div>
                      <div className={`text-xs font-bold leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {c.value}{c.suit}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-500 text-xs italic">Awaiting deal...</div>
              )}
            </div>
          </div>

          {/* Banker Hand */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-red-950/40 border border-red-500/30">
            <div className="flex items-center justify-between w-full mb-3 px-2">
              <span className="font-display font-bold text-sm tracking-wider text-red-300">BANKER</span>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                SCORE: {result ? result.bankerScore : '—'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[120px]">
              {result ? (
                result.bankerHand.map((c, i) => {
                  const isRed = c.suit === '♥' || c.suit === '♦';
                  return (
                    <div
                      key={i}
                      className="w-16 sm:w-20 aspect-[2.5/3.5] bg-white rounded-xl shadow-lg border border-zinc-200 p-2 flex flex-col justify-between select-none"
                    >
                      <div className={`text-xs font-bold leading-none ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {c.value}{c.suit}
                      </div>
                      <div className={`text-center text-xl sm:text-2xl ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {c.suit}
                      </div>
                      <div className={`text-xs font-bold leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {c.value}{c.suit}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-500 text-xs italic">Awaiting deal...</div>
              )}
            </div>
          </div>
        </div>

        {/* Message Banner */}
        <div className="max-w-xl mx-auto text-center py-2 px-4 rounded-xl bg-zinc-950/70 border border-white/5 mb-6">
          <p className="text-sm font-semibold text-blue-200">{message}</p>
        </div>

        {/* Betting Spots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-6">
          {/* Player Spot */}
          <button
            type="button"
            onClick={() => handlePlaceBet('player')}
            className={`p-4 rounded-2xl border-2 transition text-center cursor-pointer relative ${
              bets.player > 0
                ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20'
                : 'bg-zinc-900/60 border-blue-500/30 hover:border-blue-400/60 hover:bg-zinc-900/80'
            }`}
          >
            <span className="font-display font-bold text-sm text-blue-300 block">PLAYER</span>
            <span className="text-[11px] text-zinc-400 font-mono">PAYS 1:1</span>
            {bets.player > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-bold text-xs shadow">
                {bets.player.toLocaleString()} chips
              </div>
            )}
          </button>

          {/* Tie Spot */}
          <button
            type="button"
            onClick={() => handlePlaceBet('tie')}
            className={`p-4 rounded-2xl border-2 transition text-center cursor-pointer relative ${
              bets.tie > 0
                ? 'bg-emerald-600/30 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-900/60 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-zinc-900/80'
            }`}
          >
            <span className="font-display font-bold text-sm text-emerald-300 block">TIE</span>
            <span className="text-[11px] text-zinc-400 font-mono">PAYS 8:1</span>
            {bets.tie > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs shadow">
                {bets.tie.toLocaleString()} chips
              </div>
            )}
          </button>

          {/* Banker Spot */}
          <button
            type="button"
            onClick={() => handlePlaceBet('banker')}
            className={`p-4 rounded-2xl border-2 transition text-center cursor-pointer relative ${
              bets.banker > 0
                ? 'bg-red-600/30 border-red-400 shadow-lg shadow-red-500/20'
                : 'bg-zinc-900/60 border-red-500/30 hover:border-red-400/60 hover:bg-zinc-900/80'
            }`}
          >
            <span className="font-display font-bold text-sm text-red-300 block">BANKER</span>
            <span className="text-[11px] text-zinc-400 font-mono">PAYS 0.95:1 (5% Comm)</span>
            {bets.banker > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white font-mono font-bold text-xs shadow">
                {bets.banker.toLocaleString()} chips
              </div>
            )}
          </button>
        </div>

        {/* Side Pairs Row */}
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
          <button
            type="button"
            onClick={() => handlePlaceBet('player_pair')}
            className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer text-xs ${
              bets.player_pair > 0
                ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                : 'bg-zinc-900/40 border-white/10 hover:border-blue-400/40 text-zinc-400'
            }`}
          >
            Player Pair (11:1) {bets.player_pair > 0 && `• ${bets.player_pair} chips`}
          </button>
          <button
            type="button"
            onClick={() => handlePlaceBet('banker_pair')}
            className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer text-xs ${
              bets.banker_pair > 0
                ? 'bg-red-600/30 border-red-400 text-red-200'
                : 'bg-zinc-900/40 border-white/10 hover:border-red-400/40 text-zinc-400'
            }`}
          >
            Banker Pair (11:1) {bets.banker_pair > 0 && `• ${bets.banker_pair} chips`}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono">Total Table Bet</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold text-amber-400">{totalBet.toLocaleString()}</span>
              <span className="text-xs text-zinc-400">chips</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearBets}
              disabled={isDealing || totalBet === 0}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition cursor-pointer disabled:opacity-40"
            >
              Clear Bets
            </button>
            <button
              type="button"
              onClick={handleDoubleBets}
              disabled={isDealing || totalBet === 0 || balance < totalBet * 2}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 font-bold transition cursor-pointer disabled:opacity-40"
            >
              Double 2x
            </button>
            <button
              type="button"
              onClick={handleDeal}
              disabled={isDealing || totalBet === 0 || balance < totalBet}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isDealing ? 'DEALING...' : 'DEAL HAND'}
            </button>
          </div>
        </div>
      </div>

      {/* Chip Selector */}
      <ChipSelector
        selectedChip={selectedChip}
        onSelectChip={setSelectedChip}
        disabled={isDealing}
      />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-blue-500/30 p-6 shadow-2xl text-zinc-200">
            <h3 className="font-display font-bold text-lg text-blue-300 mb-2">Baccarat (Punto Banco) Rules</h3>
            <div className="space-y-3 text-xs leading-relaxed text-zinc-300 max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>Goal:</strong> Bet on which hand (Player or Banker) will achieve a point total closest to 9.
              </p>
              <p>
                <strong>Card Values:</strong>
                <br />• Aces = 1 point
                <br />• 2 through 9 = face value
                <br />• 10s, Jacks, Queens, Kings = 0 points
                <br />• Hand score is the right digit of the sum (e.g. 7 + 8 = 15 → score of 5).
              </p>
              <p>
                <strong>Tableau (Third Card Rules):</strong>
                <br />• <strong>Natural:</strong> If either Player or Banker has 8 or 9 on the first 2 cards, both hands stand.
                <br />• <strong>Player:</strong> Draws on 0–5, stands on 6 or 7.
                <br />• <strong>Banker:</strong> Follows strict casino rules depending on whether Player stood or drew a 3rd card.
              </p>
              <p>
                <strong>Payouts:</strong>
                <br />• <strong>Player Bet:</strong> 1:1 even money
                <br />• <strong>Banker Bet:</strong> 0.95:1 (standard 5% casino commission)
                <br />• <strong>Tie Bet:</strong> 8:1 (pushes Player/Banker bets if Tie occurs)
                <br />• <strong>Pairs:</strong> 11:1 if the initial 2 cards match
              </p>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
