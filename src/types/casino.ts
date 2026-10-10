export type GameType = 'slots' | 'blackjack' | 'roulette' | 'dice' | 'videopoker' | 'baccarat' | 'plinko';

export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  biggestWin: number;
  streak: number;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  balance: number;
  isFrozen: boolean;
  lastDailyBonusClaim: number | null;
  createdAt: number;
  badges: PlayerBadge[];
  stats: PlayerStats;
}

export interface GameSettings {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  houseEdgePercent: number; // For educational transparency
}

export interface CasinoConfig {
  startingBalance: number;
  dailyBonusAmount: number;
  dailyBonusCooldownHours: number;
  allowBalanceReset: boolean;
  peerTransfersEnabled: boolean;
  maxTransferAmount: number;
  transferFeePercent: number;
  blackjackNaturalPayout: number; // 1.5 for 3:2, 1.2 for 6:5
  slotRtpProfile: 'standard' | 'generous' | 'tight';
  games: {
    slots: GameSettings;
    blackjack: GameSettings;
    roulette: GameSettings;
    dice: GameSettings;
    videopoker: GameSettings;
    baccarat: GameSettings;
    plinko: GameSettings;
  };
}

export type TransactionType =
  | 'bet'
  | 'win'
  | 'loss'
  | 'push'
  | 'bonus'
  | 'transfer_in'
  | 'transfer_out'
  | 'admin_grant'
  | 'reset';

export interface Transaction {
  id: string;
  timestamp: number;
  playerId: string;
  type: TransactionType;
  game: GameType | 'wallet' | 'transfer' | 'system';
  amount: number; // positive for credit, negative for debit
  balanceAfter: number;
  note: string;
  details?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: 'player' | 'admin' | 'system';
  playerId?: string;
  action: string;
  details: string;
}

// Slot Game Interfaces
export type SlotSymbol = 'wild' | 'seven' | 'diamond' | 'bell' | 'bar' | 'cherry';

export interface SlotPaylineHit {
  lineIndex: number;
  symbol: SlotSymbol;
  count: number;
  multiplier: number;
  payout: number;
}

export interface SlotSpinResult {
  reels: SlotSymbol[][]; // 3 reels x 3 visible rows
  hits: SlotPaylineHit[];
  totalPayout: number;
  betPerLine: number;
  activeLines: number;
  totalBet: number;
  netGain: number;
  serverSeedHash: string;
  nonce: number;
}

// Blackjack Interfaces
export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string; // '2'-'10', 'J', 'Q', 'K', 'A'
  points: number; // 1-11
  hidden?: boolean;
}

export type BlackjackHandStatus =
  | 'betting'
  | 'player_turn'
  | 'dealer_turn'
  | 'player_won'
  | 'dealer_won'
  | 'push'
  | 'player_blackjack'
  | 'player_bust'
  | 'dealer_bust';

export interface BlackjackState {
  id: string;
  playerId: string;
  bet: number;
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  status: BlackjackHandStatus;
  payout: number;
  canDouble: boolean;
  canSplit: boolean;
  splitHands?: { cards: Card[]; bet: number; score: number; status: BlackjackHandStatus }[];
}

// Roulette Interfaces
export type RouletteBetType =
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'sixline'
  | 'column'
  | 'dozen'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low' // 1-18
  | 'high'; // 19-36

export interface RouletteBetItem {
  id: string;
  type: RouletteBetType;
  numbers: number[];
  amount: number;
}

export interface RouletteSpinResult {
  winningNumber: number;
  winningColor: 'red' | 'black' | 'green';
  totalBet: number;
  totalPayout: number;
  winningBets: { bet: RouletteBetItem; payout: number }[];
  serverSeedHash: string;
  nonce: number;
}

// Dice Interfaces
export type DiceGameMode = 'multiplier' | 'craps';

export interface MultiplierDiceResult {
  target: number; // 2 - 98
  condition: 'over' | 'under';
  rolledNumber: number; // 0.00 - 99.99
  winChance: number;
  multiplier: number;
  won: boolean;
  bet: number;
  payout: number;
  serverSeedHash: string;
  nonce: number;
}

export interface CrapsDiceResult {
  die1: number;
  die2: number;
  sum: number;
  betType: 'pass' | 'dont_pass' | 'field' | 'craps_seven';
  won: boolean;
  push: boolean;
  multiplier: number;
  bet: number;
  payout: number;
}

// Experiment Mode Interfaces
export type BettingStrategy = 'flat' | 'martingale' | 'paroli' | 'dalembert' | 'fibonacci';

export interface SimulationRoundResult {
  round: number;
  bet: number;
  won: boolean;
  netRound: number;
  balance: number;
}

export interface SimulationResult {
  strategy: BettingStrategy;
  game: GameType;
  roundsCount: number;
  initialBankroll: number;
  finalBankroll: number;
  totalWagered: number;
  totalWon: number;
  wins: number;
  losses: number;
  pushes: number;
  winRatePercent: number;
  observedRtpPercent: number;
  maxDrawdownPercent: number;
  longestWinStreak: number;
  longestLossStreak: number;
  bustedAtRound: number | null;
  history: SimulationRoundResult[];
}

// Video Poker Interfaces
export type PokerHandRank =
  | 'royal_flush'
  | 'straight_flush'
  | 'four_of_a_kind'
  | 'full_house'
  | 'flush'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'jacks_or_better'
  | 'high_card';

export interface VideoPokerState {
  gameId: string;
  phase: 'betting' | 'holding' | 'finished';
  hand: Card[];
  held: boolean[];
  bet: number;
  handRank?: PokerHandRank;
  handName?: string;
  multiplier?: number;
  payout?: number;
  serverSeedHash?: string;
}

// Baccarat Interfaces
export type BaccaratBetType = 'player' | 'banker' | 'tie' | 'player_pair' | 'banker_pair';

export interface BaccaratBetItem {
  betType: BaccaratBetType;
  amount: number;
}

export interface BaccaratBetOutcome {
  betType: BaccaratBetType;
  amount: number;
  won: boolean;
  push: boolean;
  payout: number;
}

export interface BaccaratResult {
  playerHand: Card[];
  bankerHand: Card[];
  playerScore: number;
  bankerScore: number;
  winner: 'player' | 'banker' | 'tie';
  playerPair: boolean;
  bankerPair: boolean;
  isNatural: boolean;
  bets: BaccaratBetOutcome[];
  totalBet: number;
  totalPayout: number;
  serverSeedHash: string;
}

// Plinko Interfaces
export type PlinkoRisk = 'low' | 'medium' | 'high';

export interface PlinkoResult {
  rows: number; // 8, 12, or 16
  risk: PlinkoRisk;
  bet: number;
  directions: number[]; // 0 = left, 1 = right for each row
  slotIndex: number;
  multiplier: number;
  payout: number;
  serverSeedHash: string;
}

