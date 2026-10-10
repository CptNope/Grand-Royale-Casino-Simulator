# Grand Royale Casino Simulator

A full-stack, responsive casino simulator built exclusively for virtual play-money entertainment, mathematical strategy testing, and transparency.

**Live Demo URL**: [https://cptnope.github.io/Lucas-Idea/](https://cptnope.github.io/Lucas-Idea/)

---

## 🎰 Included Games & Features

- **Play-Money Only**: Strictly virtual chips with zero deposits, withdrawals, or cash redemptions.
- **Player Accounts & Wallets**: Starting balances, daily bonuses with cooldown timers, full transaction ledger, practice balance reset, and collectible achievement badges.
- **Playable Games**:
  - **Slots (Golden Fortune)**: 3-reel mechanical slot machine with 5 paylines, wild symbols, and real payout multipliers.
  - **Blackjack (Royal Velvet)**: Vegas/European table rules where the dealer stands on 17, double down, and 3:2 natural payouts.
  - **Roulette (Monte Carlo)**: Single-zero European roulette with 37 pockets, interactive felt betting (Inside & Outside bets), animated spinning wheel and ball deceleration, plus hot/cold history.
  - **Dice (Imperial Dice Arena)**: Dual-mode with a Provably Fair Multiplier Hi-Lo slider and a classic Casino Craps table (Pass Line, Don't Pass, Field, Any Seven).
- **Experiment Lab**: Monte Carlo strategy tester comparing Martingale, Paroli (Reverse Martingale), D'Alembert, Flat Betting, and Fibonacci across 50–1,000 rounds with interactive SVG balance trajectory curves and RTP analytics.
- **Peer Transfers**: Transfer virtual chips between registered players with memos and admin-enforced limits.
- **Admin Dashboard**: Live, no-code tuning for game enablement, minimum and maximum bets, theoretical house edge, starting wallets, daily bonus amounts, and chronological security audit logs.
- **Procedural Audio**: Web Audio API synthesizer for ceramic chip clinks, card deals, reel clicks, and win fanfares (no external audio file dependencies).
- **Accessibility**: Volume controls, mute toggle, and reduced-motion support.

---

## 🚀 GitHub Pages Deployment

This repository is pre-configured for automated GitHub Pages deployment via GitHub Actions:

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/CptNope/Lucas-Idea.git
   git branch -M main
   git push -u origin main
   ```

2. On GitHub, go to your repository:
   - Navigate to **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, choose **GitHub Actions**.

3. Once selected, the `.github/workflows/deploy.yml` workflow will automatically run, build the static application, and publish it to:
   ```
   https://cptnope.github.io/Lucas-Idea/
   ```

---

## 💻 Local Development

To run the simulator locally on your machine:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run the development server
npm run dev

# 3. Build for production
npm run build
```

---

## 🛡️ License & Educational Disclaimer

This simulator is intended solely for educational, gaming, and research purposes. All chips and balances consist entirely of simulated play money with zero real-world monetary value.
