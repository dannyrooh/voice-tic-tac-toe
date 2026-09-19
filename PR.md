## Rewrite: voice-controlled tic-tac-toe with an AI opponent

Turns the 2022 React tutorial into a portfolio piece that shows off voice interfaces and AI opponents.

### What changed
- **Stack:** CRA + React 17 class components → Vite + React 19 + TypeScript (strict)
- **Voice input:** Web Speech API (pt-BR / en-US) with a tolerant parser ("canto superior esquerdo", "center", "cinco", "novo jogo")
- **Voice output:** the AI reads its commentary aloud, and the mic ignores the AI's own voice
- **AI opponent:** minimax with 3 levels; *Unbeatable* is verified against every possible game
- **Commentary:** detects blocks, threats, forks, wins and draws; optional Claude-written lines via a Vercel function (`api/commentary.ts`), with the key kept server-side and a local fallback
- **Gameplay:** draw detection (missing before), undo, scoreboard, move list, keyboard play (1–9, N), a11y and light/dark themes
- **Quality:** 41 Vitest unit tests, GitHub Actions CI, bilingual README, MIT license

### How to test
```bash
npm install
npm test
npm run dev   # open in Chrome/Edge and click "Falar jogada"
```

### Checklist
- [ ] `npm install && npm test && npm run build` pass locally
- [ ] Voice works in Chrome (grant mic permission)
- [ ] Deployed to Vercel and demo link added to README

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_0185C7QVcHtnFR5cGpJGMPXm
