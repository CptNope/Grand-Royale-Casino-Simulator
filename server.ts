import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  CasinoConfig,
  Player,
  Transaction,
  AuditLogEntry,
  SlotSymbol,
  SlotPaylineHit,
  SlotSpinResult,
  Card,
  BlackjackState,
  RouletteBetItem,
  RouletteSpinResult,
  MultiplierDiceResult,
  CrapsDiceResult,
  SimulationResult,
  SimulationRoundResult,
  BettingStrategy,
  GameType,
  VideoPokerState,
  PokerHandRank,
  BaccaratBetItem,
  BaccaratBetOutcome,
  BaccaratResult,
  PlinkoRisk,
  PlinkoResult,
} from './src/types/casino.ts';

const app = express();
const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'casino_state.json');

app.use(express.json());

// Initialize default configuration
const DEFAULT_CONFIG: CasinoConfig = {
  startingBalance: 5000,
  dailyBonusAmount: 1000,
  dailyBonusCooldownHours: 24,
  allowBalanceReset: true,
  peerTransfersEnabled: true,
  maxTransferAmount: 10000,
  transferFeePercent: 0,
  blackjackNaturalPayout: 1.5, // 3:2 payout
  slotRtpProfile: 'standard', // 96.5% standard
  games: {
    slots: { enabled: true, minBet: 10, maxBet: 2500, houseEdgePercent: 3.5 },
    blackjack: { enabled: true, minBet: 25, maxBet: 5000, houseEdgePercent: 0.5 },
    roulette: { enabled: true, minBet: 10, maxBet: 5000, houseEdgePercent: 2.7 },
    dice: { enabled: true, minBet: 10, maxBet: 10000, houseEdgePercent: 1.0 },
    videopoker: { enabled: true, minBet: 10, maxBet: 2500, houseEdgePercent: 0.46 },
    baccarat: { enabled: true, minBet: 25, maxBet: 5000, houseEdgePercent: 1.06 },
    plinko: { enabled: true, minBet: 10, maxBet: 5000, houseEdgePercent: 1.0 },
  },
};

const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'player_main',
    username: 'HighRoller77',
    avatar: 'Crown',
    balance: 5000,
    isFrozen: false,
    lastDailyBonusClaim: null,
    createdAt: Date.now() - 86400000 * 5,
    badges: [
      {
        id: 'b_welcome',
        name: 'Grand Welcome',
        description: 'Joined the Grand Royale Casino simulator',
        icon: 'Sparkles',
        earnedAt: Date.now() - 86400000 * 5,
      },
    ],
    stats: {
      gamesPlayed: 0,
      totalWagered: 0,
      totalWon: 0,
      netProfit: 0,
      biggestWin: 0,
      streak: 0,
    },
  },
  {
    id: 'player_alice',
    username: 'LadyLuck_Alice',
    avatar: 'Gem',
    balance: 7850,
    isFrozen: false,
    lastDailyBonusClaim: Date.now() - 3600000 * 12,
    createdAt: Date.now() - 86400000 * 3,
    badges: [
      {
        id: 'b_highroller',
        name: 'High Roller Club',
        description: 'Maintained balance over 5,000 chips',
        icon: 'TrendingUp',
        earnedAt: Date.now() - 86400000 * 2,
      },
    ],
    stats: {
      gamesPlayed: 42,
      totalWagered: 12500,
      totalWon: 15350,
      netProfit: 2850,
      biggestWin: 3200,
      streak: 3,
    },
  },
  {
    id: 'player_strategy',
    username: 'StrategyLab_Pro',
    avatar: 'Cpu',
    balance: 4200,
    isFrozen: false,
    lastDailyBonusClaim: Date.now() - 3600000 * 4,
    createdAt: Date.now() - 86400000 * 2,
    badges: [
      {
        id: 'b_analyst',
        name: 'Monte Carlo Analyst',
        description: 'Ran over 500 strategy experiments',
        icon: 'BarChart3',
        earnedAt: Date.now() - 86400000,
      },
    ],
    stats: {
      gamesPlayed: 110,
      totalWagered: 22000,
      totalWon: 21200,
      netProfit: -800,
      biggestWin: 1250,
      streak: 0,
    },
  },
];

interface CasinoState {
  config: CasinoConfig;
  players: Record<string, Player>;
  activePlayerId: string;
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
  activeBlackjackHands: Record<string, BlackjackState>;
  activeVideoPokerGames: Record<string, { deck: Card[]; hand: Card[]; bet: number }>;
  serverSeed: string;
  nonce: number;
}

let state: CasinoState = {
  config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  players: Object.fromEntries(DEFAULT_PLAYERS.map((p) => [p.id, p])),
  activePlayerId: 'player_main',
  transactions: [],
  auditLogs: [],
  activeBlackjackHands: {},
  activeVideoPokerGames: {},
  serverSeed: crypto.randomBytes(32).toString('hex'),
  nonce: 1,
};

// Persistence helpers
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadState() {
  try {
    ensureDataDir();
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (data && data.config && data.players) {
        state = {
          ...data,
          config: {
            ...DEFAULT_CONFIG,
            ...data.config,
            games: {
              ...DEFAULT_CONFIG.games,
              ...(data.config.games || {}),
            },
          },
          serverSeed: data.serverSeed || crypto.randomBytes(32).toString('hex'),
          nonce: data.nonce || 1,
        };
        // Also initialize activeVideoPokerGames if missing
        if (!state.activeVideoPokerGames) {
          state.activeVideoPokerGames = {};
        }
        saveState();
      }
    } else {
      saveState();
    }
  } catch (err) {
    console.warn('Failed to load state file, using defaults', err);
  }
}

function saveState() {
  try {
    ensureDataDir();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state file', err);
  }
}

loadState();

// Audit log helper
function addAuditLog(actor: 'player' | 'admin' | 'system', action: string, details: string, playerId?: string) {
  const entry: AuditLogEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
    actor,
    action,
    details,
    playerId,
  };
  state.auditLogs.unshift(entry);
  if (state.auditLogs.length > 500) {
    state.auditLogs = state.auditLogs.slice(0, 500);
  }
  saveState();
  return entry;
}

// Transaction helper
function recordTransaction(
  player: Player,
  type: Transaction['type'],
  game: Transaction['game'],
  amount: number,
  note: string,
  details?: Record<string, unknown>
): Transaction {
  // Note: player.balance is updated by caller before recording
  const tx: Transaction = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
    playerId: player.id,
    type,
    game,
    amount,
    balanceAfter: player.balance,
    note,
    details,
  };
  state.transactions.unshift(tx);
  if (state.transactions.length > 1000) {
    state.transactions = state.transactions.slice(0, 1000);
  }
  saveState();
  return tx;
}

// Provably Fair helper
function getProvablyFairMeta() {
  state.nonce += 1;
  const serverSeedHash = crypto.createHash('sha256').update(state.serverSeed).digest('hex');
  return {
    serverSeedHash,
    nonce: state.nonce,
  };
}

// ================= API ROUTES =================

// State & Config
app.get('/api/state', (req, res) => {
  const activePlayer = state.players[state.activePlayerId] || Object.values(state.players)[0];
  res.json({
    config: state.config,
    activePlayer,
    playersList: Object.values(state.players),
    serverSeedHash: crypto.createHash('sha256').update(state.serverSeed).digest('hex'),
    nonce: state.nonce,
  });
});

app.post('/api/admin/config', (req, res) => {
  const newConfig = req.body as Partial<CasinoConfig>;
  if (!newConfig) {
    return res.status(400).json({ error: 'Invalid configuration payload' });
  }

  state.config = {
    ...state.config,
    ...newConfig,
    games: {
      ...state.config.games,
      ...(newConfig.games || {}),
    },
  };

  addAuditLog('admin', 'CONFIG_UPDATE', 'Updated global casino rules, betting limits, and payout settings');
  saveState();
  res.json({ success: true, config: state.config });
});

// Player & Wallet Management
app.get('/api/players', (req, res) => {
  res.json({ players: Object.values(state.players), activePlayerId: state.activePlayerId });
});

app.post('/api/players/switch', (req, res) => {
  const { playerId } = req.body;
  if (!playerId || !state.players[playerId]) {
    return res.status(404).json({ error: 'Player profile not found' });
  }
  state.activePlayerId = playerId;
  saveState();
  res.json({ success: true, activePlayer: state.players[playerId] });
});

app.post('/api/players/create', (req, res) => {
  const { username, avatar } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    return res.status(400).json({ error: 'Valid username required (minimum 2 characters)' });
  }

  const id = 'player_' + Date.now().toString(36);
  const newPlayer: Player = {
    id,
    username: username.trim().slice(0, 24),
    avatar: avatar || 'User',
    balance: state.config.startingBalance,
    isFrozen: false,
    lastDailyBonusClaim: null,
    createdAt: Date.now(),
    badges: [
      {
        id: 'b_member',
        name: 'Club Member',
        description: 'Registered virtual player account',
        icon: 'UserCheck',
        earnedAt: Date.now(),
      },
    ],
    stats: {
      gamesPlayed: 0,
      totalWagered: 0,
      totalWon: 0,
      netProfit: 0,
      biggestWin: 0,
      streak: 0,
    },
  };

  state.players[id] = newPlayer;
  state.activePlayerId = id;
  recordTransaction(newPlayer, 'bonus', 'wallet', state.config.startingBalance, 'Initial starting balance grant');
  addAuditLog('player', 'PLAYER_CREATED', `Created new player account: ${newPlayer.username}`, id);
  saveState();

  res.json({ success: true, player: newPlayer });
});

app.post('/api/wallet/claim-daily', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Active player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Player account is frozen by administrator' });

  const now = Date.now();
  const cooldownMs = state.config.dailyBonusCooldownHours * 3600 * 1000;
  if (player.lastDailyBonusClaim && now - player.lastDailyBonusClaim < cooldownMs) {
    const remainingMs = cooldownMs - (now - player.lastDailyBonusClaim);
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    return res.status(400).json({
      error: `Daily bonus is on cooldown. Please wait ${remainingMins} minutes.`,
      remainingMs,
    });
  }

  const bonusAmount = state.config.dailyBonusAmount;
  player.lastDailyBonusClaim = now;
  player.balance += bonusAmount;
  recordTransaction(player, 'bonus', 'wallet', bonusAmount, 'Daily play-money bonus claimed');
  addAuditLog('player', 'DAILY_BONUS_CLAIMED', `Claimed daily bonus of ${bonusAmount} chips`, player.id);

  res.json({ success: true, bonusAmount, balance: player.balance, nextAvailable: now + cooldownMs });
});

app.post('/api/wallet/reset-practice', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Active player not found' });
  if (!state.config.allowBalanceReset) {
    return res.status(403).json({ error: 'Balance resets are currently disabled by the administrator' });
  }

  const diff = state.config.startingBalance - player.balance;
  player.balance = state.config.startingBalance;
  recordTransaction(player, 'reset', 'wallet', diff, `Practice balance reset to ${state.config.startingBalance} chips`);
  addAuditLog('player', 'PRACTICE_RESET', `Reset practice balance to ${state.config.startingBalance}`, player.id);

  res.json({ success: true, balance: player.balance });
});

// Peer-to-Peer Transfer
app.post('/api/wallet/transfer', (req, res) => {
  if (!state.config.peerTransfersEnabled) {
    return res.status(403).json({ error: 'Peer transfers are currently disabled in casino settings' });
  }

  const sender = state.players[state.activePlayerId];
  if (!sender) return res.status(404).json({ error: 'Sender not found' });
  if (sender.isFrozen) return res.status(403).json({ error: 'Your account is frozen and cannot transfer chips' });

  const { recipientId, amount, memo } = req.body;
  const numAmount = parseInt(amount, 10);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Transfer amount must be a positive number' });
  }
  if (numAmount > state.config.maxTransferAmount) {
    return res.status(400).json({ error: `Transfer exceeds limit of ${state.config.maxTransferAmount} chips` });
  }
  if (sender.balance < numAmount) {
    return res.status(400).json({ error: 'Insufficient chip balance for transfer' });
  }
  if (!recipientId || !state.players[recipientId]) {
    return res.status(404).json({ error: 'Recipient player not found' });
  }
  if (recipientId === sender.id) {
    return res.status(400).json({ error: 'Cannot transfer chips to yourself' });
  }

  const recipient = state.players[recipientId];
  const feePercent = state.config.transferFeePercent || 0;
  const fee = Math.floor((numAmount * feePercent) / 100);
  const netReceived = numAmount - fee;

  // Deduct from sender
  sender.balance -= numAmount;
  recordTransaction(
    sender,
    'transfer_out',
    'transfer',
    -numAmount,
    `Transfer to ${recipient.username}: ${memo || 'Play chips'}`,
    { recipientId, memo, fee }
  );

  // Credit recipient
  recipient.balance += netReceived;
  recordTransaction(
    recipient,
    'transfer_in',
    'transfer',
    netReceived,
    `Transfer received from ${sender.username}: ${memo || 'Play chips'}`,
    { senderId: sender.id, memo, fee }
  );

  addAuditLog(
    'player',
    'PEER_TRANSFER',
    `Transferred ${numAmount} chips from ${sender.username} to ${recipient.username} (Fee: ${fee})`,
    sender.id
  );

  res.json({
    success: true,
    senderBalance: sender.balance,
    transferred: numAmount,
    fee,
    recipientUsername: recipient.username,
  });
});

app.get('/api/wallet/transactions/:playerId', (req, res) => {
  const { playerId } = req.params;
  const txs = state.transactions.filter((t) => t.playerId === playerId).slice(0, 100);
  res.json({ transactions: txs });
});

// Admin player adjustment & audit logs
app.post('/api/admin/players/:playerId/adjust', (req, res) => {
  const { playerId } = req.params;
  const { balanceAdjustment, setBalance, toggleFreeze } = req.body;

  const player = state.players[playerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });

  if (typeof toggleFreeze === 'boolean') {
    player.isFrozen = toggleFreeze;
    addAuditLog('admin', 'PLAYER_STATUS_TOGGLE', `Player ${player.username} frozen status: ${player.isFrozen}`, playerId);
  }

  if (typeof setBalance === 'number' && setBalance >= 0) {
    const diff = setBalance - player.balance;
    player.balance = setBalance;
    recordTransaction(player, 'admin_grant', 'system', diff, `Admin set balance to ${setBalance}`);
    addAuditLog('admin', 'ADMIN_SET_BALANCE', `Set ${player.username} balance to ${setBalance}`, playerId);
  } else if (typeof balanceAdjustment === 'number' && balanceAdjustment !== 0) {
    player.balance += balanceAdjustment;
    recordTransaction(
      player,
      'admin_grant',
      'system',
      balanceAdjustment,
      `Admin adjustment of ${balanceAdjustment > 0 ? '+' : ''}${balanceAdjustment} chips`
    );
    addAuditLog(
      'admin',
      'ADMIN_ADJUST_BALANCE',
      `Adjusted ${player.username} balance by ${balanceAdjustment}`,
      playerId
    );
  }

  saveState();
  res.json({ success: true, player });
});

app.get('/api/admin/audit-logs', (req, res) => {
  res.json({ logs: state.auditLogs.slice(0, 200) });
});

app.post('/api/admin/reset-system', (req, res) => {
  state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  state.players = Object.fromEntries(DEFAULT_PLAYERS.map((p) => [p.id, JSON.parse(JSON.stringify(p))]));
  state.activePlayerId = 'player_main';
  state.transactions = [];
  state.auditLogs = [];
  addAuditLog('admin', 'SYSTEM_RESET', 'All casino player balances, logs, and settings restored to factory defaults');
  saveState();
  res.json({ success: true, message: 'System reset to defaults' });
});

// ================= GAME LOGIC =================

// 1. SLOTS ENGINE
const SLOT_SYMBOLS: SlotSymbol[] = ['wild', 'seven', 'diamond', 'bell', 'bar', 'cherry'];

const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  cherry: 32,
  bar: 24,
  bell: 18,
  diamond: 12,
  seven: 8,
  wild: 4,
};

// Payout Multipliers for 3 matching symbols on payline
const SLOT_PAYOUTS: Record<SlotSymbol, number> = {
  wild: 150,
  seven: 60,
  diamond: 30,
  bell: 18,
  bar: 10,
  cherry: 6,
};

function pickRandomSymbol(): SlotSymbol {
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  for (const sym of SLOT_SYMBOLS) {
    if (rand < SYMBOL_WEIGHTS[sym]) return sym;
    rand -= SYMBOL_WEIGHTS[sym];
  }
  return 'cherry';
}

app.post('/api/games/slots/spin', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.slots;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Slots game is currently disabled by casino administrator' });
  }

  const { betPerLine, activeLines } = req.body;
  const numBetPerLine = parseInt(betPerLine, 10);
  const numActiveLines = Math.min(5, Math.max(1, parseInt(activeLines, 10) || 1));

  if (isNaN(numBetPerLine) || numBetPerLine < gameSettings.minBet) {
    return res.status(400).json({ error: `Minimum bet per line is ${gameSettings.minBet} chips` });
  }

  const totalBet = numBetPerLine * numActiveLines;
  if (totalBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Total bet cannot exceed ${gameSettings.maxBet} chips` });
  }
  if (player.balance < totalBet) {
    return res.status(400).json({ error: 'Insufficient balance to place bet' });
  }

  // Deduct initial bet
  player.balance -= totalBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += totalBet;

  // Generate 3x3 reel grid (reels[reelIndex][rowIndex])
  const reels: SlotSymbol[][] = [
    [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
    [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
    [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
  ];

  // Paylines definitions:
  // Line 0: Middle horizontal [1, 1, 1]
  // Line 1: Top horizontal [0, 0, 0]
  // Line 2: Bottom horizontal [2, 2, 2]
  // Line 3: Diagonal top-left to bottom-right [0, 1, 2]
  // Line 4: Diagonal bottom-left to top-right [2, 1, 0]
  const paylineRows: number[][] = [
    [1, 1, 1],
    [0, 0, 0],
    [2, 2, 2],
    [0, 1, 2],
    [2, 1, 0],
  ];

  const hits: SlotPaylineHit[] = [];
  let totalPayout = 0;

  for (let lineIdx = 0; lineIdx < numActiveLines; lineIdx++) {
    const rowCoords = paylineRows[lineIdx];
    const sym0 = reels[0][rowCoords[0]];
    const sym1 = reels[1][rowCoords[1]];
    const sym2 = reels[2][rowCoords[2]];

    // Evaluate match with wild substitution
    let matchSymbol: SlotSymbol | null = null;
    let isMatch = false;

    if (sym0 === 'wild' && sym1 === 'wild' && sym2 === 'wild') {
      matchSymbol = 'wild';
      isMatch = true;
    } else {
      const nonWild = [sym0, sym1, sym2].find((s) => s !== 'wild');
      if (nonWild) {
        if ((sym0 === nonWild || sym0 === 'wild') && (sym1 === nonWild || sym1 === 'wild') && (sym2 === nonWild || sym2 === 'wild')) {
          matchSymbol = nonWild;
          isMatch = true;
        }
      }
    }

    if (isMatch && matchSymbol) {
      const mult = SLOT_PAYOUTS[matchSymbol];
      const linePayout = numBetPerLine * mult;
      hits.push({
        lineIndex: lineIdx,
        symbol: matchSymbol,
        count: 3,
        multiplier: mult,
        payout: linePayout,
      });
      totalPayout += linePayout;
    } else if (sym0 === 'cherry' && sym1 === 'cherry') {
      // 2 cherries partial line pay
      const linePayout = numBetPerLine * 2;
      hits.push({
        lineIndex: lineIdx,
        symbol: 'cherry',
        count: 2,
        multiplier: 2,
        payout: linePayout,
      });
      totalPayout += linePayout;
    }
  }

  // Credit payout
  player.balance += totalPayout;
  player.stats.totalWon += totalPayout;
  const netGain = totalPayout - totalBet;
  player.stats.netProfit += netGain;
  if (totalPayout > player.stats.biggestWin) {
    player.stats.biggestWin = totalPayout;
  }
  if (netGain > 0) {
    player.stats.streak = (player.stats.streak || 0) + 1;
  } else {
    player.stats.streak = 0;
  }

  const provablyFair = getProvablyFairMeta();

  // Record transaction
  recordTransaction(
    player,
    netGain >= 0 ? 'win' : 'loss',
    'slots',
    netGain,
    `Slots Spin (${numActiveLines} lines x ${numBetPerLine}) - Won ${totalPayout}`,
    { totalBet, totalPayout, hitsCount: hits.length, nonce: provablyFair.nonce }
  );

  saveState();

  const result: SlotSpinResult = {
    reels,
    hits,
    totalPayout,
    betPerLine: numBetPerLine,
    activeLines: numActiveLines,
    totalBet,
    netGain,
    serverSeedHash: provablyFair.serverSeedHash,
    nonce: provablyFair.nonce,
  };

  res.json({ success: true, result, balance: player.balance });
});

// 2. BLACKJACK ENGINE
const SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣'];
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const val of CARD_VALUES) {
      let points = parseInt(val, 10);
      if (['J', 'Q', 'K'].includes(val)) points = 10;
      if (val === 'A') points = 11;
      deck.push({ suit, value: val, points });
    }
  }
  // Shuffle Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHandScore(cards: Card[]): number {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.hidden) continue;
    score += card.points;
    if (card.value === 'A') aces += 1;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

app.post('/api/games/blackjack/deal', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.blackjack;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Blackjack game is currently disabled by administrator' });
  }

  const { bet } = req.body;
  const numBet = parseInt(bet, 10);

  if (isNaN(numBet) || numBet < gameSettings.minBet || numBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}` });
  }
  if (player.balance < numBet) {
    return res.status(400).json({ error: 'Insufficient balance to place bet' });
  }

  // Deduct bet
  player.balance -= numBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += numBet;

  const deck = createDeck();
  const playerCards = [deck.pop()!, deck.pop()!];
  const dealerCards = [deck.pop()!, { ...deck.pop()!, hidden: true }];

  const playerScore = calculateHandScore(playerCards);
  const dealerVisibleScore = calculateHandScore([dealerCards[0]]);

  const handId = 'bj_' + Date.now();
  const naturalPayoutMultiplier = state.config.blackjackNaturalPayout || 1.5;

  let status: BlackjackState['status'] = 'player_turn';
  let payout = 0;

  // Check natural 21 blackjack
  if (playerScore === 21) {
    // Unhide dealer
    dealerCards[1].hidden = false;
    const dealerFullScore = calculateHandScore(dealerCards);
    if (dealerFullScore === 21) {
      status = 'push';
      payout = numBet; // Return original bet
    } else {
      status = 'player_blackjack';
      payout = Math.floor(numBet + numBet * naturalPayoutMultiplier);
    }
  }

  if (status !== 'player_turn') {
    player.balance += payout;
    player.stats.totalWon += payout;
    const net = payout - numBet;
    player.stats.netProfit += net;
    recordTransaction(
      player,
      status === 'push' ? 'push' : 'win',
      'blackjack',
      net,
      `Blackjack Natural - ${status === 'player_blackjack' ? 'Won 3:2' : 'Push'}`,
      { bet: numBet, payout }
    );
  }

  const handState: BlackjackState = {
    id: handId,
    playerId: player.id,
    bet: numBet,
    playerCards,
    dealerCards,
    playerScore,
    dealerScore: status === 'player_turn' ? dealerVisibleScore : calculateHandScore(dealerCards),
    status,
    payout,
    canDouble: status === 'player_turn' && player.balance >= numBet,
    canSplit: status === 'player_turn' && playerCards[0].value === playerCards[1].value && player.balance >= numBet,
  };

  if (status === 'player_turn') {
    state.activeBlackjackHands[handId] = handState;
  }

  saveState();
  res.json({ success: true, hand: handState, balance: player.balance });
});

app.post('/api/games/blackjack/action', (req, res) => {
  const { handId, action } = req.body;
  const hand = state.activeBlackjackHands[handId];
  if (!hand) {
    return res.status(404).json({ error: 'No active hand found. Deal a new hand to play.' });
  }

  const player = state.players[hand.playerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const deck = createDeck(); // Draw cards

  if (action === 'hit') {
    const newCard = deck.pop()!;
    hand.playerCards.push(newCard);
    hand.playerScore = calculateHandScore(hand.playerCards);
    hand.canDouble = false;
    hand.canSplit = false;

    if (hand.playerScore > 21) {
      // Bust
      hand.status = 'player_bust';
      hand.dealerCards[1].hidden = false;
      hand.dealerScore = calculateHandScore(hand.dealerCards);
      hand.payout = 0;
      delete state.activeBlackjackHands[handId];

      player.stats.netProfit -= hand.bet;
      recordTransaction(player, 'loss', 'blackjack', -hand.bet, `Blackjack Bust (${hand.playerScore})`);
    } else if (hand.playerScore === 21) {
      // Auto stand on 21
      return resolveDealerTurn(hand, player, res);
    }
  } else if (action === 'double') {
    if (player.balance < hand.bet) {
      return res.status(400).json({ error: 'Insufficient balance to double down' });
    }
    // Deduct double bet
    player.balance -= hand.bet;
    player.stats.totalWagered += hand.bet;
    hand.bet *= 2;

    const newCard = deck.pop()!;
    hand.playerCards.push(newCard);
    hand.playerScore = calculateHandScore(hand.playerCards);
    hand.canDouble = false;
    hand.canSplit = false;

    if (hand.playerScore > 21) {
      hand.status = 'player_bust';
      hand.dealerCards[1].hidden = false;
      hand.dealerScore = calculateHandScore(hand.dealerCards);
      hand.payout = 0;
      delete state.activeBlackjackHands[handId];
      player.stats.netProfit -= hand.bet;
      recordTransaction(player, 'loss', 'blackjack', -hand.bet, `Blackjack Double Down Bust (${hand.playerScore})`);
    } else {
      return resolveDealerTurn(hand, player, res);
    }
  } else if (action === 'stand') {
    return resolveDealerTurn(hand, player, res);
  } else {
    return res.status(400).json({ error: 'Invalid action. Allowed: hit, stand, double' });
  }

  saveState();
  res.json({ success: true, hand, balance: player.balance });
});

function resolveDealerTurn(hand: BlackjackState, player: Player, res: express.Response) {
  hand.dealerCards[1].hidden = false;
  let dealerScore = calculateHandScore(hand.dealerCards);

  // Dealer hits on soft 17 or under
  const deck = createDeck();
  while (dealerScore < 17) {
    hand.dealerCards.push(deck.pop()!);
    dealerScore = calculateHandScore(hand.dealerCards);
  }
  hand.dealerScore = dealerScore;

  let payout = 0;
  if (dealerScore > 21) {
    hand.status = 'dealer_bust';
    payout = hand.bet * 2;
  } else if (hand.playerScore > dealerScore) {
    hand.status = 'player_won';
    payout = hand.bet * 2;
  } else if (hand.playerScore < dealerScore) {
    hand.status = 'dealer_won';
    payout = 0;
  } else {
    hand.status = 'push';
    payout = hand.bet;
  }

  hand.payout = payout;
  player.balance += payout;
  player.stats.totalWon += payout;
  const net = payout - hand.bet;
  player.stats.netProfit += net;

  delete state.activeBlackjackHands[hand.id];

  recordTransaction(
    player,
    net > 0 ? 'win' : net === 0 ? 'push' : 'loss',
    'blackjack',
    net,
    `Blackjack End: Player ${hand.playerScore} vs Dealer ${hand.dealerScore} (${hand.status})`,
    { bet: hand.bet, payout, status: hand.status }
  );

  saveState();
  res.json({ success: true, hand, balance: player.balance });
}

// 3. ROULETTE ENGINE
const ROULETTE_RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

app.post('/api/games/roulette/spin', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.roulette;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Roulette game is currently disabled by administrator' });
  }

  const { bets } = req.body as { bets: RouletteBetItem[] };
  if (!bets || !Array.isArray(bets) || bets.length === 0) {
    return res.status(400).json({ error: 'Please place at least one bet on the roulette board' });
  }

  const totalBet = bets.reduce((sum, b) => sum + (b.amount || 0), 0);
  if (totalBet < gameSettings.minBet || totalBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Total bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}` });
  }
  if (player.balance < totalBet) {
    return res.status(400).json({ error: 'Insufficient balance to place roulette bets' });
  }

  // Deduct bet
  player.balance -= totalBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += totalBet;

  // Spin wheel: European roulette (0 to 36)
  const winningNumber = Math.floor(Math.random() * 37);
  let winningColor: 'red' | 'black' | 'green' = 'green';
  if (winningNumber !== 0) {
    winningColor = ROULETTE_RED_NUMBERS.includes(winningNumber) ? 'red' : 'black';
  }

  let totalPayout = 0;
  const winningBets: { bet: RouletteBetItem; payout: number }[] = [];

  for (const bet of bets) {
    let won = false;
    let multiplier = 0;

    switch (bet.type) {
      case 'straight':
        if (bet.numbers.includes(winningNumber)) {
          won = true;
          multiplier = 36; // 35:1 plus bet back
        }
        break;
      case 'split':
        if (bet.numbers.includes(winningNumber)) {
          won = true;
          multiplier = 18; // 17:1 plus bet back
        }
        break;
      case 'street':
        if (bet.numbers.includes(winningNumber)) {
          won = true;
          multiplier = 12; // 11:1
        }
        break;
      case 'corner':
        if (bet.numbers.includes(winningNumber)) {
          won = true;
          multiplier = 9; // 8:1
        }
        break;
      case 'sixline':
        if (bet.numbers.includes(winningNumber)) {
          won = true;
          multiplier = 6; // 5:1
        }
        break;
      case 'column':
      case 'dozen':
        if (bet.numbers.includes(winningNumber)) {
          won = true;
          multiplier = 3; // 2:1
        }
        break;
      case 'red':
        if (winningColor === 'red') {
          won = true;
          multiplier = 2; // 1:1
        }
        break;
      case 'black':
        if (winningColor === 'black') {
          won = true;
          multiplier = 2; // 1:1
        }
        break;
      case 'even':
        if (winningNumber !== 0 && winningNumber % 2 === 0) {
          won = true;
          multiplier = 2;
        }
        break;
      case 'odd':
        if (winningNumber !== 0 && winningNumber % 2 !== 0) {
          won = true;
          multiplier = 2;
        }
        break;
      case 'low': // 1-18
        if (winningNumber >= 1 && winningNumber <= 18) {
          won = true;
          multiplier = 2;
        }
        break;
      case 'high': // 19-36
        if (winningNumber >= 19 && winningNumber <= 36) {
          won = true;
          multiplier = 2;
        }
        break;
    }

    if (won && multiplier > 0) {
      const payout = bet.amount * multiplier;
      totalPayout += payout;
      winningBets.push({ bet, payout });
    }
  }

  // Credit payout
  player.balance += totalPayout;
  player.stats.totalWon += totalPayout;
  const netGain = totalPayout - totalBet;
  player.stats.netProfit += netGain;

  if (totalPayout > player.stats.biggestWin) {
    player.stats.biggestWin = totalPayout;
  }

  const provablyFair = getProvablyFairMeta();

  recordTransaction(
    player,
    netGain >= 0 ? 'win' : 'loss',
    'roulette',
    netGain,
    `Roulette Spin: Landed on ${winningNumber} (${winningColor.toUpperCase()}) - Won ${totalPayout}`,
    { winningNumber, winningColor, totalBet, totalPayout, winningBetsCount: winningBets.length }
  );

  saveState();

  const result: RouletteSpinResult = {
    winningNumber,
    winningColor,
    totalBet,
    totalPayout,
    winningBets,
    serverSeedHash: provablyFair.serverSeedHash,
    nonce: provablyFair.nonce,
  };

  res.json({ success: true, result, balance: player.balance });
});

// 4. DICE ENGINE
app.post('/api/games/dice/roll', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.dice;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Dice game is currently disabled by administrator' });
  }

  const { mode, bet, target, condition, crapsBetType } = req.body;
  const numBet = parseInt(bet, 10);

  if (isNaN(numBet) || numBet < gameSettings.minBet || numBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}` });
  }
  if (player.balance < numBet) {
    return res.status(400).json({ error: 'Insufficient balance to place bet' });
  }

  // Deduct bet
  player.balance -= numBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += numBet;

  const provablyFair = getProvablyFairMeta();

  if (mode === 'craps') {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const sum = die1 + die2;

    let won = false;
    let push = false;
    let multiplier = 0;

    switch (crapsBetType) {
      case 'pass':
        if ([7, 11].includes(sum)) {
          won = true;
          multiplier = 2; // 1:1
        } else if ([2, 3, 12].includes(sum)) {
          won = false;
        } else {
          // Simplified table: 4,5,6,8,9,10 point hit
          won = Math.random() < 0.49;
          multiplier = won ? 2 : 0;
        }
        break;
      case 'dont_pass':
        if ([2, 3].includes(sum)) {
          won = true;
          multiplier = 2;
        } else if (sum === 12) {
          push = true;
          multiplier = 1;
        } else if ([7, 11].includes(sum)) {
          won = false;
        } else {
          won = Math.random() < 0.49;
          multiplier = won ? 2 : 0;
        }
        break;
      case 'field':
        // Field pays on 2, 3, 4, 9, 10, 11, 12
        if ([3, 4, 9, 10, 11].includes(sum)) {
          won = true;
          multiplier = 2;
        } else if (sum === 2) {
          won = true;
          multiplier = 3; // 2:1
        } else if (sum === 12) {
          won = true;
          multiplier = 4; // 3:1
        }
        break;
      case 'craps_seven':
        if (sum === 7) {
          won = true;
          multiplier = 5; // 4:1
        }
        break;
    }

    const payout = push ? numBet : won ? numBet * multiplier : 0;
    player.balance += payout;
    player.stats.totalWon += payout;
    const netGain = payout - numBet;
    player.stats.netProfit += netGain;

    recordTransaction(
      player,
      push ? 'push' : netGain >= 0 ? 'win' : 'loss',
      'dice',
      netGain,
      `Craps Dice Roll: [${die1}, ${die2}] = ${sum} (${crapsBetType}) - Won ${payout}`,
      { die1, die2, sum, crapsBetType, payout }
    );

    saveState();

    const crapsResult: CrapsDiceResult = {
      die1,
      die2,
      sum,
      betType: crapsBetType,
      won,
      push,
      multiplier,
      bet: numBet,
      payout,
    };

    return res.json({ success: true, mode: 'craps', result: crapsResult, balance: player.balance });
  }

  // Multiplier / Hi-Lo Slider Mode
  const numTarget = Math.min(98, Math.max(2, parseFloat(target) || 50));
  const cond: 'over' | 'under' = condition === 'under' ? 'under' : 'over';
  const rolledNumber = Math.round((Math.random() * 99.99) * 100) / 100;

  const winChance = cond === 'over' ? 100 - numTarget : numTarget;
  const houseEdge = state.config.games.dice.houseEdgePercent / 100;
  const rawMultiplier = (100 * (1 - houseEdge)) / winChance;
  const multiplier = Math.round(rawMultiplier * 100) / 100;

  const won = cond === 'over' ? rolledNumber > numTarget : rolledNumber < numTarget;
  const payout = won ? Math.floor(numBet * multiplier) : 0;

  player.balance += payout;
  player.stats.totalWon += payout;
  const netGain = payout - numBet;
  player.stats.netProfit += netGain;

  if (payout > player.stats.biggestWin) {
    player.stats.biggestWin = payout;
  }

  recordTransaction(
    player,
    won ? 'win' : 'loss',
    'dice',
    netGain,
    `Dice Multiplier Roll: Rolled ${rolledNumber} (Target ${cond} ${numTarget}, ${multiplier}x) - ${won ? 'Won' : 'Lost'}`,
    { rolledNumber, numTarget, cond, multiplier, payout }
  );

  saveState();

  const multResult: MultiplierDiceResult = {
    target: numTarget,
    condition: cond,
    rolledNumber,
    winChance: Math.round(winChance * 100) / 100,
    multiplier,
    won,
    bet: numBet,
    payout,
    serverSeedHash: provablyFair.serverSeedHash,
    nonce: provablyFair.nonce,
  };

  res.json({ success: true, mode: 'multiplier', result: multResult, balance: player.balance });
});

// 5. VIDEO POKER ENGINE (Jacks or Better)
function evaluatePokerHand(cards: Card[]): { rank: PokerHandRank; name: string; multiplier: number } {
  const valMap: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  const vals = cards.map((c) => valMap[c.value]).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = false;
  let isRoyal = false;
  if (vals[4] - vals[0] === 4 && new Set(vals).size === 5) {
    isStraight = true;
    if (vals[4] === 14 && vals[0] === 10) isRoyal = true;
  } else if (vals[0] === 2 && vals[1] === 3 && vals[2] === 4 && vals[3] === 5 && vals[4] === 14) {
    // Ace-low straight
    isStraight = true;
  }

  const counts: Record<number, number> = {};
  vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  const freqs = Object.values(counts).sort((a, b) => b - a);

  if (isFlush && isRoyal) return { rank: 'royal_flush', name: 'Royal Flush', multiplier: 250 };
  if (isFlush && isStraight) return { rank: 'straight_flush', name: 'Straight Flush', multiplier: 50 };
  if (freqs[0] === 4) return { rank: 'four_of_a_kind', name: 'Four of a Kind', multiplier: 25 };
  if (freqs[0] === 3 && freqs[1] === 2) return { rank: 'full_house', name: 'Full House', multiplier: 9 };
  if (isFlush) return { rank: 'flush', name: 'Flush', multiplier: 6 };
  if (isStraight) return { rank: 'straight', name: 'Straight', multiplier: 4 };
  if (freqs[0] === 3) return { rank: 'three_of_a_kind', name: 'Three of a Kind', multiplier: 3 };
  if (freqs[0] === 2 && freqs[1] === 2) return { rank: 'two_pair', name: 'Two Pair', multiplier: 2 };
  if (freqs[0] === 2) {
    const pairVal = Number(Object.keys(counts).find((k) => counts[Number(k)] === 2));
    if (pairVal >= 11) return { rank: 'jacks_or_better', name: 'Jacks or Better', multiplier: 1 };
  }
  return { rank: 'high_card', name: 'High Card (No Win)', multiplier: 0 };
}

app.post('/api/games/videopoker/deal', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.videopoker;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Video Poker is currently disabled by administrator' });
  }

  const { bet } = req.body;
  const numBet = parseInt(bet, 10);
  if (isNaN(numBet) || numBet < gameSettings.minBet || numBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}` });
  }
  if (player.balance < numBet) {
    return res.status(400).json({ error: 'Insufficient balance to place bet' });
  }

  player.balance -= numBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += numBet;

  const deck = createDeck();
  const hand: Card[] = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];
  const evalResult = evaluatePokerHand(hand);
  const gameId = 'vp_' + crypto.randomUUID().slice(0, 8);

  state.activeVideoPokerGames[gameId] = {
    deck,
    hand,
    bet: numBet,
  };

  const provablyFair = getProvablyFairMeta();
  saveState();

  const pokerState: VideoPokerState = {
    gameId,
    phase: 'holding',
    hand,
    held: [false, false, false, false, false],
    bet: numBet,
    handRank: evalResult.rank,
    handName: evalResult.name,
    multiplier: evalResult.multiplier,
    serverSeedHash: provablyFair.serverSeedHash,
  };

  res.json({ success: true, state: pokerState, balance: player.balance });
});

app.post('/api/games/videopoker/draw', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const { gameId, held } = req.body;
  const game = state.activeVideoPokerGames[gameId];
  if (!game) {
    return res.status(404).json({ error: 'Active Video Poker session not found' });
  }

  const heldArray: boolean[] = Array.isArray(held) ? held : [false, false, false, false, false];
  const finalHand: Card[] = [...game.hand];

  for (let i = 0; i < 5; i++) {
    if (!heldArray[i]) {
      finalHand[i] = game.deck.pop()!;
    }
  }

  const evalResult = evaluatePokerHand(finalHand);
  const payout = game.bet * evalResult.multiplier;

  player.balance += payout;
  player.stats.totalWon += payout;
  const netGain = payout - game.bet;
  player.stats.netProfit += netGain;

  if (payout > player.stats.biggestWin) {
    player.stats.biggestWin = payout;
  }
  if (netGain > 0) {
    player.stats.streak = (player.stats.streak || 0) + 1;
  } else {
    player.stats.streak = 0;
  }

  delete state.activeVideoPokerGames[gameId];

  recordTransaction(
    player,
    payout > 0 ? 'win' : 'loss',
    'videopoker' as GameType,
    netGain,
    `Video Poker: ${evalResult.name} (${evalResult.multiplier}x) - ${payout > 0 ? 'Won ' + payout : 'Lost'}`,
    { bet: game.bet, payout, handRank: evalResult.rank }
  );

  saveState();

  const provablyFair = getProvablyFairMeta();
  const pokerState: VideoPokerState = {
    gameId,
    phase: 'finished',
    hand: finalHand,
    held: heldArray,
    bet: game.bet,
    handRank: evalResult.rank,
    handName: evalResult.name,
    multiplier: evalResult.multiplier,
    payout,
    serverSeedHash: provablyFair.serverSeedHash,
  };

  res.json({ success: true, state: pokerState, balance: player.balance });
});

// 6. BACCARAT ENGINE (Punto Banco)
function getBaccaratPoint(card: Card): number {
  if (['10', 'J', 'Q', 'K'].includes(card.value)) return 0;
  if (card.value === 'A') return 1;
  return parseInt(card.value, 10);
}

function calculateBaccaratScore(cards: Card[]): number {
  const sum = cards.reduce((acc, c) => acc + getBaccaratPoint(c), 0);
  return sum % 10;
}

app.post('/api/games/baccarat/play', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.baccarat;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Baccarat is currently disabled by administrator' });
  }

  const { bets } = req.body as { bets: BaccaratBetItem[] };
  if (!Array.isArray(bets) || bets.length === 0) {
    return res.status(400).json({ error: 'No bets placed' });
  }

  const totalBet = bets.reduce((sum, b) => sum + (parseInt(String(b.amount), 10) || 0), 0);
  if (totalBet < gameSettings.minBet || totalBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Total bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}` });
  }
  if (player.balance < totalBet) {
    return res.status(400).json({ error: 'Insufficient balance to place bets' });
  }

  player.balance -= totalBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += totalBet;

  const deck = createDeck();
  const playerHand: Card[] = [deck.pop()!, deck.pop()!];
  const bankerHand: Card[] = [deck.pop()!, deck.pop()!];

  let pScore = calculateBaccaratScore(playerHand);
  let bScore = calculateBaccaratScore(bankerHand);
  const isNatural = pScore >= 8 || bScore >= 8;

  if (!isNatural) {
    let p3: Card | null = null;
    if (pScore <= 5) {
      p3 = deck.pop()!;
      playerHand.push(p3);
      pScore = calculateBaccaratScore(playerHand);
    }

    if (!p3) {
      // Player stood on 6 or 7
      if (bScore <= 5) {
        bankerHand.push(deck.pop()!);
        bScore = calculateBaccaratScore(bankerHand);
      }
    } else {
      // Player drew 3rd card
      const p3Val = getBaccaratPoint(p3);
      let bankerDraws = false;
      if (bScore <= 2) bankerDraws = true;
      else if (bScore === 3 && p3Val !== 8) bankerDraws = true;
      else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
      else if (bScore === 5 && [4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
      else if (bScore === 6 && [6, 7].includes(p3Val)) bankerDraws = true;

      if (bankerDraws) {
        bankerHand.push(deck.pop()!);
        bScore = calculateBaccaratScore(bankerHand);
      }
    }
  }

  const winner: 'player' | 'banker' | 'tie' =
    pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';

  const playerPair = playerHand[0].value === playerHand[1].value;
  const bankerPair = bankerHand[0].value === bankerHand[1].value;

  const betOutcomes: BaccaratBetOutcome[] = [];
  let totalPayout = 0;

  for (const bet of bets) {
    const amt = parseInt(String(bet.amount), 10);
    let won = false;
    let push = false;
    let payout = 0;

    switch (bet.betType) {
      case 'player':
        if (winner === 'player') {
          won = true;
          payout = amt * 2; // 1:1
        } else if (winner === 'tie') {
          push = true;
          payout = amt; // refund
        }
        break;
      case 'banker':
        if (winner === 'banker') {
          won = true;
          payout = Math.floor(amt * 1.95); // 0.95:1 (5% commission)
        } else if (winner === 'tie') {
          push = true;
          payout = amt;
        }
        break;
      case 'tie':
        if (winner === 'tie') {
          won = true;
          payout = amt * 9; // 8:1 payout
        }
        break;
      case 'player_pair':
        if (playerPair) {
          won = true;
          payout = amt * 12; // 11:1 payout
        }
        break;
      case 'banker_pair':
        if (bankerPair) {
          won = true;
          payout = amt * 12; // 11:1 payout
        }
        break;
    }

    totalPayout += payout;
    betOutcomes.push({
      betType: bet.betType,
      amount: amt,
      won,
      push,
      payout,
    });
  }

  player.balance += totalPayout;
  player.stats.totalWon += totalPayout;
  const netGain = totalPayout - totalBet;
  player.stats.netProfit += netGain;

  if (totalPayout > player.stats.biggestWin) {
    player.stats.biggestWin = totalPayout;
  }
  if (netGain > 0) {
    player.stats.streak = (player.stats.streak || 0) + 1;
  } else if (netGain < 0) {
    player.stats.streak = 0;
  }

  const provablyFair = getProvablyFairMeta();
  recordTransaction(
    player,
    netGain >= 0 ? 'win' : 'loss',
    'baccarat' as GameType,
    netGain,
    `Baccarat (${winner.toUpperCase()} won ${pScore} vs ${bScore}) - Payout ${totalPayout}`,
    { winner, pScore, bScore, totalBet, totalPayout }
  );

  saveState();

  const result: BaccaratResult = {
    playerHand,
    bankerHand,
    playerScore: pScore,
    bankerScore: bScore,
    winner,
    playerPair,
    bankerPair,
    isNatural,
    bets: betOutcomes,
    totalBet,
    totalPayout,
    serverSeedHash: provablyFair.serverSeedHash,
  };

  res.json({ success: true, result, balance: player.balance });
});

// 7. PLINKO ENGINE
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

app.post('/api/games/plinko/drop', (req, res) => {
  const player = state.players[state.activePlayerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.isFrozen) return res.status(403).json({ error: 'Account is frozen' });

  const gameSettings = state.config.games.plinko;
  if (!gameSettings.enabled) {
    return res.status(403).json({ error: 'Plinko is currently disabled by administrator' });
  }

  const { bet, rows = 12, risk = 'medium' } = req.body;
  const numBet = parseInt(bet, 10);
  const numRows = [8, 12, 16].includes(Number(rows)) ? Number(rows) : 12;
  const riskLevel: PlinkoRisk = ['low', 'medium', 'high'].includes(risk) ? risk : 'medium';

  if (isNaN(numBet) || numBet < gameSettings.minBet || numBet > gameSettings.maxBet) {
    return res.status(400).json({ error: `Bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}` });
  }
  if (player.balance < numBet) {
    return res.status(400).json({ error: 'Insufficient balance to drop ball' });
  }

  player.balance -= numBet;
  player.stats.gamesPlayed += 1;
  player.stats.totalWagered += numBet;

  // Generate bounce path (0 = Left, 1 = Right)
  const directions: number[] = [];
  let slotIndex = 0;
  for (let r = 0; r < numRows; r++) {
    const dir = Math.random() < 0.5 ? 0 : 1;
    directions.push(dir);
    slotIndex += dir;
  }

  const payTable = PLINKO_PAYOUTS[numRows][riskLevel];
  const multiplier = payTable[slotIndex] || 1;
  const payout = Math.floor(numBet * multiplier);

  player.balance += payout;
  player.stats.totalWon += payout;
  const netGain = payout - numBet;
  player.stats.netProfit += netGain;

  if (payout > player.stats.biggestWin) {
    player.stats.biggestWin = payout;
  }
  if (multiplier >= 1) {
    player.stats.streak = (player.stats.streak || 0) + 1;
  } else {
    player.stats.streak = 0;
  }

  const provablyFair = getProvablyFairMeta();
  recordTransaction(
    player,
    netGain >= 0 ? 'win' : 'loss',
    'plinko' as GameType,
    netGain,
    `Plinko Drop (${numRows} rows, ${riskLevel} risk) - Slot ${slotIndex} (${multiplier}x) - ${payout > 0 ? 'Won ' + payout : 'Lost'}`,
    { rows: numRows, risk: riskLevel, slotIndex, multiplier, payout }
  );

  saveState();

  const result: PlinkoResult = {
    rows: numRows,
    risk: riskLevel,
    bet: numBet,
    directions,
    slotIndex,
    multiplier,
    payout,
    serverSeedHash: provablyFair.serverSeedHash,
  };

  res.json({ success: true, result, balance: player.balance });
});

// 8. EXPERIMENT LAB - MONTE CARLO SIMULATOR
app.post('/api/experiment/simulate', (req, res) => {
  const {
    game = 'roulette',
    strategy = 'flat',
    initialBankroll = 5000,
    baseBet = 50,
    roundsCount = 100,
    maxBet = 5000,
  } = req.body as {
    game: GameType;
    strategy: BettingStrategy;
    initialBankroll: number;
    baseBet: number;
    roundsCount: number;
    maxBet: number;
  };

  const rounds = Math.min(1000, Math.max(10, parseInt(String(roundsCount), 10) || 100));
  const bankrollInit = Math.max(100, parseInt(String(initialBankroll), 10) || 5000);
  const minBase = Math.max(1, parseInt(String(baseBet), 10) || 50);
  const limitBet = Math.max(minBase, parseInt(String(maxBet), 10) || 5000);

  let currentBankroll = bankrollInit;
  let currentBet = minBase;
  let peakBankroll = bankrollInit;
  let maxDrawdown = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let totalWagered = 0;
  let totalWon = 0;
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let bustedAtRound: number | null = null;

  const history: SimulationRoundResult[] = [];
  history.push({ round: 0, bet: 0, won: true, netRound: 0, balance: currentBankroll });

  // Fibonacci sequence helper
  const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
  let fibIndex = 0;

  // Win probability based on game type
  let winProb = 0.486; // European roulette even-money (18/37 = 48.6%)
  let payoutRatio = 1.0; // 1:1 payout

  if (game === 'blackjack') {
    winProb = 0.495; // Blackjack basic strategy (~49.5% effective RTP 99.5%)
    payoutRatio = 1.0;
  } else if (game === 'dice') {
    winProb = 0.495; // 50/50 dice with 1% house edge
    payoutRatio = 0.98;
  } else if (game === 'slots') {
    winProb = 0.32; // Higher volatility slot hit rate
    payoutRatio = 2.8; // Average hit pays ~2.8x
  }

  for (let r = 1; r <= rounds; r++) {
    if (currentBankroll <= 0) {
      if (bustedAtRound === null) bustedAtRound = r;
      history.push({ round: r, bet: 0, won: false, netRound: 0, balance: 0 });
      continue;
    }

    // Determine bet size according to strategy
    let betAmount = currentBet;
    if (strategy === 'fibonacci') {
      betAmount = minBase * (fib[fibIndex] || fib[fib.length - 1]);
    }

    betAmount = Math.min(betAmount, limitBet, currentBankroll);
    if (betAmount <= 0) {
      if (bustedAtRound === null) bustedAtRound = r;
      history.push({ round: r, bet: 0, won: false, netRound: 0, balance: currentBankroll });
      continue;
    }

    totalWagered += betAmount;
    currentBankroll -= betAmount;

    // Simulate outcome
    const isWin = Math.random() < winProb;

    let netRound = 0;
    if (isWin) {
      wins += 1;
      const winPayout = Math.floor(betAmount * (1 + payoutRatio));
      currentBankroll += winPayout;
      totalWon += winPayout;
      netRound = winPayout - betAmount;

      if (currentStreak > 0) currentStreak += 1;
      else currentStreak = 1;
      if (currentStreak > longestWinStreak) longestWinStreak = currentStreak;

      // Update strategy next bet
      if (strategy === 'martingale') {
        currentBet = minBase; // Reset
      } else if (strategy === 'paroli') {
        currentBet = Math.min(currentBet * 2, limitBet); // Double on win
      } else if (strategy === 'dalembert') {
        currentBet = Math.max(minBase, currentBet - minBase);
      } else if (strategy === 'fibonacci') {
        fibIndex = Math.max(0, fibIndex - 2);
      }
    } else {
      losses += 1;
      netRound = -betAmount;

      if (currentStreak < 0) currentStreak -= 1;
      else currentStreak = -1;
      if (Math.abs(currentStreak) > longestLossStreak) longestLossStreak = Math.abs(currentStreak);

      // Update strategy next bet
      if (strategy === 'martingale') {
        currentBet = Math.min(currentBet * 2, limitBet); // Double on loss
      } else if (strategy === 'paroli') {
        currentBet = minBase; // Reset
      } else if (strategy === 'dalembert') {
        currentBet = Math.min(limitBet, currentBet + minBase);
      } else if (strategy === 'fibonacci') {
        fibIndex = Math.min(fib.length - 1, fibIndex + 1);
      }
    }

    if (currentBankroll > peakBankroll) {
      peakBankroll = currentBankroll;
    }
    const currentDrawdown = ((peakBankroll - currentBankroll) / peakBankroll) * 100;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    history.push({
      round: r,
      bet: betAmount,
      won: isWin,
      netRound,
      balance: currentBankroll,
    });
  }

  const winRatePercent = Math.round((wins / (wins + losses || 1)) * 1000) / 10;
  const observedRtpPercent = totalWagered > 0 ? Math.round((totalWon / totalWagered) * 1000) / 10 : 100;

  const simResult: SimulationResult = {
    strategy,
    game,
    roundsCount: rounds,
    initialBankroll: bankrollInit,
    finalBankroll: currentBankroll,
    totalWagered,
    totalWon,
    wins,
    losses,
    pushes,
    winRatePercent,
    observedRtpPercent,
    maxDrawdownPercent: Math.round(maxDrawdown * 10) / 10,
    longestWinStreak,
    longestLossStreak,
    bustedAtRound,
    history,
  };

  res.json({ success: true, result: simResult });
});

// Setup server integration with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Grand Royale Casino Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
