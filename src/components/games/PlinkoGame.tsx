import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, HelpCircle, Dices, Sliders, Play, Award, RotateCcw } from 'lucide-react';
import type { PlinkoResult, PlinkoRisk, GameSettings } from '../../types/casino.ts';
import { api } from '../../services/api.ts';
import { sound } from '../../services/sound.ts';
import { ChipSelector } from '../ChipSelector.tsx';

interface PlinkoGameProps {
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
  settings: GameSettings;
  isReducedMotion: boolean;
}

const PLINKO_PAYOUTS: Record<number, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
  balance,
  onBalanceUpdate,
  settings,
  isReducedMotion,
}) => {
  const [bet, setBet] = useState(50);
  const [selectedChip, setSelectedChip] = useState(50);
  const [rows, setRows] = useState<number>(12);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const [isDropping, setIsDropping] = useState(false);
  const [lastResult, setLastResult] = useState<PlinkoResult | null>(null);
  const [history, setHistory] = useState<{ mult: number; payout: number }[]>([
    { mult: 2, payout: 100 },
    { mult: 0.6, payout: 30 },
    { mult: 11, payout: 550 },
  ]);
  const [message, setMessage] = useState('Select bet, rows & risk, then press DROP BALL.');
  const [showRules, setShowRules] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const multipliers = PLINKO_PAYOUTS[rows][risk];

  const handleChipSelect = (val: number) => {
    setSelectedChip(val);
    setBet(Math.min(settings.maxBet, Math.max(settings.minBet, val)));
  };

  const handleDrop = async () => {
    if (isDropping) return;
    if (balance < bet) {
      setMessage('Insufficient balance to drop ball.');
      return;
    }

    try {
      setIsDropping(true);
      sound.playChip();
      setMessage('Ball dropping...');

      const res = await api.dropPlinko(bet, rows, risk);
      onBalanceUpdate(res.balance);
      setLastResult(res.result);

      // Animate ball drop on canvas
      if (!isReducedMotion) {
        await animateBallDrop(res.result.directions, res.result.slotIndex);
      }

      setHistory((prev) => [{ mult: res.result.multiplier, payout: res.result.payout }, ...prev.slice(0, 14)]);

      if (res.result.payout > 0) {
        sound.playWin();
        setMessage(`Landed in ${res.result.multiplier}x slot! Won ${res.result.payout.toLocaleString()} chips!`);
        if (res.result.multiplier >= 10 && !isReducedMotion) {
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.7 } });
        }
      } else {
        setMessage(`Landed in ${res.result.multiplier}x slot. No win.`);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error during Plinko drop');
    } finally {
      setIsDropping(false);
    }
  };

  // Canvas drawing & animation
  const animateBallDrop = (directions: number[], finalSlot: number): Promise<void> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve();
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const rowCount = directions.length;
      const startY = 30;
      const endY = height - 40;
      const rowHeight = (endY - startY) / rowCount;

      let currentStep = 0;
      let ballX = width / 2;
      let ballY = startY;
      let targetX = width / 2;
      let targetY = startY;

      // Calculate path points
      const pathPoints: { x: number; y: number }[] = [{ x: width / 2, y: startY }];
      let colOffset = 0;
      for (let i = 0; i < rowCount; i++) {
        colOffset += directions[i] === 1 ? 0.5 : -0.5;
        const pegSpacing = (width * 0.75) / (i + 2);
        const y = startY + (i + 1) * rowHeight;
        const x = width / 2 + colOffset * (pegSpacing * 0.9);
        pathPoints.push({ x, y });
      }

      let animFrame: number;
      let progress = 0;

      const render = () => {
        // Redraw pegs & board
        drawBoard(ctx, width, height, rowCount, finalSlot);

        if (currentStep < pathPoints.length - 1) {
          progress += 0.15;
          const p1 = pathPoints[currentStep];
          const p2 = pathPoints[currentStep + 1];

          ballX = p1.x + (p2.x - p1.x) * progress;
          // Add parabolic arc bounce
          const bounceArc = Math.sin(progress * Math.PI) * -8;
          ballY = p1.y + (p2.y - p1.y) * progress + bounceArc;

          if (progress >= 1) {
            progress = 0;
            currentStep++;
            sound.playPegClick();
          }

          // Draw Glowing Ball
          ctx.save();
          ctx.beginPath();
          ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.restore();

          animFrame = requestAnimationFrame(render);
        } else {
          // Final landing
          drawBoard(ctx, width, height, rowCount, finalSlot);
          resolve();
        }
      };

      render();
    });
  };

  const drawBoard = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rowCount: number,
    highlightSlot: number | null = null
  ) => {
    ctx.clearRect(0, 0, width, height);

    const startY = 30;
    const endY = height - 40;
    const rowHeight = (endY - startY) / rowCount;

    // Draw Pegs Pyramid
    for (let r = 0; r <= rowCount; r++) {
      const pegsInRow = r + 3;
      const y = startY + r * rowHeight;
      const totalRowWidth = (width * 0.82) * ((r + 3) / (rowCount + 3));
      const spacing = totalRowWidth / (pegsInRow - 1);
      const startX = (width - totalRowWidth) / 2;

      for (let p = 0; p < pegsInRow; p++) {
        const x = startX + p * spacing;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ca8a04';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 3;
        ctx.fill();
      }
    }
  };

  // Initial canvas render on load or row change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawBoard(ctx, canvas.width, canvas.height, rows);
      }
    }
  }, [rows]);

  // Color helper for multiplier buckets
  const getMultiplierStyle = (mult: number) => {
    if (mult >= 100) return 'from-purple-600 to-pink-600 text-white font-extrabold shadow-pink-500/50';
    if (mult >= 20) return 'from-rose-600 to-red-600 text-white font-bold shadow-red-500/40';
    if (mult >= 5) return 'from-amber-500 to-orange-500 text-zinc-950 font-bold';
    if (mult >= 1.5) return 'from-yellow-400 to-amber-400 text-zinc-950 font-semibold';
    if (mult >= 1) return 'from-emerald-500 to-teal-500 text-zinc-950 font-medium';
    return 'from-blue-900 to-indigo-900 text-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fairness HUD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center text-zinc-950 font-bold shadow-lg">
            <Sliders className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-amber-300 tracking-wider">ROYAL PLINKO</h2>
            <p className="text-xs text-zinc-400">Peg Pyramid Simulator · Up to 1,000x Multipliers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastResult?.serverSeedHash && (
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
            <span>How it Works</span>
          </button>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#13111c] via-[#0b0a12] to-[#040407] p-4 sm:p-6 shadow-2xl relative">
        {/* Drop History Badges */}
        <div className="flex items-center justify-between gap-2 mb-4 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 px-2 shrink-0">Recent Drops:</span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-gradient-to-r ${getMultiplierStyle(
                  h.mult
                )} shrink-0 shadow-sm`}
              >
                {h.mult}x
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Peg Pyramid Canvas */}
        <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={540}
            height={380}
            className="w-full h-auto rounded-2xl bg-zinc-950/60 border border-amber-500/20 shadow-inner"
          />

          {/* Multiplier Pockets Row at bottom */}
          <div className="w-full flex items-center justify-between gap-1 mt-3 px-1">
            {multipliers.map((m, idx) => {
              const isHit = lastResult?.slotIndex === idx;
              return (
                <div
                  key={idx}
                  className={`flex-1 py-1.5 rounded-md text-center text-[10px] sm:text-xs font-mono font-bold transition-all bg-gradient-to-b ${getMultiplierStyle(
                    m
                  )} ${isHit ? 'ring-2 ring-white scale-110 shadow-lg z-10' : 'opacity-90'}`}
                >
                  {m}x
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Banner */}
        <div className="max-w-xl mx-auto text-center py-2 px-4 rounded-xl bg-zinc-950/70 border border-white/5 my-6">
          <p className="text-sm font-semibold text-amber-200">{message}</p>
        </div>

        {/* Controls Bar: Risk, Rows, Wager */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 max-w-3xl mx-auto">
          {/* Rows Setting */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono mb-1.5">Rows</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[8, 12, 16].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => !isDropping && setRows(r)}
                  disabled={isDropping}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rows === r
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {r} Rows
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level Setting */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono mb-1.5">Risk Profile</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['low', 'medium', 'high'] as PlinkoRisk[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => !isDropping && setRisk(lvl)}
                  disabled={isDropping}
                  className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                    risk === lvl
                      ? lvl === 'high'
                        ? 'bg-rose-600 text-white shadow'
                        : lvl === 'medium'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'bg-emerald-500 text-zinc-950 shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleDrop}
              disabled={isDropping || balance < bet}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 font-bold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isDropping ? 'DROPPING...' : `DROP (${bet} CHIPS)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chip Selector */}
      <ChipSelector
        selectedChip={selectedChip}
        onSelectChip={handleChipSelect}
        currentBet={bet}
        onDoubleBet={() => !isDropping && setBet((b) => Math.min(settings.maxBet, b * 2))}
        onClearBet={() => !isDropping && setBet(settings.minBet)}
        disabled={isDropping}
      />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-amber-500/30 p-6 shadow-2xl text-zinc-200">
            <h3 className="font-display font-bold text-lg text-amber-300 mb-2">Plinko Simulator Rules</h3>
            <div className="space-y-3 text-xs leading-relaxed text-zinc-300 max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>Concept:</strong> A ball is dropped from the top apex of a triangular peg pyramid. At each row of pegs, the ball has a 50/50 probability of bouncing left or right.
              </p>
              <p>
                <strong>Multipliers & Distribution:</strong>
                <br />Because multiple paths lead to the center slots (binomial distribution), center slots land most frequently and offer modest returns (0.2x–1.5x).
                <br />Outer edge slots are exponentially rarer and offer massive multipliers (up to 29x on 8 rows, 170x on 12 rows, and 1,000x on 16 rows High Risk).
              </p>
              <p>
                <strong>Risk Profiles:</strong>
                <br />• <strong>Low Risk:</strong> Low variance, gentle multipliers, frequent small returns.
                <br />• <strong>Medium Risk:</strong> Balanced standard casino profile.
                <br />• <strong>High Risk:</strong> Extreme variance where center slots return low multipliers but edges deliver monumental jackpots.
              </p>
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
