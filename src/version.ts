export interface AppVersionInfo {
  version: string;
  buildTime: string;
  buildCommit: string;
  schemaVersion: number;
  environment: 'development' | 'production';
  features: string[];
}

export const APP_VERSION_INFO: AppVersionInfo = {
  version: '2.4.0',
  buildTime: '2026-10-10T03:10:00Z',
  buildCommit: 'v2.4.0-pwa-mobile-opt',
  schemaVersion: 4,
  environment: 'production',
  features: [
    '7 Provably Fair Casino Games',
    'Interactive 2D Plinko Peg Physics',
    'Punto Banco Baccarat & 9/6 Video Poker',
    'Full Progressive Web App (PWA) Standalone Offline Mode',
    'Hard Cache Clearing & Service Worker Purge Engine',
    'Mobile-Optimized Touch Interfaces & Bottom Bar HUD',
    'Simulated Multi-Strategy Experiment Lab',
    'Peer-to-Peer Transfer Ledger',
    'Full Admin Real-Time Tuning & Audit Logs',
  ],
};

export const CHANGELOG_HISTORY = [
  {
    version: '2.4.0',
    date: '2026-10-10',
    title: 'Mobile Optimization & Hard Cache Purge Engine',
    changes: [
      'Implemented robust version control and schema migration detection.',
      'Added one-click Hard Cache Clear & Service Worker Unregistration dialog with atomic storage purge.',
      'Mobile-first responsive overhaul: fixed bottom thumb-accessible navigation bar for phones.',
      'Added safe-area inset padding and touch-action manipulation to eliminate iOS tap delays and pinch zoom clipping.',
      'Enlarged mobile touch targets for chip selectors, card buttons, and reel spin triggers.',
      'Added quick Cache Diagnostic tool showing Cache Storage, IndexedDB, and LocalStorage quotas.',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-10-10',
    title: 'New Game Triad & Robust Documentation',
    changes: [
      'Added Jacks or Better 9/6 Video Poker with strategic hold/draw mechanics.',
      'Added Royal Baccarat (Punto Banco) with Player, Banker, and Tie wagers.',
      'Added Royal Plinko Pyramid with realistic gravity, bounce physics, and adjustable risk levels.',
      'Expanded comprehensive README with full mathematical game theory rules.',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-10-09',
    title: 'Progressive Web App (PWA) & Offline Engine',
    changes: [
      'Added Service Worker runtime caching and Web App Manifest.',
      'Engineered dual-mode client-server architecture with seamless offline LocalEngine fallback.',
      'Provided in-app iOS Add-to-Home-Screen guide and native install prompts.',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-10-08',
    title: 'Strategy Experiment Lab & Economy',
    changes: [
      'Added Monte Carlo betting strategy simulator (Martingale, Paroli, Fibonacci, D\'Alembert).',
      'Integrated virtual peer-to-peer transfers with simulated escrow and audit logging.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-07',
    title: 'Initial Grand Royale Release',
    changes: [
      'Initial release featuring Slots, Blackjack, Roulette, and Multiplier Dice.',
      'Provably fair RNG hashing and seed verification.',
    ],
  },
];
