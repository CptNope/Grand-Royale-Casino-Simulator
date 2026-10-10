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
} from '../types/casino.ts';

const LOCAL_STORAGE_KEY = 'grand_royale_casino_static_state';

const DEFAULT_CONFIG: CasinoConfig = {
  startingBalance: 5000,
  dailyBonusAmount: 1000,
  dailyBonusCooldownHours: 24,
  allowBalanceReset: true,
  peerTransfersEnabled: true,
  maxTransferAmount: 10000,
  transferFeePercent: 0,
  blackjackNaturalPayout: 1.5,
  slotRtpProfile: 'standard',
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

interface EngineState {
  config: CasinoConfig;
  players: Record<string, Player>;
  activePlayerId: string;
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
  activeBlackjackHands: Record<string, BlackjackState>;
  activeVideoPokerGames: Record<string, { deck: Card[]; hand: Card[]; bet: number }>;
  nonce: number;
}

class LocalCasinoEngine {
  private state: EngineState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): EngineState {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.config && parsed.players) {
          if (!parsed.activeVideoPokerGames) parsed.activeVideoPokerGames = {};
          if (!parsed.config.games.videopoker) {
            parsed.config.games.videopoker = { enabled: true, minBet: 10, maxBet: 2500, houseEdgePercent: 0.46 };
          }
          if (!parsed.config.games.baccarat) {
            parsed.config.games.baccarat = { enabled: true, minBet: 25, maxBet: 5000, houseEdgePercent: 1.06 };
          }
          if (!parsed.config.games.plinko) {
            parsed.config.games.plinko = { enabled: true, minBet: 10, maxBet: 5000, houseEdgePercent: 1.0 };
          }
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return {
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      players: Object.fromEntries(DEFAULT_PLAYERS.map((p) => [p.id, p])),
      activePlayerId: 'player_main',
      transactions: [],
      auditLogs: [],
      activeBlackjackHands: {},
      activeVideoPokerGames: {},
      nonce: 1,
    };
  }

  private saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore quota exceptions
    }
  }

  private addAudit(actor: 'player' | 'admin' | 'system', action: string, details: string, playerId?: string) {
    const entry: AuditLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      actor,
      action,
      details,
      playerId,
    };
    this.state.auditLogs.unshift(entry);
    if (this.state.auditLogs.length > 300) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 300);
    }
    this.saveState();
  }

  private recordTx(
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
    this.state.transactions.unshift(tx);
    if (this.state.transactions.length > 500) {
      this.state.transactions = this.state.transactions.slice(0, 500);
    }
    this.saveState();
    return tx;
  }

  private getProvablyFair() {
    this.state.nonce += 1;
    // Generate deterministic client-side SHA representation
    const pseudoHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return {
      serverSeedHash: pseudoHash,
      nonce: this.state.nonce,
    };
  }

  public getState() {
    const activePlayer = this.state.players[this.state.activePlayerId] || Object.values(this.state.players)[0];
    return {
      config: this.state.config,
      activePlayer,
      playersList: Object.values(this.state.players),
      serverSeedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      nonce: this.state.nonce,
    };
  }

  public updateConfig(newConfig: Partial<CasinoConfig>) {
    this.state.config = {
      ...this.state.config,
      ...newConfig,
      games: {
        ...this.state.config.games,
        ...(newConfig.games || {}),
      },
    };
    this.addAudit('admin', 'CONFIG_UPDATE', 'Updated global casino rules, betting limits, and payout settings');
    this.saveState();
    return { success: true, config: this.state.config };
  }

  public getPlayers() {
    return { players: Object.values(this.state.players), activePlayerId: this.state.activePlayerId };
  }

  public switchPlayer(playerId: string) {
    if (!this.state.players[playerId]) throw new Error('Player profile not found');
    this.state.activePlayerId = playerId;
    this.saveState();
    return { success: true, activePlayer: this.state.players[playerId] };
  }

  public createPlayer(username: string, avatar?: string) {
    const id = 'player_' + Date.now().toString(36);
    const newPlayer: Player = {
      id,
      username: username.trim().slice(0, 24),
      avatar: avatar || 'User',
      balance: this.state.config.startingBalance,
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
    this.state.players[id] = newPlayer;
    this.state.activePlayerId = id;
    this.recordTx(newPlayer, 'bonus', 'wallet', this.state.config.startingBalance, 'Initial starting balance grant');
    this.addAudit('player', 'PLAYER_CREATED', `Created new player account: ${newPlayer.username}`, id);
    this.saveState();
    return { success: true, player: newPlayer };
  }

  public claimDailyBonus() {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    if (player.isFrozen) throw new Error('Account is frozen');

    const now = Date.now();
    const cooldownMs = this.state.config.dailyBonusCooldownHours * 3600 * 1000;
    if (player.lastDailyBonusClaim && now - player.lastDailyBonusClaim < cooldownMs) {
      const remainingMs = cooldownMs - (now - player.lastDailyBonusClaim);
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      throw new Error(`Daily bonus is on cooldown. Please wait ${remainingMins} minutes.`);
    }

    const bonusAmount = this.state.config.dailyBonusAmount;
    player.lastDailyBonusClaim = now;
    player.balance += bonusAmount;
    this.recordTx(player, 'bonus', 'wallet', bonusAmount, 'Daily play-money bonus claimed');
    this.addAudit('player', 'DAILY_BONUS_CLAIMED', `Claimed daily bonus of ${bonusAmount} chips`, player.id);
    this.saveState();

    return { success: true, bonusAmount, balance: player.balance, nextAvailable: now + cooldownMs };
  }

  public resetPracticeBalance() {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    if (!this.state.config.allowBalanceReset) throw new Error('Balance resets are disabled by admin');

    const diff = this.state.config.startingBalance - player.balance;
    player.balance = this.state.config.startingBalance;
    this.recordTx(player, 'reset', 'wallet', diff, `Practice balance reset to ${this.state.config.startingBalance} chips`);
    this.addAudit('player', 'PRACTICE_RESET', `Reset practice balance to ${this.state.config.startingBalance}`, player.id);
    this.saveState();

    return { success: true, balance: player.balance };
  }

  public transferChips(recipientId: string, amount: number, memo?: string) {
    if (!this.state.config.peerTransfersEnabled) throw new Error('Peer transfers disabled');
    const sender = this.state.players[this.state.activePlayerId];
    if (!sender) throw new Error('Sender not found');
    if (sender.isFrozen) throw new Error('Account is frozen');

    const numAmount = parseInt(String(amount), 10);
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid transfer amount');
    if (numAmount > this.state.config.maxTransferAmount) throw new Error(`Exceeds limit of ${this.state.config.maxTransferAmount}`);
    if (sender.balance < numAmount) throw new Error('Insufficient balance');

    const recipient = this.state.players[recipientId];
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.id === sender.id) throw new Error('Cannot transfer to yourself');

    const fee = Math.floor((numAmount * (this.state.config.transferFeePercent || 0)) / 100);
    const netReceived = numAmount - fee;

    sender.balance -= numAmount;
    this.recordTx(sender, 'transfer_out', 'transfer', -numAmount, `Transfer to ${recipient.username}: ${memo || 'Chips'}`);
    recipient.balance += netReceived;
    this.recordTx(recipient, 'transfer_in', 'transfer', netReceived, `Transfer received from ${sender.username}: ${memo || 'Chips'}`);
    this.addAudit('player', 'PEER_TRANSFER', `Transferred ${numAmount} chips from ${sender.username} to ${recipient.username}`, sender.id);
    this.saveState();

    return {
      success: true,
      senderBalance: sender.balance,
      transferred: numAmount,
      fee,
      recipientUsername: recipient.username,
    };
  }

  public getTransactions(playerId: string) {
    const txs = this.state.transactions.filter((t) => t.playerId === playerId).slice(0, 100);
    return { transactions: txs };
  }

  public adjustPlayer(playerId: string, payload: { balanceAdjustment?: number; setBalance?: number; toggleFreeze?: boolean }) {
    const player = this.state.players[playerId];
    if (!player) throw new Error('Player not found');

    if (typeof payload.toggleFreeze === 'boolean') {
      player.isFrozen = payload.toggleFreeze;
      this.addAudit('admin', 'PLAYER_STATUS_TOGGLE', `Player ${player.username} frozen: ${player.isFrozen}`, playerId);
    }
    if (typeof payload.setBalance === 'number' && payload.setBalance >= 0) {
      const diff = payload.setBalance - player.balance;
      player.balance = payload.setBalance;
      this.recordTx(player, 'admin_grant', 'system', diff, `Admin set balance to ${payload.setBalance}`);
      this.addAudit('admin', 'ADMIN_SET_BALANCE', `Set ${player.username} balance to ${payload.setBalance}`, playerId);
    } else if (typeof payload.balanceAdjustment === 'number' && payload.balanceAdjustment !== 0) {
      player.balance += payload.balanceAdjustment;
      this.recordTx(player, 'admin_grant', 'system', payload.balanceAdjustment, `Admin adjustment: ${payload.balanceAdjustment} chips`);
      this.addAudit('admin', 'ADMIN_ADJUST_BALANCE', `Adjusted ${player.username} by ${payload.balanceAdjustment}`, playerId);
    }

    this.saveState();
    return { success: true, player };
  }

  public getAuditLogs() {
    return { logs: this.state.auditLogs.slice(0, 200) };
  }

  public resetSystem() {
    this.state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.state.players = Object.fromEntries(DEFAULT_PLAYERS.map((p) => [p.id, JSON.parse(JSON.stringify(p))]));
    this.state.activePlayerId = 'player_main';
    this.state.transactions = [];
    this.state.auditLogs = [];
    this.addAudit('admin', 'SYSTEM_RESET', 'All casino player balances and settings restored to factory defaults');
    this.saveState();
    return { success: true, message: 'System reset to defaults' };
  }

  // Games logic
  public spinSlots(betPerLine: number, activeLines: number) {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    if (player.isFrozen) throw new Error('Account frozen');

    const settings = this.state.config.games.slots;
    if (!settings.enabled) throw new Error('Slots disabled by admin');

    const numBetPerLine = parseInt(String(betPerLine), 10);
    const numActiveLines = Math.min(5, Math.max(1, parseInt(String(activeLines), 10) || 1));
    const totalBet = numBetPerLine * numActiveLines;

    if (numBetPerLine < settings.minBet) throw new Error(`Min bet is ${settings.minBet}`);
    if (totalBet > settings.maxBet) throw new Error(`Max bet is ${settings.maxBet}`);
    if (player.balance < totalBet) throw new Error('Insufficient balance');

    player.balance -= totalBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += totalBet;

    const symbols: SlotSymbol[] = ['wild', 'seven', 'diamond', 'bell', 'bar', 'cherry'];
    const weights: Record<SlotSymbol, number> = { cherry: 32, bar: 24, bell: 18, diamond: 12, seven: 8, wild: 4 };
    const payouts: Record<SlotSymbol, number> = { wild: 150, seven: 60, diamond: 30, bell: 18, bar: 10, cherry: 6 };

    const pickSym = (): SlotSymbol => {
      let r = Math.random() * 98;
      for (const s of symbols) {
        if (r < weights[s]) return s;
        r -= weights[s];
      }
      return 'cherry';
    };

    const reels: SlotSymbol[][] = [
      [pickSym(), pickSym(), pickSym()],
      [pickSym(), pickSym(), pickSym()],
      [pickSym(), pickSym(), pickSym()],
    ];

    const paylineRows = [
      [1, 1, 1],
      [0, 0, 0],
      [2, 2, 2],
      [0, 1, 2],
      [2, 1, 0],
    ];

    const hits: SlotPaylineHit[] = [];
    let totalPayout = 0;

    for (let i = 0; i < numActiveLines; i++) {
      const coords = paylineRows[i];
      const s0 = reels[0][coords[0]];
      const s1 = reels[1][coords[1]];
      const s2 = reels[2][coords[2]];

      let matchSym: SlotSymbol | null = null;
      let isMatch = false;

      if (s0 === 'wild' && s1 === 'wild' && s2 === 'wild') {
        matchSym = 'wild';
        isMatch = true;
      } else {
        const nonWild = [s0, s1, s2].find((s) => s !== 'wild');
        if (nonWild && (s0 === nonWild || s0 === 'wild') && (s1 === nonWild || s1 === 'wild') && (s2 === nonWild || s2 === 'wild')) {
          matchSym = nonWild;
          isMatch = true;
        }
      }

      if (isMatch && matchSym) {
        const linePayout = numBetPerLine * payouts[matchSym];
        hits.push({ lineIndex: i, symbol: matchSym, count: 3, multiplier: payouts[matchSym], payout: linePayout });
        totalPayout += linePayout;
      } else if (s0 === 'cherry' && s1 === 'cherry') {
        const linePayout = numBetPerLine * 2;
        hits.push({ lineIndex: i, symbol: 'cherry', count: 2, multiplier: 2, payout: linePayout });
        totalPayout += linePayout;
      }
    }

    player.balance += totalPayout;
    player.stats.totalWon += totalPayout;
    const netGain = totalPayout - totalBet;
    player.stats.netProfit += netGain;
    if (totalPayout > player.stats.biggestWin) player.stats.biggestWin = totalPayout;
    player.stats.streak = netGain > 0 ? (player.stats.streak || 0) + 1 : 0;

    const pf = this.getProvablyFair();
    this.recordTx(player, netGain >= 0 ? 'win' : 'loss', 'slots', netGain, `Slots Spin - Won ${totalPayout}`);
    this.saveState();

    const result: SlotSpinResult = {
      reels,
      hits,
      totalPayout,
      betPerLine: numBetPerLine,
      activeLines: numActiveLines,
      totalBet,
      netGain,
      serverSeedHash: pf.serverSeedHash,
      nonce: pf.nonce,
    };

    return { success: true, result, balance: player.balance };
  }

  public dealBlackjack(bet: number) {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    const settings = this.state.config.games.blackjack;
    if (!settings.enabled) throw new Error('Blackjack disabled by admin');

    const numBet = parseInt(String(bet), 10);
    if (numBet < settings.minBet || numBet > settings.maxBet) throw new Error('Bet limits exceeded');
    if (player.balance < numBet) throw new Error('Insufficient balance');

    player.balance -= numBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += numBet;

    const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    for (const s of suits) {
      for (const v of values) {
        let pts = parseInt(v, 10);
        if (['J', 'Q', 'K'].includes(v)) pts = 10;
        if (v === 'A') pts = 11;
        deck.push({ suit: s, value: v, points: pts });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const calcScore = (cards: Card[]) => {
      let sc = 0;
      let aces = 0;
      for (const c of cards) {
        if (c.hidden) continue;
        sc += c.points;
        if (c.value === 'A') aces++;
      }
      while (sc > 21 && aces > 0) {
        sc -= 10;
        aces--;
      }
      return sc;
    };

    const pCards = [deck.pop()!, deck.pop()!];
    const dCards = [deck.pop()!, { ...deck.pop()!, hidden: true }];
    const pScore = calcScore(pCards);

    const handId = 'bj_' + Date.now();
    let status: BlackjackState['status'] = 'player_turn';
    let payout = 0;

    if (pScore === 21) {
      dCards[1].hidden = false;
      const dScore = calcScore(dCards);
      if (dScore === 21) {
        status = 'push';
        payout = numBet;
      } else {
        status = 'player_blackjack';
        payout = Math.floor(numBet + numBet * (this.state.config.blackjackNaturalPayout || 1.5));
      }
    }

    if (status !== 'player_turn') {
      player.balance += payout;
      player.stats.totalWon += payout;
      player.stats.netProfit += payout - numBet;
      this.recordTx(player, status === 'push' ? 'push' : 'win', 'blackjack', payout - numBet, 'Blackjack Natural');
    }

    const hand: BlackjackState = {
      id: handId,
      playerId: player.id,
      bet: numBet,
      playerCards: pCards,
      dealerCards: dCards,
      playerScore: pScore,
      dealerScore: status === 'player_turn' ? calcScore([dCards[0]]) : calcScore(dCards),
      status,
      payout,
      canDouble: status === 'player_turn' && player.balance >= numBet,
      canSplit: status === 'player_turn' && pCards[0].value === pCards[1].value && player.balance >= numBet,
    };

    if (status === 'player_turn') {
      this.state.activeBlackjackHands[handId] = hand;
    }
    this.saveState();

    return { success: true, hand, balance: player.balance };
  }

  public actionBlackjack(handId: string, action: 'hit' | 'stand' | 'double') {
    const hand = this.state.activeBlackjackHands[handId];
    if (!hand) throw new Error('No active hand found');
    const player = this.state.players[hand.playerId];
    if (!player) throw new Error('Player not found');

    const drawCard = (): Card => {
      const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
      const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const v = values[Math.floor(Math.random() * values.length)];
      let pts = parseInt(v, 10);
      if (['J', 'Q', 'K'].includes(v)) pts = 10;
      if (v === 'A') pts = 11;
      return { suit: s, value: v, points: pts };
    };

    const calcScore = (cards: Card[]) => {
      let sc = 0;
      let aces = 0;
      for (const c of cards) {
        if (c.hidden) continue;
        sc += c.points;
        if (c.value === 'A') aces++;
      }
      while (sc > 21 && aces > 0) {
        sc -= 10;
        aces--;
      }
      return sc;
    };

    if (action === 'hit') {
      hand.playerCards.push(drawCard());
      hand.playerScore = calcScore(hand.playerCards);
      hand.canDouble = false;
      hand.canSplit = false;

      if (hand.playerScore > 21) {
        hand.status = 'player_bust';
        hand.dealerCards[1].hidden = false;
        hand.dealerScore = calcScore(hand.dealerCards);
        hand.payout = 0;
        delete this.state.activeBlackjackHands[handId];
        player.stats.netProfit -= hand.bet;
        this.recordTx(player, 'loss', 'blackjack', -hand.bet, 'Blackjack Bust');
        this.saveState();
        return { success: true, hand, balance: player.balance };
      } else if (hand.playerScore === 21) {
        return this.resolveDealer(hand, player);
      }
    } else if (action === 'double') {
      if (player.balance < hand.bet) throw new Error('Insufficient balance');
      player.balance -= hand.bet;
      player.stats.totalWagered += hand.bet;
      hand.bet *= 2;
      hand.playerCards.push(drawCard());
      hand.playerScore = calcScore(hand.playerCards);
      hand.canDouble = false;
      hand.canSplit = false;

      if (hand.playerScore > 21) {
        hand.status = 'player_bust';
        hand.dealerCards[1].hidden = false;
        hand.dealerScore = calcScore(hand.dealerCards);
        hand.payout = 0;
        delete this.state.activeBlackjackHands[handId];
        player.stats.netProfit -= hand.bet;
        this.recordTx(player, 'loss', 'blackjack', -hand.bet, 'Blackjack Double Down Bust');
        this.saveState();
        return { success: true, hand, balance: player.balance };
      } else {
        return this.resolveDealer(hand, player);
      }
    } else if (action === 'stand') {
      return this.resolveDealer(hand, player);
    }

    this.saveState();
    return { success: true, hand, balance: player.balance };
  }

  private resolveDealer(hand: BlackjackState, player: Player) {
    const calcScore = (cards: Card[]) => {
      let sc = 0;
      let aces = 0;
      for (const c of cards) {
        if (c.hidden) continue;
        sc += c.points;
        if (c.value === 'A') aces++;
      }
      while (sc > 21 && aces > 0) {
        sc -= 10;
        aces--;
      }
      return sc;
    };

    hand.dealerCards[1].hidden = false;
    let dScore = calcScore(hand.dealerCards);

    const drawCard = (): Card => {
      const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
      const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const v = values[Math.floor(Math.random() * values.length)];
      let pts = parseInt(v, 10);
      if (['J', 'Q', 'K'].includes(v)) pts = 10;
      if (v === 'A') pts = 11;
      return { suit: s, value: v, points: pts };
    };

    while (dScore < 17) {
      hand.dealerCards.push(drawCard());
      dScore = calcScore(hand.dealerCards);
    }
    hand.dealerScore = dScore;

    let payout = 0;
    if (dScore > 21) {
      hand.status = 'dealer_bust';
      payout = hand.bet * 2;
    } else if (hand.playerScore > dScore) {
      hand.status = 'player_won';
      payout = hand.bet * 2;
    } else if (hand.playerScore < dScore) {
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

    delete this.state.activeBlackjackHands[hand.id];
    this.recordTx(player, net > 0 ? 'win' : net === 0 ? 'push' : 'loss', 'blackjack', net, 'Blackjack Hand Resolved');
    this.saveState();

    return { success: true, hand, balance: player.balance };
  }

  public spinRoulette(bets: RouletteBetItem[]) {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    const settings = this.state.config.games.roulette;
    if (!settings.enabled) throw new Error('Roulette disabled');

    const totalBet = bets.reduce((s, b) => s + (b.amount || 0), 0);
    if (totalBet < settings.minBet || totalBet > settings.maxBet) throw new Error('Bet limits exceeded');
    if (player.balance < totalBet) throw new Error('Insufficient balance');

    player.balance -= totalBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += totalBet;

    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const winningNumber = Math.floor(Math.random() * 37);
    const winningColor = winningNumber === 0 ? 'green' : redNumbers.includes(winningNumber) ? 'red' : 'black';

    let totalPayout = 0;
    const winningBets: { bet: RouletteBetItem; payout: number }[] = [];

    for (const b of bets) {
      let won = false;
      let mult = 0;

      if (b.type === 'straight' && b.numbers.includes(winningNumber)) {
        won = true;
        mult = 36;
      } else if (b.type === 'dozen' && b.numbers.includes(winningNumber)) {
        won = true;
        mult = 3;
      } else if (b.type === 'red' && winningColor === 'red') {
        won = true;
        mult = 2;
      } else if (b.type === 'black' && winningColor === 'black') {
        won = true;
        mult = 2;
      } else if (b.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
        won = true;
        mult = 2;
      } else if (b.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) {
        won = true;
        mult = 2;
      } else if (b.type === 'low' && winningNumber >= 1 && winningNumber <= 18) {
        won = true;
        mult = 2;
      } else if (b.type === 'high' && winningNumber >= 19 && winningNumber <= 36) {
        won = true;
        mult = 2;
      }

      if (won && mult > 0) {
        const p = b.amount * mult;
        totalPayout += p;
        winningBets.push({ bet: b, payout: p });
      }
    }

    player.balance += totalPayout;
    player.stats.totalWon += totalPayout;
    const net = totalPayout - totalBet;
    player.stats.netProfit += net;
    if (totalPayout > player.stats.biggestWin) player.stats.biggestWin = totalPayout;

    const pf = this.getProvablyFair();
    this.recordTx(player, net >= 0 ? 'win' : 'loss', 'roulette', net, `Roulette Landed on ${winningNumber}`);
    this.saveState();

    const result: RouletteSpinResult = {
      winningNumber,
      winningColor,
      totalBet,
      totalPayout,
      winningBets,
      serverSeedHash: pf.serverSeedHash,
      nonce: pf.nonce,
    };

    return { success: true, result, balance: player.balance };
  }

  public rollMultiplierDice(bet: number, target: number, condition: 'over' | 'under') {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    const settings = this.state.config.games.dice;
    if (!settings.enabled) throw new Error('Dice disabled');

    const numBet = parseInt(String(bet), 10);
    if (numBet < settings.minBet || numBet > settings.maxBet) throw new Error('Bet limits exceeded');
    if (player.balance < numBet) throw new Error('Insufficient balance');

    player.balance -= numBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += numBet;

    const numTarget = Math.min(98, Math.max(2, parseFloat(String(target)) || 50));
    const rolledNumber = Math.round(Math.random() * 99.99 * 100) / 100;
    const winChance = condition === 'over' ? 100 - numTarget : numTarget;
    const mult = Math.round(((100 * (1 - settings.houseEdgePercent / 100)) / winChance) * 100) / 100;
    const won = condition === 'over' ? rolledNumber > numTarget : rolledNumber < numTarget;
    const payout = won ? Math.floor(numBet * mult) : 0;

    player.balance += payout;
    player.stats.totalWon += payout;
    const net = payout - numBet;
    player.stats.netProfit += net;
    if (payout > player.stats.biggestWin) player.stats.biggestWin = payout;

    const pf = this.getProvablyFair();
    this.recordTx(player, won ? 'win' : 'loss', 'dice', net, `Dice Multiplier Rolled ${rolledNumber}`);
    this.saveState();

    const result: MultiplierDiceResult = {
      target: numTarget,
      condition,
      rolledNumber,
      winChance: Math.round(winChance * 100) / 100,
      multiplier: mult,
      won,
      bet: numBet,
      payout,
      serverSeedHash: pf.serverSeedHash,
      nonce: pf.nonce,
    };

    return { success: true, mode: 'multiplier' as const, result, balance: player.balance };
  }

  public rollCrapsDice(bet: number, crapsBetType: 'pass' | 'dont_pass' | 'field' | 'craps_seven') {
    const player = this.state.players[this.state.activePlayerId];
    if (!player) throw new Error('Player not found');
    const settings = this.state.config.games.dice;
    if (!settings.enabled) throw new Error('Dice disabled');

    const numBet = parseInt(String(bet), 10);
    if (numBet < settings.minBet || numBet > settings.maxBet) throw new Error('Bet limits exceeded');
    if (player.balance < numBet) throw new Error('Insufficient balance');

    player.balance -= numBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += numBet;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const sum = die1 + die2;

    let won = false;
    let push = false;
    let mult = 0;

    if (crapsBetType === 'pass') {
      if ([7, 11].includes(sum)) {
        won = true;
        mult = 2;
      } else if ([2, 3, 12].includes(sum)) {
        won = false;
      } else {
        won = Math.random() < 0.49;
        mult = won ? 2 : 0;
      }
    } else if (crapsBetType === 'dont_pass') {
      if ([2, 3].includes(sum)) {
        won = true;
        mult = 2;
      } else if (sum === 12) {
        push = true;
        mult = 1;
      } else if ([7, 11].includes(sum)) {
        won = false;
      } else {
        won = Math.random() < 0.49;
        mult = won ? 2 : 0;
      }
    } else if (crapsBetType === 'field') {
      if ([3, 4, 9, 10, 11].includes(sum)) {
        won = true;
        mult = 2;
      } else if (sum === 2) {
        won = true;
        mult = 3;
      } else if (sum === 12) {
        won = true;
        mult = 4;
      }
    } else if (crapsBetType === 'craps_seven') {
      if (sum === 7) {
        won = true;
        mult = 5;
      }
    }

    const payout = push ? numBet : won ? numBet * mult : 0;
    player.balance += payout;
    player.stats.totalWon += payout;
    const net = payout - numBet;
    player.stats.netProfit += net;

    this.recordTx(player, push ? 'push' : net >= 0 ? 'win' : 'loss', 'dice', net, `Craps Rolled ${sum}`);
    this.saveState();

    const result: CrapsDiceResult = {
      die1,
      die2,
      sum,
      betType: crapsBetType,
      won,
      push,
      multiplier: mult,
      bet: numBet,
      payout,
    };

    return { success: true, mode: 'craps' as const, result, balance: player.balance };
  }

  private getActivePlayer(): Player {
    const player = this.state.players[this.state.activePlayerId] || Object.values(this.state.players)[0];
    if (!player) throw new Error('Active player not found');
    return player;
  }

  private createDeck(): Card[] {
    const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    for (const s of suits) {
      for (const v of values) {
        let pts = parseInt(v, 10);
        if (['J', 'Q', 'K'].includes(v)) pts = 10;
        if (v === 'A') pts = 11;
        deck.push({ suit: s, value: v, points: pts });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // --- VIDEO POKER ---
  public videoPokerDeal(bet: number) {
    const player = this.getActivePlayer();
    if (!player) throw new Error('Active player not found');
    if (player.isFrozen) throw new Error('Account is frozen');

    const gameSettings = this.state.config.games.videopoker;
    if (!gameSettings?.enabled) throw new Error('Video Poker is currently disabled');

    const numBet = parseInt(String(bet), 10);
    if (isNaN(numBet) || numBet < gameSettings.minBet || numBet > gameSettings.maxBet) {
      throw new Error(`Bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}`);
    }
    if (player.balance < numBet) throw new Error('Insufficient balance');

    player.balance -= numBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += numBet;

    const deck = this.createDeck();
    const hand: Card[] = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];
    const evalResult = this.evalPokerHand(hand);
    const gameId = 'vp_' + Math.random().toString(36).substring(2, 9);

    this.state.activeVideoPokerGames[gameId] = {
      deck,
      hand,
      bet: numBet,
    };

    this.saveState();

    const pokerState: VideoPokerState = {
      gameId,
      phase: 'holding',
      hand,
      held: [false, false, false, false, false],
      bet: numBet,
      handRank: evalResult.rank,
      handName: evalResult.name,
      multiplier: evalResult.multiplier,
      serverSeedHash: this.getProvablyFair().serverSeedHash,
    };

    return { success: true, state: pokerState, balance: player.balance };
  }

  public videoPokerDraw(gameId: string, held: boolean[]) {
    const player = this.getActivePlayer();
    if (!player) throw new Error('Active player not found');

    const game = this.state.activeVideoPokerGames[gameId];
    if (!game) throw new Error('Video Poker game session not found');

    const finalHand: Card[] = [...game.hand];
    for (let i = 0; i < 5; i++) {
      if (!held[i]) {
        finalHand[i] = game.deck.pop()!;
      }
    }

    const evalResult = this.evalPokerHand(finalHand);
    const payout = game.bet * evalResult.multiplier;

    player.balance += payout;
    player.stats.totalWon += payout;
    const netGain = payout - game.bet;
    player.stats.netProfit += netGain;

    if (payout > player.stats.biggestWin) player.stats.biggestWin = payout;
    if (netGain > 0) player.stats.streak = (player.stats.streak || 0) + 1;
    else player.stats.streak = 0;

    delete this.state.activeVideoPokerGames[gameId];

    this.recordTx(
      player,
      payout > 0 ? 'win' : 'loss',
      'videopoker',
      netGain,
      `Video Poker: ${evalResult.name} (${evalResult.multiplier}x)`
    );

    this.saveState();

    const pokerState: VideoPokerState = {
      gameId,
      phase: 'finished',
      hand: finalHand,
      held,
      bet: game.bet,
      handRank: evalResult.rank,
      handName: evalResult.name,
      multiplier: evalResult.multiplier,
      payout,
      serverSeedHash: this.getProvablyFair().serverSeedHash,
    };

    return { success: true, state: pokerState, balance: player.balance };
  }

  private evalPokerHand(cards: Card[]): { rank: PokerHandRank; name: string; multiplier: number } {
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

  // --- BACCARAT ---
  public baccaratPlay(bets: BaccaratBetItem[]) {
    const player = this.getActivePlayer();
    if (!player) throw new Error('Active player not found');
    if (player.isFrozen) throw new Error('Account is frozen');

    const gameSettings = this.state.config.games.baccarat;
    if (!gameSettings?.enabled) throw new Error('Baccarat is currently disabled');

    const totalBet = bets.reduce((sum, b) => sum + (parseInt(String(b.amount), 10) || 0), 0);
    if (totalBet < gameSettings.minBet || totalBet > gameSettings.maxBet) {
      throw new Error(`Total bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}`);
    }
    if (player.balance < totalBet) throw new Error('Insufficient balance');

    player.balance -= totalBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += totalBet;

    const deck = this.createDeck();
    const playerHand: Card[] = [deck.pop()!, deck.pop()!];
    const bankerHand: Card[] = [deck.pop()!, deck.pop()!];

    let pScore = this.calcBaccaratScore(playerHand);
    let bScore = this.calcBaccaratScore(bankerHand);
    const isNatural = pScore >= 8 || bScore >= 8;

    if (!isNatural) {
      let p3: Card | null = null;
      if (pScore <= 5) {
        p3 = deck.pop()!;
        playerHand.push(p3);
        pScore = this.calcBaccaratScore(playerHand);
      }

      if (!p3) {
        if (bScore <= 5) {
          bankerHand.push(deck.pop()!);
          bScore = this.calcBaccaratScore(bankerHand);
        }
      } else {
        const p3Val = this.getBaccaratVal(p3!);
        let bankerDraws = false;
        if (bScore <= 2) bankerDraws = true;
        else if (bScore === 3 && p3Val !== 8) bankerDraws = true;
        else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
        else if (bScore === 5 && [4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
        else if (bScore === 6 && [6, 7].includes(p3Val)) bankerDraws = true;

        if (bankerDraws) {
          bankerHand.push(deck.pop()!);
          bScore = this.calcBaccaratScore(bankerHand);
        }
      }
    }

    const winner: 'player' | 'banker' | 'tie' =
      pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';

    const playerPair = playerHand[0].value === playerHand[1].value;
    const bankerPair = bankerHand[0].value === bankerHand[1].value;

    const betOutcomes: BaccaratBetOutcome[] = [];
    let totalPayout = 0;

    for (const b of bets) {
      const amt = parseInt(String(b.amount), 10);
      let won = false;
      let push = false;
      let payout = 0;

      switch (b.betType) {
        case 'player':
          if (winner === 'player') { won = true; payout = amt * 2; }
          else if (winner === 'tie') { push = true; payout = amt; }
          break;
        case 'banker':
          if (winner === 'banker') { won = true; payout = Math.floor(amt * 1.95); }
          else if (winner === 'tie') { push = true; payout = amt; }
          break;
        case 'tie':
          if (winner === 'tie') { won = true; payout = amt * 9; }
          break;
        case 'player_pair':
          if (playerPair) { won = true; payout = amt * 12; }
          break;
        case 'banker_pair':
          if (bankerPair) { won = true; payout = amt * 12; }
          break;
      }

      totalPayout += payout;
      betOutcomes.push({ betType: b.betType, amount: amt, won, push, payout });
    }

    player.balance += totalPayout;
    player.stats.totalWon += totalPayout;
    const netGain = totalPayout - totalBet;
    player.stats.netProfit += netGain;

    if (totalPayout > player.stats.biggestWin) player.stats.biggestWin = totalPayout;
    if (netGain > 0) player.stats.streak = (player.stats.streak || 0) + 1;
    else if (netGain < 0) player.stats.streak = 0;

    this.recordTx(
      player,
      netGain >= 0 ? 'win' : 'loss',
      'baccarat',
      netGain,
      `Baccarat: ${winner.toUpperCase()} won ${pScore} to ${bScore}`
    );

    this.saveState();

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
      serverSeedHash: this.getProvablyFair().serverSeedHash,
    };

    return { success: true, result, balance: player.balance };
  }

  private getBaccaratVal(card: Card): number {
    if (['10', 'J', 'Q', 'K'].includes(card.value)) return 0;
    if (card.value === 'A') return 1;
    return parseInt(card.value, 10);
  }

  private calcBaccaratScore(cards: Card[]): number {
    const sum = cards.reduce((acc, c) => acc + this.getBaccaratVal(c), 0);
    return sum % 10;
  }

  // --- PLINKO ---
  public plinkoDrop(bet: number, rows: number = 12, risk: PlinkoRisk = 'medium') {
    const player = this.getActivePlayer();
    if (!player) throw new Error('Active player not found');
    if (player.isFrozen) throw new Error('Account is frozen');

    const gameSettings = this.state.config.games.plinko;
    if (!gameSettings?.enabled) throw new Error('Plinko is currently disabled');

    const numBet = parseInt(String(bet), 10);
    const numRows = [8, 12, 16].includes(Number(rows)) ? Number(rows) : 12;
    const riskLevel: PlinkoRisk = ['low', 'medium', 'high'].includes(risk) ? risk : 'medium';

    if (isNaN(numBet) || numBet < gameSettings.minBet || numBet > gameSettings.maxBet) {
      throw new Error(`Bet must be between ${gameSettings.minBet} and ${gameSettings.maxBet}`);
    }
    if (player.balance < numBet) throw new Error('Insufficient balance');

    player.balance -= numBet;
    player.stats.gamesPlayed += 1;
    player.stats.totalWagered += numBet;

    const payoutsMap: Record<number, Record<PlinkoRisk, number[]>> = {
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

    const directions: number[] = [];
    let slotIndex = 0;
    for (let r = 0; r < numRows; r++) {
      const dir = Math.random() < 0.5 ? 0 : 1;
      directions.push(dir);
      slotIndex += dir;
    }

    const payTable = payoutsMap[numRows][riskLevel];
    const multiplier = payTable[slotIndex] || 1;
    const payout = Math.floor(numBet * multiplier);

    player.balance += payout;
    player.stats.totalWon += payout;
    const netGain = payout - numBet;
    player.stats.netProfit += netGain;

    if (payout > player.stats.biggestWin) player.stats.biggestWin = payout;
    if (multiplier >= 1) player.stats.streak = (player.stats.streak || 0) + 1;
    else player.stats.streak = 0;

    this.recordTx(
      player,
      netGain >= 0 ? 'win' : 'loss',
      'plinko',
      netGain,
      `Plinko Drop: Slot ${slotIndex} (${multiplier}x)`
    );

    this.saveState();

    const result: PlinkoResult = {
      rows: numRows,
      risk: riskLevel,
      bet: numBet,
      directions,
      slotIndex,
      multiplier,
      payout,
      serverSeedHash: this.getProvablyFair().serverSeedHash,
    };

    return { success: true, result, balance: player.balance };
  }

  public runExperiment(params: {
    game: GameType;
    strategy: BettingStrategy;
    initialBankroll: number;
    baseBet: number;
    roundsCount: number;
    maxBet: number;
  }) {
    const rounds = Math.min(1000, Math.max(10, params.roundsCount || 100));
    const initBank = Math.max(100, params.initialBankroll || 5000);
    const minBase = Math.max(1, params.baseBet || 50);
    const limitBet = Math.max(minBase, params.maxBet || 5000);

    let currentBankroll = initBank;
    let currentBet = minBase;
    let peak = initBank;
    let maxDrawdown = 0;
    let wins = 0;
    let losses = 0;
    let totalWagered = 0;
    let totalWon = 0;
    let currentStreak = 0;
    let longestWin = 0;
    let longestLoss = 0;
    let bustedAt: number | null = null;

    const history: SimulationRoundResult[] = [{ round: 0, bet: 0, won: true, netRound: 0, balance: initBank }];
    const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
    let fibIndex = 0;

    let winProb = params.game === 'blackjack' ? 0.495 : params.game === 'dice' ? 0.495 : params.game === 'slots' ? 0.32 : 0.486;
    let payoutRatio = params.game === 'slots' ? 2.8 : params.game === 'dice' ? 0.98 : 1.0;

    for (let r = 1; r <= rounds; r++) {
      if (currentBankroll <= 0) {
        if (bustedAt === null) bustedAt = r;
        history.push({ round: r, bet: 0, won: false, netRound: 0, balance: 0 });
        continue;
      }

      let betAmount = params.strategy === 'fibonacci' ? minBase * (fib[fibIndex] || 377) : currentBet;
      betAmount = Math.min(betAmount, limitBet, currentBankroll);
      if (betAmount <= 0) {
        if (bustedAt === null) bustedAt = r;
        history.push({ round: r, bet: 0, won: false, netRound: 0, balance: currentBankroll });
        continue;
      }

      totalWagered += betAmount;
      currentBankroll -= betAmount;
      const isWin = Math.random() < winProb;

      let netRound = 0;
      if (isWin) {
        wins++;
        const p = Math.floor(betAmount * (1 + payoutRatio));
        currentBankroll += p;
        totalWon += p;
        netRound = p - betAmount;

        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        if (currentStreak > longestWin) longestWin = currentStreak;

        if (params.strategy === 'martingale') currentBet = minBase;
        else if (params.strategy === 'paroli') currentBet = Math.min(currentBet * 2, limitBet);
        else if (params.strategy === 'dalembert') currentBet = Math.max(minBase, currentBet - minBase);
        else if (params.strategy === 'fibonacci') fibIndex = Math.max(0, fibIndex - 2);
      } else {
        losses++;
        netRound = -betAmount;
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
        if (Math.abs(currentStreak) > longestLoss) longestLoss = Math.abs(currentStreak);

        if (params.strategy === 'martingale') currentBet = Math.min(currentBet * 2, limitBet);
        else if (params.strategy === 'paroli') currentBet = minBase;
        else if (params.strategy === 'dalembert') currentBet = Math.min(limitBet, currentBet + minBase);
        else if (params.strategy === 'fibonacci') fibIndex = Math.min(fib.length - 1, fibIndex + 1);
      }

      if (currentBankroll > peak) peak = currentBankroll;
      const dd = ((peak - currentBankroll) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      history.push({ round: r, bet: betAmount, won: isWin, netRound, balance: currentBankroll });
    }

    const winRatePercent = Math.round((wins / (wins + losses || 1)) * 1000) / 10;
    const observedRtpPercent = totalWagered > 0 ? Math.round((totalWon / totalWagered) * 1000) / 10 : 100;

    const result: SimulationResult = {
      strategy: params.strategy,
      game: params.game,
      roundsCount: rounds,
      initialBankroll: initBank,
      finalBankroll: currentBankroll,
      totalWagered,
      totalWon,
      wins,
      losses,
      pushes: 0,
      winRatePercent,
      observedRtpPercent,
      maxDrawdownPercent: Math.round(maxDrawdown * 10) / 10,
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      bustedAtRound: bustedAt,
      history,
    };

    return { success: true, result };
  }
}

export const localEngine = new LocalCasinoEngine();
