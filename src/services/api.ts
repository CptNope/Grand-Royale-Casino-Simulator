import type {
  CasinoConfig,
  Player,
  Transaction,
  AuditLogEntry,
  SlotSpinResult,
  BlackjackState,
  RouletteBetItem,
  RouletteSpinResult,
  MultiplierDiceResult,
  CrapsDiceResult,
  SimulationResult,
  BettingStrategy,
  GameType,
  VideoPokerState,
  BaccaratBetItem,
  BaccaratResult,
  PlinkoRisk,
  PlinkoResult,
} from '../types/casino.ts';
import { localEngine } from './localEngine.ts';

class ApiService {
  private useLocalFallback: boolean = false;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.useLocalFallback) {
      throw new Error('Using local engine fallback');
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      // If server returns HTML (e.g. 404 in static GitHub Pages or SPA rewrite)
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        this.useLocalFallback = true;
        throw new Error(`Endpoint unavailable (status ${res.status})`);
      }

      return (await res.json()) as T;
    } catch {
      this.useLocalFallback = true;
      throw new Error('API server unavailable; using local browser simulation');
    }
  }

  // State & Config
  public async getState(): Promise<{
    config: CasinoConfig;
    activePlayer: Player;
    playersList: Player[];
    serverSeedHash: string;
    nonce: number;
  }> {
    try {
      return await this.request('/api/state');
    } catch {
      return localEngine.getState();
    }
  }

  public async updateConfig(newConfig: Partial<CasinoConfig>): Promise<{ success: boolean; config: CasinoConfig }> {
    try {
      return await this.request('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
      });
    } catch {
      return localEngine.updateConfig(newConfig);
    }
  }

  // Players & Wallet
  public async getPlayers(): Promise<{ players: Player[]; activePlayerId: string }> {
    try {
      return await this.request('/api/players');
    } catch {
      return localEngine.getPlayers();
    }
  }

  public async switchPlayer(playerId: string): Promise<{ success: boolean; activePlayer: Player }> {
    try {
      return await this.request('/api/players/switch', {
        method: 'POST',
        body: JSON.stringify({ playerId }),
      });
    } catch {
      return localEngine.switchPlayer(playerId);
    }
  }

  public async createPlayer(username: string, avatar?: string): Promise<{ success: boolean; player: Player }> {
    try {
      return await this.request('/api/players/create', {
        method: 'POST',
        body: JSON.stringify({ username, avatar }),
      });
    } catch {
      return localEngine.createPlayer(username, avatar);
    }
  }

  public async claimDailyBonus(): Promise<{
    success: boolean;
    bonusAmount: number;
    balance: number;
    nextAvailable: number;
  }> {
    try {
      return await this.request('/api/wallet/claim-daily', {
        method: 'POST',
      });
    } catch {
      return localEngine.claimDailyBonus();
    }
  }

  public async resetPracticeBalance(): Promise<{ success: boolean; balance: number }> {
    try {
      return await this.request('/api/wallet/reset-practice', {
        method: 'POST',
      });
    } catch {
      return localEngine.resetPracticeBalance();
    }
  }

  public async transferChips(
    recipientId: string,
    amount: number,
    memo?: string
  ): Promise<{
    success: boolean;
    senderBalance: number;
    transferred: number;
    fee: number;
    recipientUsername: string;
  }> {
    try {
      return await this.request('/api/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ recipientId, amount, memo }),
      });
    } catch {
      return localEngine.transferChips(recipientId, amount, memo);
    }
  }

  public async getTransactions(playerId: string): Promise<{ transactions: Transaction[] }> {
    try {
      return await this.request(`/api/wallet/transactions/${playerId}`);
    } catch {
      return localEngine.getTransactions(playerId);
    }
  }

  // Admin controls
  public async adjustPlayer(
    playerId: string,
    payload: { balanceAdjustment?: number; setBalance?: number; toggleFreeze?: boolean }
  ): Promise<{ success: boolean; player: Player }> {
    try {
      return await this.request(`/api/admin/players/${playerId}/adjust`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return localEngine.adjustPlayer(playerId, payload);
    }
  }

  public async getAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
    try {
      return await this.request('/api/admin/audit-logs');
    } catch {
      return localEngine.getAuditLogs();
    }
  }

  public async resetSystem(): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request('/api/admin/reset-system', {
        method: 'POST',
      });
    } catch {
      return localEngine.resetSystem();
    }
  }

  // Games
  public async spinSlots(
    betPerLine: number,
    activeLines: number
  ): Promise<{ success: boolean; result: SlotSpinResult; balance: number }> {
    try {
      return await this.request('/api/games/slots/spin', {
        method: 'POST',
        body: JSON.stringify({ betPerLine, activeLines }),
      });
    } catch {
      return localEngine.spinSlots(betPerLine, activeLines);
    }
  }

  public async dealBlackjack(bet: number): Promise<{ success: boolean; hand: BlackjackState; balance: number }> {
    try {
      return await this.request('/api/games/blackjack/deal', {
        method: 'POST',
        body: JSON.stringify({ bet }),
      });
    } catch {
      return localEngine.dealBlackjack(bet);
    }
  }

  public async actionBlackjack(
    handId: string,
    action: 'hit' | 'stand' | 'double'
  ): Promise<{ success: boolean; hand: BlackjackState; balance: number }> {
    try {
      return await this.request('/api/games/blackjack/action', {
        method: 'POST',
        body: JSON.stringify({ handId, action }),
      });
    } catch {
      return localEngine.actionBlackjack(handId, action);
    }
  }

  public async spinRoulette(
    bets: RouletteBetItem[]
  ): Promise<{ success: boolean; result: RouletteSpinResult; balance: number }> {
    try {
      return await this.request('/api/games/roulette/spin', {
        method: 'POST',
        body: JSON.stringify({ bets }),
      });
    } catch {
      return localEngine.spinRoulette(bets);
    }
  }

  public async rollMultiplierDice(
    bet: number,
    target: number,
    condition: 'over' | 'under'
  ): Promise<{ success: boolean; mode: 'multiplier'; result: MultiplierDiceResult; balance: number }> {
    try {
      return await this.request('/api/games/dice/roll', {
        method: 'POST',
        body: JSON.stringify({ mode: 'multiplier', bet, target, condition }),
      });
    } catch {
      return localEngine.rollMultiplierDice(bet, target, condition);
    }
  }

  public async rollCrapsDice(
    bet: number,
    crapsBetType: 'pass' | 'dont_pass' | 'field' | 'craps_seven'
  ): Promise<{ success: boolean; mode: 'craps'; result: CrapsDiceResult; balance: number }> {
    try {
      return await this.request('/api/games/dice/roll', {
        method: 'POST',
        body: JSON.stringify({ mode: 'craps', bet, crapsBetType }),
      });
    } catch {
      return localEngine.rollCrapsDice(bet, crapsBetType);
    }
  }

  // Video Poker
  public async dealVideoPoker(bet: number): Promise<{ success: boolean; state: VideoPokerState; balance: number }> {
    try {
      return await this.request('/api/games/videopoker/deal', {
        method: 'POST',
        body: JSON.stringify({ bet }),
      });
    } catch {
      return localEngine.videoPokerDeal(bet);
    }
  }

  public async drawVideoPoker(
    gameId: string,
    held: boolean[]
  ): Promise<{ success: boolean; state: VideoPokerState; balance: number }> {
    try {
      return await this.request('/api/games/videopoker/draw', {
        method: 'POST',
        body: JSON.stringify({ gameId, held }),
      });
    } catch {
      return localEngine.videoPokerDraw(gameId, held);
    }
  }

  // Baccarat
  public async playBaccarat(
    bets: BaccaratBetItem[]
  ): Promise<{ success: boolean; result: BaccaratResult; balance: number }> {
    try {
      return await this.request('/api/games/baccarat/play', {
        method: 'POST',
        body: JSON.stringify({ bets }),
      });
    } catch {
      return localEngine.baccaratPlay(bets);
    }
  }

  // Plinko
  public async dropPlinko(
    bet: number,
    rows: number = 12,
    risk: PlinkoRisk = 'medium'
  ): Promise<{ success: boolean; result: PlinkoResult; balance: number }> {
    try {
      return await this.request('/api/games/plinko/drop', {
        method: 'POST',
        body: JSON.stringify({ bet, rows, risk }),
      });
    } catch {
      return localEngine.plinkoDrop(bet, rows, risk);
    }
  }

  // Experiment Simulation
  public async runExperiment(params: {
    game: GameType;
    strategy: BettingStrategy;
    initialBankroll: number;
    baseBet: number;
    roundsCount: number;
    maxBet: number;
  }): Promise<{ success: boolean; result: SimulationResult }> {
    try {
      return await this.request('/api/experiment/simulate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      return localEngine.runExperiment(params);
    }
  }
}

export const api = new ApiService();

