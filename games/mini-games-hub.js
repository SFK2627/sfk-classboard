(() => {
  'use strict';

  const ASSET_VERSION = '20260919-v554-byte-strike-mobile-landscape';

  const GAME_REGISTRY = Object.freeze([
    {
      id: 'code-fly',
      stateKey: 'codeFly',
      name: 'CODE FLY',
      icon: '🖥️',
      description: 'Fly through digital server towers, beat your high score, and earn a little bonus XP.',
      maxXp: 15,
      globalName: 'ICT8CodeFly',
      script: 'games/code-fly/code-fly.js',
      style: 'games/code-fly/code-fly.css',
      bestText(record = {}) { return `🏆 Best Score: ${Math.max(0, Number(record.bestScore || 0))}`; }
    },
    {
      id: 'bug-smash',
      stateKey: 'bugSmash',
      name: 'BUG SMASH',
      icon: '🐛',
      description: 'Smash bugs before they disappear. Build combos and test your reaction speed!',
      maxXp: 10,
      globalName: 'ICT8BugSmash',
      script: 'games/bug-smash/bug-smash.js',
      style: 'games/bug-smash/bug-smash.css',
      bestText(record = {}) { return `🏆 Best: ${Math.max(0, Number(record.bestScore || 0))}`; }
    },
    {
      id: 'runner-404',
      stateKey: 'runner404',
      name: '404 RUNNER',
      icon: '🏃',
      description: 'Run through the digital world, jump over errors, and survive as long as you can.',
      maxXp: 15,
      globalName: 'ICT8404Runner',
      script: 'games/runner-404/runner-404.js',
      style: 'games/runner-404/runner-404.css',
      bestText(record = {}) { return `🏆 Best: ${Math.max(0, Number(record.bestScore || 0))}`; }
    },
    {
      id: 'memory-code',
      stateKey: 'memoryCode',
      name: 'MEMORY CODE',
      icon: '🧠',
      description: 'Flip the cards, remember their positions, and match all the coding pairs.',
      maxXp: 8,
      globalName: 'ICT8MemoryCode',
      script: 'games/memory-code/memory-code.js',
      style: 'games/memory-code/memory-code.css',
      bestText(record = {}) {
        const timeMs = Math.max(0, Number(record.bestTimeMs || 0));
        return timeMs > 0 ? `🏆 Best: ${(timeMs / 1000).toFixed(1)} sec` : '🏆 Best: —';
      }
    },
    {
      id: 'code-snake',
      stateKey: 'codeSnake',
      name: 'CODE SNAKE',
      icon: '🐍',
      description: 'Collect code tokens, grow your digital chain, and avoid crashing into yourself.',
      maxXp: 10,
      globalName: 'ICT8CodeSnake',
      script: 'games/code-snake/code-snake.js',
      style: 'games/code-snake/code-snake.css',
      bestText(record = {}) { return `🏆 Best: ${Math.max(0, Number(record.bestScore || 0))}`; }
    },
    {
      id: 'code-stack',
      stateKey: 'codeStack',
      name: 'CODE STACK',
      icon: '🧱',
      description: 'Stack moving code blocks, hit perfect placements, and build the highest tower you can.',
      maxXp: 10,
      globalName: 'ICT8CodeStack',
      script: 'games/code-stack/code-stack.js',
      style: 'games/code-stack/code-stack.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestScore || 0));
        const tower = Math.max(0, Number(record.highestTower || 0));
        return tower > 0 ? `🏆 Best: ${score} · Tower ${tower}` : `🏆 Best: ${score}`;
      }
    },
    {
      id: 'byte-rush',
      stateKey: 'byteRush',
      name: 'BYTE RUSH',
      icon: '🚗',
      description: 'Race through a cyber highway, dodge errors, and collect score chips without crashing.',
      maxXp: 10,
      globalName: 'ICT8ByteRush',
      script: 'games/byte-rush/byte-rush.js',
      style: 'games/byte-rush/byte-rush.css',
      bestText(record = {}) {
        const distance = Math.max(0, Number(record.bestDistance || record.bestScore || 0));
        return `🏆 Best Distance: ${Math.floor(distance)}`;
      }
    },
    {
      id: 'rocket-byte',
      stateKey: 'rocketByte',
      name: 'ROCKET BYTE',
      icon: '🚀',
      description: 'Climb through the digital sky, dodge errors, collect fuel, and reach a new height record.',
      maxXp: 10,
      globalName: 'ICT8RocketByte',
      script: 'games/rocket-byte/rocket-byte.js',
      style: 'games/rocket-byte/rocket-byte.css',
      bestText(record = {}) {
        const height = Math.max(0, Number(record.bestHeight || record.bestScore || 0));
        return `🏆 Best Height: ${Math.floor(height)}`;
      }
    },
    {
      id: 'falling-code',
      stateKey: 'fallingCode',
      name: 'FALLING CODE',
      icon: '🪂',
      description: 'Fall through digital platforms, line up with shrinking gaps, and dive as deep as you can.',
      maxXp: 10,
      globalName: 'ICT8FallingCode',
      script: 'games/falling-code/falling-code.js',
      style: 'games/falling-code/falling-code.css',
      bestText(record = {}) {
        const depth = Math.max(0, Number(record.bestDepth || record.bestScore || 0));
        return `🏆 Best Depth: ${Math.floor(depth)}`;
      }
    },
    {
      id: 'perfect-shot',
      stateKey: 'perfectShot',
      name: 'PERFECT SHOT',
      icon: '\u{1F3AF}',
      description: 'Time the moving target, hit the bullseye, and build a perfect-shot combo.',
      maxXp: 10,
      globalName: 'ICT8PerfectShot',
      script: 'games/perfect-shot/perfect-shot.js',
      style: 'games/perfect-shot/perfect-shot.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestScore || 0));
        const combo = Math.max(0, Number(record.bestCombo || 0));
        return combo > 0 ? `\u{1F3C6} Best: ${score} \u00b7 Combo x${combo}` : `\u{1F3C6} Best: ${score}`;
      }
    },
    {
      id: 'dial-in',
      stateKey: 'dialIn',
      name: 'DIAL IN',
      icon: '🎯',
      description: 'Memory. Precision. Timing. Match a color, pitch, or hidden timer across five fast accuracy rounds.',
      maxXp: 5,
      category: 'PRECISION / MEMORY',
      difficulty: '★★★★☆',
      globalName: 'ICT8DialIn',
      script: 'games/dial-in/dial-in.js',
      style: 'games/dial-in/dial-in.css',
      bestText(record = {}) {
        const best = Math.max(0, Number(record.bestColorAccuracy || 0), Number(record.bestSoundAccuracy || 0), Number(record.bestTimeAccuracy || 0));
        return best > 0 ? `🎯 Best: ${best.toFixed(1)}%` : '🎯 Precision ready';
      }
    },
    {
      id: 'color-switch-byte',
      stateKey: 'colorSwitchByte',
      name: 'COLOR SWITCH BYTE',
      icon: '\u{1F7E8}',
      description: 'Tap upward and pass through rotating color sections only when your byte color matches.',
      maxXp: 10,
      globalName: 'ICT8ColorSwitchByte',
      script: 'games/color-switch-byte/color-switch-byte.js',
      style: 'games/color-switch-byte/color-switch-byte.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestScore || 0));
        return `\u{1F3C6} Best: ${score}`;
      }
    },
    {
      id: 'code-hoops',
      stateKey: 'codeHoops',
      name: 'CODE HOOPS',
      icon: '\u{1F3C0}',
      description: 'Drag, aim, and release a digital ball into moving hoops. Perfect swishes build your streak.',
      maxXp: 10,
      globalName: 'ICT8CodeHoops',
      script: 'games/code-hoops/code-hoops.js',
      style: 'games/code-hoops/code-hoops.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestScore || 0));
        const streak = Math.max(0, Number(record.bestStreak || 0));
        return streak > 0 ? `\u{1F3C6} Best: ${score} \u00b7 Streak x${streak}` : `\u{1F3C6} Best: ${score}`;
      }
    },
    {
      id: 'red-light-green-light',
      stateKey: 'redLightGreenLight',
      name: 'RED LIGHT / GREEN LIGHT',
      icon: '\u{1F534}',
      description: 'Hold to run on green, stop fast on red, and reach the digital finish line without getting caught.',
      maxXp: 10,
      globalName: 'ICT8RedLightGreenLight',
      script: 'games/red-light-green-light/red-light-green-light.js',
      style: 'games/red-light-green-light/red-light-green-light.css',
      bestText(record = {}) {
        const distance = Math.max(0, Number(record.bestDistance || record.bestScore || 0));
        const timeMs = Math.max(0, Number(record.fastestFinishMs || 0));
        return timeMs > 0 ? `\u{1F3C6} Finish: ${(timeMs / 1000).toFixed(1)}s` : `\u{1F3C6} Best Run: ${Math.floor(distance)}`;
      }
    },
    {
      id: 'code-maze',
      stateKey: 'codeMaze',
      name: 'CODE MAZE',
      icon: '🧩',
      description: 'Guide a coding cursor through generated mazes, collect the key, and reach the exit before time runs out.',
      maxXp: 10,
      globalName: 'ICT8CodeMaze',
      script: 'games/code-maze/code-maze.js',
      style: 'games/code-maze/code-maze.css',
      bestText(record = {}) {
        const level = Math.max(0, Number(record.bestLevel || record.bestScore || 0));
        const timeMs = Math.max(0, Number(record.fastestLevelMs || 0));
        return timeMs > 0 ? `🏆 Best Level: ${level} · ${(timeMs / 1000).toFixed(1)}s` : `🏆 Best Level: ${level}`;
      }
    },
    {
      id: 'code-flow',
      stateKey: 'codeFlow',
      name: 'CODE FLOW',
      icon: '🧩',
      description: 'Connect matching logic nodes, fill the grid, and route every path without crossing.',
      maxXp: 5,
      category: 'LOGIC',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeFlow',
      script: 'games/code-flow/code-flow.js',
      style: 'games/code-flow/code-flow.css',
      bestText(record = {}) {
        const level = Math.max(0, Number(record.highestCompletedLevel || record.bestLevel || 0));
        const score = Math.max(0, Number(record.bestScore || 0));
        return level > 0 ? `🏆 Level ${level} · Best ${score}` : '🏆 Level 1 ready';
      }
    },
    {
      id: 'byte-sling',
      stateKey: 'byteSling',
      name: 'BYTE SLING',
      icon: '🚀',
      description: 'Pull, aim, and launch code packets to collapse corrupted structures and debug every BUG.',
      maxXp: 3,
      category: 'PHYSICS / PUZZLE',
      difficulty: '★★★★☆',
      globalName: 'ICT8ByteSling',
      script: 'games/byte-sling/byte-sling.js',
      style: 'games/byte-sling/byte-sling.css',
      bestText(record = {}) {
        const run = Math.max(0, Number(record.highestRunIndex || 0));
        const score = Math.max(0, Number(record.bestRunScore || record.bestScore || 0));
        return run > 0 ? `🏆 Run ${run} · Best ${score}` : '🏆 Run 1 ready';
      }
    },
    {
      id: 'code-bridge',
      stateKey: 'codeBridge',
      name: 'CODE BRIDGE',
      icon: '🌉',
      description: 'Hold to extend a DATA LINK, release to bridge the gap, and reach the ENDPOINT without falling.',
      maxXp: 3,
      category: 'TIMING / LOGIC',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeBridge',
      script: 'games/code-bridge/code-bridge.js',
      style: 'games/code-bridge/code-bridge.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestRunScore || record.bestScore || 0));
        const perfects = Math.max(0, Number(record.bestPerfects || 0));
        return score > 0 ? `🏆 Best ${score} · ${perfects} Perfect` : '🏆 Endpoint ready';
      }
    },
    {
      id: 'code-slice',
      stateKey: 'codeSlice',
      name: 'CODE SLICE',
      icon: '⚔️',
      description: 'Swipe through flying code tokens, build combos, and avoid the CRASH CORE through five rising-speed waves.',
      maxXp: 3,
      category: 'ARCADE / REFLEX',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeSlice',
      script: 'games/code-slice/code-slice.js',
      style: 'games/code-slice/code-slice.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestRunScore || record.bestScore || 0));
        const combo = Math.max(0, Number(record.bestCombo || 0));
        return score > 0 ? `🏆 Best ${score} · Combo x${combo}` : '🏆 Stream ready';
      }
    },
    {
      id: 'million-byte',
      stateKey: 'millionByte',
      name: 'MILLION BYTE',
      icon: '🧠',
      description: 'Climb a 15-question general-knowledge ladder from Easy to Expert. Fresh questions retire as you play.',
      maxXp: 3,
      category: 'QUIZ / GENERAL KNOWLEDGE',
      difficulty: '★★★★☆',
      globalName: 'ICT8MillionByte',
      script: 'games/million-byte/million-byte.js',
      style: 'games/million-byte/million-byte.css',
      bestText(record = {}) {
        const reached = Math.max(0, Number(record.bestReached || 0));
        const score = Math.max(0, Number(record.bestScore || 0));
        return reached >= 15 ? `🏆 1M BYTE · Best ${score}` : (reached > 0 ? `🏆 Best Q${reached}/15` : '🏆 Fresh ladder ready');
      }
    },
    {
      id: 'code-vault',
      stateKey: 'codeVault',
      name: 'CODE VAULT',
      icon: '💼',
      description: 'Choose a sealed data vault, open cases, face seven banker offers, and decide when to take the deal.',
      maxXp: 2,
      category: 'STRATEGY / LUCK',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeVault',
      script: 'games/code-vault/code-vault.js',
      style: 'games/code-vault/code-vault.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestScore || 0));
        const round = Math.max(0, Number(record.bestRound || 0));
        return score > 0 ? `🏆 Best ${score} · ${round >= 7 ? 'Final' : `R${round}`}` : '🏆 Vault room ready';
      }
    },
    {
      id: 'code-tiles',
      stateKey: 'codeTiles',
      name: 'CODE TILES',
      icon: '🎹',
      description: 'Classic Piano Tiles-style run: tap only the next black tile, hold long tiles until they finish, and never touch an empty lane.',
      maxXp: 3,
      category: 'PIANO / CLASSIC TILES',
      difficulty: '★★★★☆',
      globalName: 'ICT8CodeTiles',
      script: 'games/code-tiles/code-tiles.js',
      style: 'games/code-tiles/code-tiles.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestRunScore || record.bestScore || 0));
        const accuracy = Math.max(0, Number(record.bestAccuracy || 0));
        return score > 0 ? `🏆 Best ${score} · ${accuracy.toFixed(1)}%` : '🏆 Track ready';
      }
    },
    {
      id: 'byte-runner-html-rush',
      stateKey: 'byteRunnerHtmlRush',
      name: 'BYTE RUNNER: HTML RUSH',
      icon: '⚡',
      description: 'Race through a bright rail city, read HTML challenges, and use the correct run, jump, or slide action to build a complete webpage.',
      maxXp: 20,
      category: 'EDUCATIONAL / RUNNER',
      difficulty: '★★★★☆',
      globalName: 'ICT8ByteRunnerHtmlRush',
      dependencies: ['games/byte-runner-html-rush/byte-runner-3d.js'],
      script: 'games/byte-runner-html-rush/byte-runner-html-rush.js',
      style: 'games/byte-runner-html-rush/byte-runner-html-rush.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestArcadeScore || record.bestScore || 0));
        const accuracy = Math.max(0, Number(record.bestAccuracy || 0));
        const rank = Math.max(0, Math.min(4, Number(record.bestDifficultyRank || 0)));
        const label = ['', 'Easy', 'Medium', 'Hard', 'Difficult'][rank] || '';
        return score > 0 ? `🏆 Best ${Math.floor(score).toLocaleString()} · ${accuracy.toFixed(1)}%${label ? ` · ${label}` : ''}` : '🏆 HTML mission ready';
      }
    },
    {
      id: 'byte-hangman',
      stateKey: 'byteHangman',
      name: 'BYTE HANGMAN',
      icon: '◈',
      description: 'Classic Hangman rebuilt for G8Code: guess letters before the hanging figure is completed. Five solo modes, broad learning topics, custom keyboard controls, and controlled XP.',
      maxXp: 20,
      category: 'WORD / EDUCATIONAL ARCADE',
      difficulty: '★★★★☆',
      globalName: 'ICT8ByteHangman',
      dependencies: ['games/byte-hangman/byte-hangman-bank.js'],
      script: 'games/byte-hangman/byte-hangman.js',
      style: 'games/byte-hangman/byte-hangman.css',
      bestText(record = {}) {
        const score = Math.max(0, Number(record.bestScore || 0));
        const streak = Math.max(0, Number(record.bestLetterStreak || 0));
        return score > 0 ? `🏆 Best ${Math.floor(score).toLocaleString()} · Streak ×${streak}` : '🏆 Hangman ready';
      }
    },
    {
      id: 'code-duel',
      stateKey: 'codeDuel',
      name: 'CODE DUEL',
      icon: '⚔️',
      description: 'Challenge another student live. Send an invite by Student ID or pair by QR, then race through the same coding challenges with 0 XP.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: 'LIVE 2 PLAYER / CODING',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeDuel',
      script: 'games/code-duel/code-duel.js',
      style: 'games/code-duel/code-duel.css',
      bestText() { return '👥 LIVE 1v1 · 0 XP'; }
    },
    {
      id: 'code-tower-race',
      stateKey: 'codeTowerRace',
      name: 'CODE TOWER RACE',
      icon: '🧱',
      description: 'Race another player to assemble HTML, CSS, and JavaScript blocks in the correct order. Correct blocks build your tower; mistakes fall away.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: '2P RACE / CODING',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeTowerRace',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js'],
      script: 'games/code-tower-race/code-tower-race.js',
      style: 'games/code-tower-race/code-tower-race.css',
      playLabel: 'PLAY 2P',
      bestText() { return '🧱 LIVE RACE · 0 XP'; }
    },
    {
      id: 'code-snake-duel',
      stateKey: 'codeSnakeDuel',
      name: 'CODE SNAKE DUEL',
      icon: '🐍',
      description: 'Two snakes share one live arena. Collect BYTE tokens, grow longer, cut off your opponent, and survive the grid.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: '2P ARCADE / PVP',
      difficulty: '★★★★☆',
      globalName: 'ICT8CodeSnakeDuel',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js'],
      script: 'games/code-snake-duel/code-snake-duel.js',
      style: 'games/code-snake-duel/code-snake-duel.css',
      playLabel: 'PLAY 2P',
      bestText() { return '🐍 SHARED ARENA · 0 XP'; }
    },
    {
      id: 'byte-space-battle',
      stateKey: 'byteSpaceBattle',
      name: 'BYTE SPACE BATTLE',
      icon: '🚀',
      description: 'Pilot two ships in one cyber-space arena. Dodge asteroids, fire at your rival, collect power-ups, and unlock boosts from code terminals.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: '2P ACTION / PVP',
      difficulty: '★★★★☆',
      globalName: 'ICT8ByteSpaceBattle',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js'],
      script: 'games/byte-space-battle/byte-space-battle.js',
      style: 'games/byte-space-battle/byte-space-battle.css',
      playLabel: 'PLAY 2P',
      bestText() { return '🚀 SPACE BATTLE · 0 XP'; }
    },
    {
      id: 'code-escape-coop',
      stateKey: 'codeEscapeCoop',
      name: 'CODE ESCAPE — CO-OP',
      icon: '🧩',
      description: 'Escape together. Each device sees different clues, so both players must communicate, solve code locks, and synchronize the final core.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      coop: true,
      category: '2P CO-OP / PUZZLE',
      difficulty: '★★★★☆',
      globalName: 'ICT8CodeEscapeCoop',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js'],
      script: 'games/code-escape-coop/code-escape-coop.js',
      style: 'games/code-escape-coop/code-escape-coop.css',
      playLabel: 'PLAY CO-OP',
      bestText() { return '🧩 CO-OP ESCAPE · 0 XP'; }
    },

    {
      id: 'code-dama',
      stateKey: 'codeDama',
      name: 'CODE DAMA',
      icon: '♟️',
      description: 'Play Code Dama solo against a selectable AI difficulty, or challenge a classmate in live 1v1 Classic, Speed, Blitz, King Rush, or Power Dama.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: 'SOLO / 2P STRATEGY',
      difficulty: '★★★★☆',
      globalName: 'ICT8CodeDama',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js'],
      script: 'games/code-dama/code-dama.js',
      style: 'games/code-dama/code-dama.css',
      playLabel: 'PLAY SOLO / 1V1',
      bestText() { return '♟️ SOLO / LIVE 1V1 · 0 XP'; }
    },
    {
      id: 'code-climb',
      stateKey: 'codeClimb',
      name: 'CODE CLIMB',
      icon: '🐍🪜',
      description: 'Play Snakes & Ladders solo against bots or create a live 2–4 player room with Student ID invites, a reusable QR, or a room code.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: '1–4 PLAYER / BOARD',
      difficulty: '★★☆☆☆',
      globalName: 'ICT8CodeClimb',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js'],
      script: 'games/code-climb/code-climb.js',
      style: 'games/code-climb/code-climb.css',
      playLabel: 'PLAY 1–4P',
      bestText() { return '🐍🪜 SOLO / LIVE 2–4P · 0 XP'; }
    },
    {
      id: 'code-uno',
      stateKey: 'codeUno',
      name: 'UNO!',
      icon: '🃏',
      description: 'Play a polished classic color-card match solo against 1–9 bots, or host a live 2–10 player room with room code, QR, and Student ID invites.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: 'SOLO / LIVE 2–10 PLAYER',
      difficulty: '★★★☆☆',
      globalName: 'ICT8CodeUno',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js', 'games/code-uno/code-uno-engine.js'],
      script: 'games/code-uno/code-uno.js',
      style: 'games/code-uno/code-uno.css',
      playLabel: 'PLAY UNO!',
      bestText() { return '🃏 SOLO / LIVE 2–10P · 0 XP'; }
    },
    {
      id: 'pinoy-feud',
      stateKey: 'pinoyFeud',
      name: 'PINOY FEUD',
      icon: '🇵🇭',
      description: 'Hulaan ang top Filipino game-board answers. Play solo vs bot, challenge another player with a live buzzer, or connect a view-only audience screen for TV/projector.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: 'SOLO / 2P / AUDIENCE',
      difficulty: '★★★☆☆',
      globalName: 'ICT8PinoyFeud',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js', 'games/pinoy-feud/pinoy-feud-questions.js'],
      script: 'games/pinoy-feud/pinoy-feud.js',
      style: 'games/pinoy-feud/pinoy-feud.css',
      playLabel: 'PLAY FEUD',
      bestText() { return '🎤 SOLO · LIVE 1V1 · AUDIENCE · 0 XP'; }
    },
    {
      id: 'code-impostor',
      stateKey: 'codeImpostor',
      name: 'CODE IMPOSTOR',
      icon: '🕵️',
      description: 'A social deduction word game for any topic. Play solo vs bots, host a private 3–12 player room, run a classroom projector, or join as a view-only spectator.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: 'SOLO / 3–12P / SOCIAL DEDUCTION',
      difficulty: '★★★★☆',
      globalName: 'ICT8CodeImpostor',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js', 'games/code-impostor/code-impostor-bank.js'],
      script: 'games/code-impostor/code-impostor.js',
      style: 'games/code-impostor/code-impostor.css',
      playLabel: 'PLAY IMPOSTOR',
      bestText() { return '🕵️ SOLO · LIVE 3–12P · CLASSROOM · 0 XP'; }
    },
    {
      id: 'byte-strike',
      stateKey: 'byteStrike',
      name: 'BYTE STRIKE',
      icon: '🎯',
      description: 'Premium top-down tactical shooter with directional vision, wall occlusion, 8 arenas, VS Bot, and low-latency live 1v1 WebRTC duels.',
      maxXp: 0,
      multiplayer: true,
      noXp: true,
      category: 'SOLO VS BOT / LIVE 1V1 / TACTICAL SHOOTER',
      difficulty: '★★★★★',
      globalName: 'ICT8ByteStrike',
      dependencies: ['games/p2p-zero-db/p2p-zero-db.js', 'games/byte-strike/byte-strike-maps.js'],
      script: 'games/byte-strike/byte-strike.js',
      style: 'games/byte-strike/byte-strike.css',
      playLabel: 'PLAY BYTE STRIKE',
      bestText() { return '🎯 VS BOT · LIVE 1V1 · 8 MAPS · 0 XP'; }
    },
    {
      id: 'pattern-lock',
      stateKey: 'patternLock',
      name: 'PATTERN LOCK',
      icon: '🔐',
      description: 'Watch the code pattern, remember the sequence, and repeat it as the chain gets longer.',
      maxXp: 10,
      globalName: 'ICT8PatternLock',
      script: 'games/pattern-lock/pattern-lock.js',
      style: 'games/pattern-lock/pattern-lock.css',
      bestText(record = {}) {
        const level = Math.max(0, Number(record.bestLevel || record.bestScore || 0));
        return `🏆 Best Level: ${level}`;
      }
    }
  ]);


  /* =========================================================
     GAME AUDIO v1 — lightweight procedural soundtrack engine
     ---------------------------------------------------------
     Goals:
     - every current Mini-Game gets its own original loop/profile;
     - future games still receive a deterministic fallback track;
     - no copyrighted audio files or network fetches;
     - one looping AudioBufferSource only during gameplay, so the
       soundtrack adds almost no per-frame CPU load on phones;
     - the existing shared Mini-Game sound toggle controls both the
       game module SFX and this background soundtrack;
     - BGM ducks briefly on input so in-game SFX remain easy to hear.
     ========================================================= */

  const MINI_GAME_SOUNDTRACK_PROFILES = Object.freeze({
    'code-fly':               { bpm:132, root:57, scale:'minorPent', lead:'pulse',  melody:[0,null,2,3,4,null,3,2,0,null,4,5,4,3,2,null], bass:[0,0,3,4], drums:'drive',  gain:.31 },
    'bug-smash':              { bpm:142, root:52, scale:'minorPent', lead:'square', melody:[0,2,null,3,0,4,null,3,2,null,4,5,3,2,0,null], bass:[0,3,0,4], drums:'punch',  gain:.30 },
    'runner-404':             { bpm:154, root:50, scale:'minor',     lead:'pulse',  melody:[0,2,4,null,5,4,2,null,0,2,5,6,5,4,2,null], bass:[0,0,5,4], drums:'drive',  gain:.31 },
    'memory-code':            { bpm:92,  root:60, scale:'majorPent', lead:'bell',   melody:[0,null,2,null,4,null,3,null,1,null,3,null,4,2,1,null], bass:[0,3,4,3], drums:'soft',   gain:.27 },
    'code-snake':             { bpm:118, root:55, scale:'minorPent', lead:'pluck',  melody:[0,1,2,null,3,2,1,null,0,2,3,4,3,2,1,null], bass:[0,0,3,4], drums:'groove', gain:.30 },
    'code-stack':             { bpm:108, root:48, scale:'majorPent', lead:'pluck',  melody:[0,null,1,2,3,null,2,1,0,null,2,3,4,3,2,null], bass:[0,3,4,3], drums:'groove', gain:.29 },
    'byte-rush':              { bpm:158, root:45, scale:'minor',     lead:'saw',    melody:[0,2,4,5,4,2,0,null,0,3,5,6,5,3,2,null], bass:[0,5,0,4], drums:'drive',  gain:.31 },
    'rocket-byte':            { bpm:126, root:50, scale:'dorian',    lead:'pulse',  melody:[0,null,2,4,5,4,2,null,0,2,4,6,5,4,2,null], bass:[0,4,5,4], drums:'drive',  gain:.30 },
    'falling-code':           { bpm:112, root:47, scale:'minor',     lead:'bell',   melody:[4,null,3,2,1,null,0,null,5,null,4,3,2,1,0,null], bass:[0,5,3,4], drums:'soft',   gain:.28 },
    'perfect-shot':           { bpm:120, root:57, scale:'majorPent', lead:'pluck',  melody:[0,null,2,null,4,3,2,null,0,null,3,null,4,5,4,null], bass:[0,3,4,3], drums:'groove', gain:.29 },
    'color-switch-byte':      { bpm:128, root:60, scale:'majorPent', lead:'bell',   melody:[0,2,4,3,1,3,4,5,4,2,0,2,3,4,2,null], bass:[0,4,3,4], drums:'dance',  gain:.30 },
    'dial-in':                { bpm:100, root:57, scale:'dorian',    lead:'bell',   melody:[0,null,2,null,4,3,null,2,0,null,3,null,5,4,2,null], bass:[0,3,4,3], drums:'soft',   gain:.29 },
    'code-hoops':             { bpm:104, root:50, scale:'minorPent', lead:'pluck',  melody:[0,null,2,3,null,2,0,null,3,null,4,3,2,0,null,null], bass:[0,3,4,3], drums:'groove', gain:.30 },
    'red-light-green-light':  { bpm:116, root:52, scale:'minor',     lead:'pulse',  melody:[0,null,0,2,null,2,3,null,0,null,4,3,2,null,0,null], bass:[0,0,3,4], drums:'pulse',  gain:.28 },
    'code-maze':              { bpm:110, root:53, scale:'minor',     lead:'bell',   melody:[0,null,2,3,5,null,3,2,0,null,4,5,4,2,1,null], bass:[0,3,5,4], drums:'soft',   gain:.27 },
    'code-flow':              { bpm:96,  root:60, scale:'majorPent', lead:'bell',   melody:[0,null,1,null,2,3,null,4,3,null,2,1,0,null,2,null], bass:[0,3,4,3], drums:'soft',   gain:.26 },
    'byte-sling':             { bpm:106, root:50, scale:'minorPent', lead:'pluck',  melody:[0,null,3,null,4,3,2,null,0,2,null,4,5,4,2,null], bass:[0,3,4,3], drums:'punch',  gain:.29 },
    'code-bridge':            { bpm:100, root:57, scale:'minorPent', lead:'pluck',  melody:[0,null,1,2,null,3,2,null,0,null,3,4,3,2,1,null], bass:[0,3,4,3], drums:'soft',   gain:.28 },
    'code-slice':             { bpm:150, root:45, scale:'minorPent', lead:'saw',    melody:[0,2,3,4,3,2,0,null,0,3,4,5,4,3,2,null], bass:[0,0,3,4], drums:'drive',  gain:.30 },
    'million-byte':           { bpm:94,  root:55, scale:'minor',     lead:'bell',   melody:[0,null,2,null,3,null,5,null,4,null,3,2,1,null,0,null], bass:[0,3,5,4], drums:'suspense', gain:.25 },
    'code-vault':             { bpm:88,  root:52, scale:'minor',     lead:'bell',   melody:[0,null,3,null,2,null,5,null,4,null,2,null,1,null,0,null], bass:[0,5,3,4], drums:'suspense', gain:.25 },
    'code-tiles':             { bpm:138, root:57, scale:'minorPent', lead:'pluck',  melody:[0,null,2,null,3,null,4,null,3,null,2,null,4,null,5,null], bass:[0,3,4,3], drums:'dance',  gain:.20 },
    'byte-runner-html-rush':  { bpm:144, root:50, scale:'minor',     lead:'pulse',  melody:[0,2,4,null,5,4,2,null,0,3,5,null,6,5,3,null], bass:[0,0,5,4], drums:'drive',  gain:.31 },
    'byte-hangman':           { bpm:104, root:55, scale:'minorPent', lead:'bell', melody:[0,null,2,3,null,4,3,null,1,null,3,5,4,2,0,null], bass:[0,3,4,3], drums:'suspense', gain:.26 },
    'code-duel':              { bpm:148, root:50, scale:'minorPent', lead:'pulse',  melody:[0,2,3,5,3,2,0,null,0,3,4,5,4,3,2,null], bass:[0,0,3,4], drums:'drive',  gain:.32 },
    'code-tower-race':        { bpm:124, root:52, scale:'majorPent', lead:'pluck', melody:[0,2,3,4,3,2,1,null,0,3,4,5,4,3,2,null], bass:[0,3,4,3], drums:'groove', gain:.31 },
    'code-snake-duel':        { bpm:136, root:50, scale:'minorPent', lead:'pulse', melody:[0,1,3,2,4,3,2,null,0,2,4,5,4,3,1,null], bass:[0,0,3,4], drums:'drive', gain:.32 },
    'byte-space-battle':      { bpm:152, root:45, scale:'dorian', lead:'saw', melody:[0,2,4,5,6,4,2,null,0,3,5,6,5,4,2,null], bass:[0,5,0,4], drums:'drive', gain:.33 },
    'code-escape-coop':       { bpm:98, root:55, scale:'minor', lead:'bell', melody:[0,null,2,null,3,5,null,4,2,null,1,3,null,2,0,null], bass:[0,3,5,4], drums:'suspense', gain:.29 },
    'code-dama':              { bpm:106, root:50, scale:'dorian', lead:'pluck', melody:[0,null,2,3,null,4,3,2,0,null,3,5,4,3,2,null], bass:[0,3,4,3], drums:'soft', gain:.27 },
    'code-climb':             { bpm:112, root:55, scale:'majorPent', lead:'pluck', melody:[0,2,4,3,5,4,2,null,1,3,5,4,3,2,0,null], bass:[0,3,4,3], drums:'groove', gain:.27 },
    'code-uno':               { bpm:118, root:57, scale:'majorPent', lead:'pluck', melody:[0,2,4,null,3,5,4,2,1,3,5,null,4,2,1,null], bass:[0,3,4,3], drums:'groove', gain:.27 },
    'pinoy-feud':             { bpm:122, root:55, scale:'majorPent', lead:'pluck', melody:[0,null,2,4,3,null,5,4,2,null,4,5,4,2,1,null], bass:[0,3,4,3], drums:'groove', gain:.29 },
    'code-impostor':          { bpm:96, root:50, scale:'minorPent', lead:'bell', melody:[0,null,3,null,2,4,null,1,0,null,5,4,null,2,1,null], bass:[0,0,3,2], drums:'suspense', gain:.25 },
    'byte-strike':            { bpm:136, root:41, scale:'minor', lead:'saw', melody:[0,null,2,3,5,3,2,null,0,3,5,6,5,3,2,null], bass:[0,0,5,3,0,5,3,4], drums:'drive', gain:.31 },
    'pattern-lock':           { bpm:102, root:60, scale:'minorPent', lead:'bell',   melody:[0,null,2,null,4,null,3,null,1,null,3,null,5,4,2,null], bass:[0,3,4,3], drums:'soft',   gain:.27 }
  });

  const MINI_GAME_SCALES = Object.freeze({
    major:     [0,2,4,5,7,9,11],
    minor:     [0,2,3,5,7,8,10],
    dorian:    [0,2,3,5,7,9,10],
    majorPent: [0,2,4,7,9],
    minorPent: [0,3,5,7,10]
  });

  function miniGameHash(value = '') {
    let hash = 2166136261 >>> 0;
    for (const char of String(value)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }

  function fallbackSoundtrackProfile(gameId = '') {
    const h = miniGameHash(gameId || 'mini-game');
    const scales = ['minorPent', 'majorPent', 'minor', 'dorian'];
    const roots = [48, 50, 52, 53, 55, 57, 60];
    const lead = ['pluck', 'pulse', 'bell'][h % 3];
    const drums = ['groove', 'drive', 'soft', 'dance'][(h >>> 3) % 4];
    const melody = Array.from({ length: 16 }, (_, i) => {
      if ((h + i * 13) % 5 === 0) return null;
      return ((h >>> (i % 16)) + i * 3) % 6;
    });
    return {
      bpm: 104 + (h % 45),
      root: roots[(h >>> 6) % roots.length],
      scale: scales[(h >>> 10) % scales.length],
      lead,
      melody,
      bass: [0, 3, 4, 3],
      drums,
      gain: .28
    };
  }

  function midiToHz(midi) {
    return 440 * Math.pow(2, (Number(midi || 69) - 69) / 12);
  }

  function degreeToMidi(root, degree, scaleName) {
    const scale = MINI_GAME_SCALES[scaleName] || MINI_GAME_SCALES.minorPent;
    const d = Math.trunc(Number(degree || 0));
    const size = scale.length;
    const octave = Math.floor(d / size);
    const index = ((d % size) + size) % size;
    return Number(root || 57) + scale[index] + octave * 12;
  }

  function buildMiniGameLoopBuffer(ctx, gameId, profile) {
    const sampleRate = Math.min(22050, Math.max(16000, Math.floor(ctx.sampleRate / 2)));
    const bpm = Math.max(72, Math.min(170, Number(profile.bpm || 120)));
    const beatsPerBar = 4;
    const bars = 4;
    const stepsPerBeat = 4;
    const totalSteps = bars * beatsPerBar * stepsPerBeat;
    const beatSeconds = 60 / bpm;
    const stepSeconds = beatSeconds / stepsPerBeat;
    const duration = bars * beatsPerBar * beatSeconds;
    const length = Math.max(1, Math.floor(duration * sampleRate));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const seedBase = miniGameHash(gameId);
    let noiseSeed = seedBase || 1;

    const rand = () => {
      noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
      return (noiseSeed / 4294967296) * 2 - 1;
    };

    const addTone = (startSec, freq, durSec, amp, kind = 'pluck') => {
      const start = Math.max(0, Math.floor(startSec * sampleRate));
      const frames = Math.min(length - start, Math.max(1, Math.floor(durSec * sampleRate)));
      const attack = Math.max(1, Math.floor(Math.min(.012, durSec * .14) * sampleRate));
      const decayRate = kind === 'bell' ? 4.4 : kind === 'saw' ? 6.2 : kind === 'pulse' ? 7.4 : 8.8;
      for (let i = 0; i < frames; i++) {
        const t = i / sampleRate;
        const phase = Math.PI * 2 * freq * t;
        let wave;
        if (kind === 'bell') {
          wave = Math.sin(phase) * .74 + Math.sin(phase * 2.01) * .18 + Math.sin(phase * 3.99) * .08;
        } else if (kind === 'saw') {
          const x = (freq * t) % 1;
          wave = (2 * x - 1) * .62 + Math.sin(phase) * .38;
        } else if (kind === 'pulse') {
          wave = (Math.sin(phase) >= .28 ? 1 : -1) * .48 + Math.sin(phase) * .52;
        } else {
          const tri = (2 / Math.PI) * Math.asin(Math.sin(phase));
          wave = tri * .72 + Math.sin(phase * 2) * .20 + Math.sin(phase * 3) * .08;
        }
        const env = Math.min(1, i / attack) * Math.exp(-decayRate * t / Math.max(.12, durSec));
        data[start + i] += wave * env * amp;
      }
    };

    const addKick = (startSec, amp = .18) => {
      const start = Math.floor(startSec * sampleRate);
      const frames = Math.min(length - start, Math.floor(.18 * sampleRate));
      for (let i = 0; i < frames; i++) {
        const t = i / sampleRate;
        const f = 96 * Math.exp(-10 * t) + 42;
        const env = Math.exp(-18 * t);
        data[start + i] += Math.sin(Math.PI * 2 * f * t) * env * amp;
      }
    };

    const addSnare = (startSec, amp = .10) => {
      const start = Math.floor(startSec * sampleRate);
      const frames = Math.min(length - start, Math.floor(.11 * sampleRate));
      for (let i = 0; i < frames; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-24 * t);
        const body = Math.sin(Math.PI * 2 * 180 * t) * .32;
        data[start + i] += (rand() * .68 + body) * env * amp;
      }
    };

    const addHat = (startSec, amp = .035) => {
      const start = Math.floor(startSec * sampleRate);
      const frames = Math.min(length - start, Math.floor(.035 * sampleRate));
      for (let i = 0; i < frames; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-55 * t);
        const bright = rand() - rand() * .55;
        data[start + i] += bright * env * amp;
      }
    };

    const drumStyle = String(profile.drums || 'groove');
    for (let step = 0; step < totalSteps; step++) {
      const t = step * stepSeconds;
      const beatIndex = Math.floor(step / stepsPerBeat);
      const onBeat = step % stepsPerBeat === 0;
      const eighth = step % 2 === 0;

      if (onBeat) {
        const beatInBar = beatIndex % 4;
        const kick = drumStyle === 'soft' ? (beatInBar === 0 || beatInBar === 2)
          : drumStyle === 'suspense' ? (beatInBar === 0)
          : drumStyle === 'pulse' ? (beatInBar === 0 || beatInBar === 2)
          : true;
        if (kick) addKick(t, drumStyle === 'drive' ? .21 : drumStyle === 'punch' ? .22 : .16);
        if (beatInBar === 1 || beatInBar === 3) addSnare(t, drumStyle === 'soft' ? .065 : .105);
      }

      if (drumStyle === 'drive' || drumStyle === 'dance') {
        if (eighth) addHat(t, .035);
      } else if (drumStyle === 'groove' || drumStyle === 'punch') {
        if (step % 4 === 2) addHat(t, .032);
      } else if (drumStyle === 'pulse') {
        if (step % 8 === 6) addHat(t, .025);
      } else if (drumStyle === 'soft') {
        if (step % 8 === 4) addHat(t, .018);
      } else if (drumStyle === 'suspense') {
        if (step % 8 === 6) addHat(t, .016);
      }
    }

    const bass = Array.isArray(profile.bass) && profile.bass.length ? profile.bass : [0,3,4,3];
    for (let beat = 0; beat < bars * beatsPerBar; beat++) {
      const degree = bass[beat % bass.length];
      if (degree == null) continue;
      const freq = midiToHz(degreeToMidi(Number(profile.root || 57) - 12, degree, profile.scale));
      addTone(beat * beatSeconds, freq, Math.min(.44, beatSeconds * .72), drumStyle === 'soft' ? .07 : .095, 'pulse');
    }

    const melody = Array.isArray(profile.melody) && profile.melody.length ? profile.melody : [0,null,2,null,3,null,4,null,3,null,2,null,4,null,5,null];
    for (let step = 0; step < totalSteps; step++) {
      let degree = melody[step % melody.length];
      if (degree == null) continue;
      // Small bar-4 lift keeps a four-bar loop from sounding like one repeated bar.
      const bar = Math.floor(step / 16);
      if (bar === 3 && step % 4 === 0) degree += 1;
      const freq = midiToHz(degreeToMidi(profile.root, degree, profile.scale));
      const leadKind = profile.lead || 'pluck';
      const dur = leadKind === 'bell' ? Math.min(.34, stepSeconds * 1.9) : Math.min(.24, stepSeconds * 1.45);
      addTone(step * stepSeconds, freq, dur, leadKind === 'saw' ? .055 : .062, leadKind);
    }

    // A very light chord bed makes puzzle/quiz tracks feel musical without
    // consuming extra real-time nodes during gameplay.
    if (drumStyle === 'soft' || drumStyle === 'suspense') {
      for (let bar = 0; bar < bars; bar++) {
        const degree = [0, 3, 4, 3][bar % 4];
        const start = bar * 4 * beatSeconds;
        [degree, degree + 2, degree + 4].forEach((d, i) => {
          addTone(start, midiToHz(degreeToMidi(profile.root - 12, d, profile.scale)), Math.min(1.25, beatSeconds * 2.8), .018 - i * .002, 'bell');
        });
      }
    }

    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    const scale = peak > .88 ? .88 / peak : 1;
    const edge = Math.min(160, Math.floor(data.length / 4));
    for (let i = 0; i < data.length; i++) {
      let edgeGain = 1;
      if (i < edge) edgeGain *= i / Math.max(1, edge);
      if (i > data.length - edge) edgeGain *= (data.length - i) / Math.max(1, edge);
      const x = data[i] * scale * edgeGain;
      data[i] = Math.tanh(x * 1.15) / 1.15;
    }
    return buffer;
  }

  // Global Mini-Game mix: +50% BGM over Audio v2 for Solo XP and 2P games.
  // Profiles keep their relative balance; input ducking still preserves SFX clarity.
  const MINI_GAME_BGM_GAIN_BOOST = 2.13;

  const MINI_GAME_SOUNDTRACK = (() => {
    let ctx = null;
    let master = null;
    let compressor = null;
    let source = null;
    let activeGameId = '';
    let activeProfile = null;
    let currentBuffer = null;
    let startedAt = 0;
    let offset = 0;
    let enabled = true;
    let paused = false;
    let duckTimer = 0;

    function ensureAudio() {
      try {
        if (!ctx) {
          const AudioCtor = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtor) return null;
          ctx = new AudioCtor({ latencyHint: 'interactive' });
          compressor = ctx.createDynamicsCompressor();
          compressor.threshold.value = -18;
          compressor.knee.value = 16;
          compressor.ratio.value = 3;
          compressor.attack.value = .004;
          compressor.release.value = .16;
          master = ctx.createGain();
          master.gain.value = 0;
          master.connect(compressor);
          compressor.connect(ctx.destination);
        }
        return ctx;
      } catch (_) {
        return null;
      }
    }

    function targetGain() {
      if (!enabled || paused || !activeGameId || !activeProfile) return 0;
      const profileGain = Number(activeProfile.gain || .28);
      // Louder master mix for mobile speakers without allowing the BGM to
      // saturate the output bus. SFX still gets temporary headroom via duck().
      return Math.max(.36, Math.min(.75, profileGain * MINI_GAME_BGM_GAIN_BOOST));
    }

    function rampGain(value, seconds = .06) {
      if (!master || !ctx) return;
      try {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(Math.max(0, Number(value || 0)), now, Math.max(.012, Number(seconds || .06)));
      } catch (_) {}
    }

    function stopSource() {
      if (!source) return;
      try { source.stop(); } catch (_) {}
      try { source.disconnect(); } catch (_) {}
      source = null;
    }

    function playFromOffset(nextOffset = 0) {
      if (!ctx || !currentBuffer || !enabled || paused || !activeGameId) return false;
      stopSource();
      try {
        source = ctx.createBufferSource();
        source.buffer = currentBuffer;
        source.loop = true;
        source.connect(master);
        const duration = Math.max(.001, currentBuffer.duration || 1);
        offset = ((Number(nextOffset || 0) % duration) + duration) % duration;
        source.start(0, offset);
        startedAt = ctx.currentTime;
        rampGain(targetGain(), .045);
        return true;
      } catch (_) {
        source = null;
        return false;
      }
    }

    function unlock() {
      const audio = ensureAudio();
      if (!audio) return false;
      try { audio.resume?.().catch?.(() => {}); } catch (_) {}
      return true;
    }

    function start(gameId, options = {}) {
      const id = String(gameId || '').trim();
      if (!id) return false;
      enabled = options.enabled !== false;
      activeGameId = id;
      activeProfile = MINI_GAME_SOUNDTRACK_PROFILES[id] || fallbackSoundtrackProfile(id);
      offset = 0;
      paused = false;
      const audio = ensureAudio();
      if (!audio) return false;
      try { audio.resume?.().catch?.(() => {}); } catch (_) {}
      try { currentBuffer = buildMiniGameLoopBuffer(audio, id, activeProfile); } catch (_) { currentBuffer = null; }
      if (!currentBuffer || !enabled) {
        rampGain(0, .02);
        return Boolean(currentBuffer);
      }
      return playFromOffset(0);
    }

    function stop() {
      rampGain(0, .025);
      stopSource();
      activeGameId = '';
      activeProfile = null;
      currentBuffer = null;
      offset = 0;
      startedAt = 0;
      paused = false;
      if (duckTimer) clearTimeout(duckTimer);
      duckTimer = 0;
    }

    function pause() {
      if (paused || !activeGameId) return false;
      paused = true;
      if (ctx && currentBuffer && source) {
        const elapsed = Math.max(0, ctx.currentTime - startedAt);
        offset = (offset + elapsed) % Math.max(.001, currentBuffer.duration || 1);
      }
      rampGain(0, .02);
      stopSource();
      return true;
    }

    function resume() {
      if (!paused || !activeGameId) return false;
      paused = false;
      if (!enabled) return false;
      const audio = ensureAudio();
      if (!audio) return false;
      try { audio.resume?.().catch?.(() => {}); } catch (_) {}
      return playFromOffset(offset);
    }

    function setEnabled(next) {
      enabled = Boolean(next);
      if (!enabled) {
        rampGain(0, .025);
        stopSource();
        return;
      }
      if (!activeGameId || paused) return;
      const audio = ensureAudio();
      if (!audio) return;
      try { audio.resume?.().catch?.(() => {}); } catch (_) {}
      if (!currentBuffer) {
        try { currentBuffer = buildMiniGameLoopBuffer(audio, activeGameId, activeProfile || fallbackSoundtrackProfile(activeGameId)); } catch (_) {}
      }
      if (currentBuffer && !source) playFromOffset(offset);
      else rampGain(targetGain(), .04);
    }

    function duck(amount = .56, holdMs = 145) {
      if (!enabled || paused || !activeGameId || !master || !ctx) return;
      if (duckTimer) clearTimeout(duckTimer);
      rampGain(targetGain() * Math.max(.22, Math.min(.85, Number(amount || .56))), .012);
      duckTimer = window.setTimeout(() => {
        duckTimer = 0;
        rampGain(targetGain(), .045);
      }, Math.max(70, Number(holdMs || 145)));
    }

    function isActive() { return Boolean(activeGameId); }
    function getActiveGameId() { return activeGameId; }

    return Object.freeze({ unlock, start, stop, pause, resume, setEnabled, duck, isActive, getActiveGameId });
  })();

  // Public hook for current and future game modules. Future games can call
  // pause()/resume()/duck() during their own pause panels or important SFX.
  try { window.ICT8MiniGameSoundtrack = MINI_GAME_SOUNDTRACK; } catch (_) {}

  window.addEventListener('ict8:xp-mini-games-progress', event => {
    const soundEnabled = event?.detail?.soundEnabled;
    if (typeof soundEnabled === 'boolean') MINI_GAME_SOUNDTRACK.setEnabled(soundEnabled);
  });

  // Brief BGM ducking on actions leaves headroom for each game's own SFX.
  // These listeners do not synthesize extra SFX, so they stay very cheap.
  window.addEventListener('pointerdown', () => {
    if (MINI_GAME_SOUNDTRACK.isActive()) MINI_GAME_SOUNDTRACK.duck(.48, 155);
  }, { capture: true, passive: true });
  window.addEventListener('keydown', event => {
    if (!event.repeat && MINI_GAME_SOUNDTRACK.isActive()) MINI_GAME_SOUNDTRACK.duck(.54, 135);
  }, { capture: true });

  document.addEventListener('visibilitychange', () => {
    if (!MINI_GAME_SOUNDTRACK.isActive()) return;
    if (document.hidden) MINI_GAME_SOUNDTRACK.pause();
    else if (state?.gameOpen && !state.exitGuardPauseRequested && !state.exitGuardWasAlreadyPaused) MINI_GAME_SOUNDTRACK.resume();
  });


  const state = {
    built: false,
    open: false,
    gameOpen: false,
    overlay: null,
    modal: null,
    closeBtn: null,
    dailyValue: null,
    dailyBar: null,
    dailyFoot: null,
    limitMessage: null,
    loginMessage: null,
    gameList: null,
    twoPlayerList: null,
    tabs: [],
    panels: [],
    activeTab: 'games',
    weeklyRefreshBtn: null,
    weeklyWeekLabel: null,
    weeklyResetLabel: null,
    weeklyStatus: null,
    weeklyList: null,
    weeklyYou: null,
    weeklyLoadedAt: 0,
    weeklyLoading: false,
    weeklyData: null,
    launcher: null,
    bridge: null,
    unsubscribe: null,
    previousFocus: null,
    activeGameId: '',
    activeGameApi: null,
    loadingGameId: '',
    assetPromises: new Map(),
    exitGuardWasAlreadyPaused: false,
    exitGuardPauseRequested: false,
    gameAudioFocus: false
  };

  function getBridge() {
    return window.ICT8_XP_MINIGAMES_BRIDGE || null;
  }

  function gameById(id) {
    return GAME_REGISTRY.find(game => game.id === id) || null;
  }

  function escapeHTML(value = '') {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function weeklyRankLabel(rank = 0) {
    const safe = Math.max(0, Math.floor(Number(rank || 0)));
    if (safe === 1) return '🥇';
    if (safe === 2) return '🥈';
    if (safe === 3) return '🥉';
    return safe > 0 ? `#${safe}` : '—';
  }

  function build() {
    if (state.built) return;
    const overlay = document.createElement('div');
    overlay.id = 'xpMiniGamesOverlay';
    overlay.className = 'xp-games-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'xpMiniGamesTitle');
    overlay.innerHTML = `
      <section class="xp-games-modal">
        <header class="xp-games-modal-head">
          <div class="xp-games-modal-titleline">
            <span class="xp-games-modal-icon" aria-hidden="true">🎮</span>
            <div>
              <small>ICT 8 Connect</small>
              <h2 id="xpMiniGamesTitle">MINI-GAMES</h2>
            </div>
          </div>
          <button class="xp-games-close" type="button" data-xp-games-close aria-label="Close XP Mini-Games">×</button>
        </header>

        <nav class="xp-games-tabs" role="tablist" aria-label="Mini-Games views">
          <button class="xp-games-tab active" type="button" role="tab" aria-selected="true" data-xp-games-tab="games">🎮 SOLO XP</button>
          <button class="xp-games-tab" type="button" role="tab" aria-selected="false" data-xp-games-tab="multiplayer">👥 MULTI / NO XP</button>
          <button class="xp-games-tab" type="button" role="tab" aria-selected="false" data-xp-games-tab="weekly">🏆 WEEKLY</button>
        </nav>

        <div class="xp-games-panels">
          <section class="xp-games-panel xp-games-panel-games" role="tabpanel" data-xp-games-panel="games">
            <section class="xp-games-summary">
              <h3>WANT SOME EXTRA XP?</h3>
              <p>Play mini-games, beat your records, and earn a little bonus XP. Pick a game below.</p>
              <div class="xp-games-daily">
                <div class="xp-games-daily-head">
                  <span>TODAY'S GAME XP</span>
                  <strong data-xp-games-daily-value>0 / 50 XP</strong>
                </div>
                <div class="xp-games-daily-track" aria-hidden="true"><i data-xp-games-daily-bar></i></div>
                <div class="xp-games-daily-foot">
                  <span data-xp-games-daily-foot>Small bonus only — learning XP still matters most.</span>
                  <b data-xp-games-cap-label>50 XP/day</b>
                </div>
              </div>
            </section>

            <section class="xp-games-game-list" aria-label="Available mini-games">
              <div class="xp-games-limit-message" data-xp-games-limit>
                DAILY XP LIMIT REACHED — you can still play every mini-game and beat your records, but no more bonus XP can be earned today.
              </div>
              <div class="xp-games-login-message" data-xp-games-login>
                Log in as a student to earn account XP. Mini-games remain playable in practice mode.
              </div>
              <div data-xp-games-cards></div>
            </section>
          </section>

          <section class="xp-games-panel xp-games-panel-multiplayer" role="tabpanel" data-xp-games-panel="multiplayer" hidden>
            <section class="xp-games-2p-summary">
              <div>
                <small>👥 PLAY WITH A FRIEND</small>
                <h3>MULTIPLAYER · NO XP</h3>
                <p>Play live multiplayer with Student ID, QR/Share, or supported room codes. Some games also include Solo mode. These games are separate from Solo XP and Weekly Arcade.</p>
              </div>
              <span class="xp-games-2p-zero">0 XP</span>
            </section>
            <section class="xp-games-game-list xp-games-2p-list" aria-label="Two-player no-XP games">
              <div data-xp-games-2p-cards></div>
            </section>
          </section>

          <section class="xp-games-panel xp-games-panel-weekly" role="tabpanel" data-xp-games-panel="weekly" hidden>
            <div class="xp-games-weekly-head">
              <div>
                <small>🏆 WEEKLY ARCADE</small>
                <h3 data-xp-games-week-label>This Week</h3>
                <p data-xp-games-week-reset>Resets Monday · Manila time</p>
              </div>
              <button class="xp-games-weekly-refresh" type="button" data-xp-games-weekly-refresh aria-label="Refresh weekly leaderboard">↻ Refresh</button>
            </div>
            <div class="xp-games-weekly-rule">
              <span><b>50 XP/day</b> shared across all games</span>
              <span><b>350 XP</b> theoretical weekly max</span>
              <small>Ranking uses only Mini-Game XP actually awarded this week — never raw game score.</small>
            </div>
            <div class="xp-games-weekly-scroll">
              <div class="xp-games-weekly-status" data-xp-games-weekly-status>Open this tab to load the leaderboard.</div>
              <div class="xp-games-weekly-list" data-xp-games-weekly-list></div>
            </div>
            <div class="xp-games-weekly-you" data-xp-games-weekly-you hidden></div>
          </section>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    state.overlay = overlay;
    state.modal = overlay.querySelector('.xp-games-modal');
    state.closeBtn = overlay.querySelector('[data-xp-games-close]');
    state.dailyValue = overlay.querySelector('[data-xp-games-daily-value]');
    state.dailyBar = overlay.querySelector('[data-xp-games-daily-bar]');
    state.dailyFoot = overlay.querySelector('[data-xp-games-daily-foot]');
    state.limitMessage = overlay.querySelector('[data-xp-games-limit]');
    state.loginMessage = overlay.querySelector('[data-xp-games-login]');
    state.gameList = overlay.querySelector('[data-xp-games-cards]');
    state.twoPlayerList = overlay.querySelector('[data-xp-games-2p-cards]');
    state.tabs = Array.from(overlay.querySelectorAll('[data-xp-games-tab]'));
    state.panels = Array.from(overlay.querySelectorAll('[data-xp-games-panel]'));
    state.weeklyRefreshBtn = overlay.querySelector('[data-xp-games-weekly-refresh]');
    state.weeklyWeekLabel = overlay.querySelector('[data-xp-games-week-label]');
    state.weeklyResetLabel = overlay.querySelector('[data-xp-games-week-reset]');
    state.weeklyStatus = overlay.querySelector('[data-xp-games-weekly-status]');
    state.weeklyList = overlay.querySelector('[data-xp-games-weekly-list]');
    state.weeklyYou = overlay.querySelector('[data-xp-games-weekly-you]');

    state.closeBtn.addEventListener('click', closeHub);
    state.tabs.forEach(button => button.addEventListener('click', () => switchTab(button.dataset.xpGamesTab || 'games')));
    state.weeklyRefreshBtn?.addEventListener('click', () => loadWeeklyLeaderboard({ force: true }));
    state.gameList.addEventListener('click', event => {
      const button = event.target.closest('[data-xp-game-play]');
      if (!button || button.disabled) return;
      const gameId = String(button.dataset.xpGamePlay || '');
      launchGame(gameId, button);
    });
    state.twoPlayerList?.addEventListener('click', event => {
      const button = event.target.closest('[data-xp-game-play]');
      if (!button || button.disabled) return;
      const gameId = String(button.dataset.xpGamePlay || '');
      launchGame(gameId, button);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Tab' && state.open && !state.gameOpen && state.modal) {
        const focusable = Array.from(state.modal.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'))
          .filter(node => !node.hidden && node.getClientRects().length);
        if (focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if (event.key !== 'Escape') return;
      if (state.gameOpen) {
        event.preventDefault();
        try { state.activeGameApi?.close?.(); } catch (_) {}
        showHubAfterGame();
        return;
      }
      if (state.open) {
        event.preventDefault();
        closeHub();
      }
    });

    state.built = true;
  }

  function renderWeeklyLeaderboard(data = null) {
    if (!state.weeklyStatus || !state.weeklyList || !state.weeklyYou) return;
    const info = data || state.weeklyData || {};
    if (state.weeklyWeekLabel) state.weeklyWeekLabel.textContent = info.weekLabel || 'This Week';
    if (state.weeklyResetLabel) state.weeklyResetLabel.textContent = info.resetLabel || 'Resets Monday · Manila time';

    if (state.weeklyLoading) {
      state.weeklyStatus.hidden = false;
      state.weeklyStatus.className = 'xp-games-weekly-status loading';
      state.weeklyStatus.textContent = 'Loading Weekly Arcade standings…';
      state.weeklyList.innerHTML = '';
      state.weeklyYou.hidden = true;
      return;
    }

    if (!info.loggedIn) {
      state.weeklyStatus.hidden = false;
      state.weeklyStatus.className = 'xp-games-weekly-status warning';
      state.weeklyStatus.textContent = info.error || 'Log in as a student to view the Weekly Arcade leaderboard.';
      state.weeklyList.innerHTML = '';
      state.weeklyYou.hidden = true;
      return;
    }

    if (!info.ok) {
      state.weeklyStatus.hidden = false;
      state.weeklyStatus.className = 'xp-games-weekly-status error';
      state.weeklyStatus.textContent = info.error || 'Weekly standings could not be loaded. Refresh and try again.';
      state.weeklyList.innerHTML = '';
      state.weeklyYou.hidden = true;
      return;
    }

    const entries = Array.isArray(info.entries) ? info.entries : [];
    if (!entries.length) {
      state.weeklyStatus.hidden = false;
      state.weeklyStatus.className = 'xp-games-weekly-status empty';
      state.weeklyStatus.textContent = 'No ranked players yet this week. Earn Mini-Game XP to become the first!';
      state.weeklyList.innerHTML = '';
    } else {
      state.weeklyStatus.hidden = true;
      state.weeklyList.innerHTML = entries.map(entry => {
        const rank = Math.max(0, Number(entry.rank || 0));
        const isYou = Boolean(info.yourEntry?.uid && entry.uid === info.yourEntry.uid);
        const section = entry.section ? `<small>${escapeHTML(entry.section)}</small>` : '<small>ICT 8 Connect</small>';
        return `<article class="xp-games-weekly-row ${isYou ? 'is-you' : ''} ${rank <= 3 ? `top-${rank}` : ''}">
          <div class="xp-games-weekly-rank" aria-label="Rank ${rank}">${weeklyRankLabel(rank)}</div>
          <div class="xp-games-weekly-person"><strong>${escapeHTML(entry.name || 'Student')}${isYou ? ' <em>YOU</em>' : ''}</strong>${section}</div>
          <div class="xp-games-weekly-score"><strong>${Math.max(0, Number(entry.weeklyXp || 0))} XP</strong><small>${Math.max(0, Number(entry.rewardedSessions || 0))} rewarded run${Number(entry.rewardedSessions || 0) === 1 ? '' : 's'}</small></div>
        </article>`;
      }).join('');
    }

    const your = info.yourEntry || null;
    state.weeklyYou.hidden = false;
    state.weeklyYou.innerHTML = your
      ? `<span>YOUR WEEKLY RANK</span><strong>${info.yourRank ? weeklyRankLabel(info.yourRank) : 'Outside Top 10'} · ${Math.max(0, Number(your.weeklyXp || 0))} XP</strong><small>${info.partial ? 'Low-data view: Top 10 + your own record only.' : `${Math.max(0, Number(info.totalPlayers || 0))} ranked player${Number(info.totalPlayers || 0) === 1 ? '' : 's'} this week`}</small>`
      : `<span>YOUR WEEKLY RANK</span><strong>Not ranked yet</strong><small>Earn at least 1 Mini-Game XP this week to enter the leaderboard.</small>`;
  }

  async function loadWeeklyLeaderboard(options = {}) {
    if (!state.built || state.weeklyLoading) return state.weeklyData;
    state.bridge = getBridge();
    const loader = state.bridge?.loadWeeklyLeaderboard;
    if (typeof loader !== 'function') {
      state.weeklyData = { loggedIn: false, ok: false, error: 'Weekly Arcade is unavailable in this build.' };
      renderWeeklyLeaderboard(state.weeklyData);
      return state.weeklyData;
    }

    const currentWeek = state.bridge?.getWeekInfo?.() || null;
    const freshEnough = !options.force
      && state.weeklyData
      && (!currentWeek?.key || state.weeklyData.weekKey === currentWeek.key)
      && Date.now() - Number(state.weeklyLoadedAt || 0) < 5 * 60 * 1000;
    if (freshEnough) {
      renderWeeklyLeaderboard(state.weeklyData);
      return state.weeklyData;
    }

    state.weeklyLoading = true;
    if (state.weeklyRefreshBtn) state.weeklyRefreshBtn.disabled = true;
    renderWeeklyLeaderboard(state.weeklyData);
    try {
      state.weeklyData = await loader({ limit: 10 });
      state.weeklyLoadedAt = Date.now();
      return state.weeklyData;
    } catch (error) {
      state.weeklyData = {
        loggedIn: true,
        ok: false,
        weekLabel: currentWeek?.label || 'This Week',
        resetLabel: currentWeek?.resetLabel || 'Resets Monday · Manila time',
        error: String(error?.message || error || 'Could not load Weekly Arcade standings.')
      };
      return state.weeklyData;
    } finally {
      state.weeklyLoading = false;
      if (state.weeklyRefreshBtn) state.weeklyRefreshBtn.disabled = false;
      if (state.activeTab === 'weekly') renderWeeklyLeaderboard(state.weeklyData);
    }
  }

  function switchTab(tab = 'games', options = {}) {
    const next = tab === 'weekly' ? 'weekly' : (tab === 'multiplayer' ? 'multiplayer' : 'games');
    state.activeTab = next;
    state.tabs.forEach(button => {
      const selected = button.dataset.xpGamesTab === next;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    state.panels.forEach(panel => {
      panel.hidden = panel.dataset.xpGamesPanel !== next;
    });
    if (next === 'weekly') {
      const week = state.bridge?.getWeekInfo?.();
      if (week && state.weeklyWeekLabel) state.weeklyWeekLabel.textContent = week.label || 'This Week';
      if (week && state.weeklyResetLabel) state.weeklyResetLabel.textContent = week.resetLabel || 'Resets Monday · Manila time';
      if (options.load !== false) loadWeeklyLeaderboard({ force: Boolean(options.force) });
    }
  }

  function gameCardsHtml(snapshot) {
    const cap = Math.max(1, Number(snapshot?.dailyCap || 50));
    const records = snapshot?.gameRecords || {};
    return GAME_REGISTRY.filter(game => !game.multiplayer && !game.noXp).map(game => {
      const record = records[game.stateKey] || {};
      const gameType = game.category ? `${game.category}${game.difficulty ? ` · ${game.difficulty}` : ''} · ` : '';
      const xpCopy = snapshot?.capReached
        ? `${gameType}XP limit reached · play for records`
        : `${gameType}Up to +${game.maxXp} XP/run · ${cap} XP/day shared cap`;
      return `
        <article class="xp-games-card" data-xp-game-card="${game.id}">
          <div class="xp-games-card-art" aria-hidden="true">${game.icon}</div>
          <div class="xp-games-card-copy">
            <h4>${game.name}</h4>
            <p>${game.description}</p>
          </div>
          <div class="xp-games-card-meta">
            <span class="xp-games-best">${game.bestText(record)}</span>
            <span class="xp-games-xp-note">${xpCopy}</span>
          </div>
          <button class="xp-games-play" type="button" data-xp-game-play="${game.id}">PLAY</button>
        </article>`;
    }).join('');
  }

  function twoPlayerCardsHtml() {
    return GAME_REGISTRY.filter(game => game.multiplayer || game.noXp).map(game => {
      const type = game.category ? `${game.category}${game.difficulty ? ` · ${game.difficulty}` : ''}` : 'LIVE MULTIPLAYER';
      return `
        <article class="xp-games-card xp-games-card-2p" data-xp-game-card="${game.id}">
          <div class="xp-games-card-art" aria-hidden="true">${game.icon}</div>
          <div class="xp-games-card-copy">
            <h4>${game.name}</h4>
            <p>${game.description}</p>
          </div>
          <div class="xp-games-card-meta">
            <span class="xp-games-best">${game.bestText({})}</span>
            <span class="xp-games-xp-note">${type} · NO XP</span>
          </div>
          <button class="xp-games-play xp-games-play-2p" type="button" data-xp-game-play="${game.id}">${game.playLabel || (game.coop ? 'PLAY CO-OP' : 'PLAY 1v1')}</button>
        </article>`;
    }).join('');
  }

  function render(snapshot = null) {
    if (!state.built) return;
    const next = snapshot || state.bridge?.getSnapshot?.() || {
      dailyCap: 50,
      todayXp: 0,
      capReached: false,
      loggedIn: false,
      gameRecords: {}
    };
    const cap = Math.max(1, Number(next.dailyCap || 50));
    const today = Math.max(0, Math.min(cap, Number(next.todayXp || 0)));
    const percent = Math.max(0, Math.min(100, today / cap * 100));
    state.dailyValue.textContent = `${today} / ${cap} XP`;
    state.dailyBar.style.width = `${percent}%`;
    state.dailyFoot.textContent = next.capReached
      ? 'Full for today — all games stay open for high scores.'
      : `${cap - today} bonus XP still available today.`;
    const capLabel = state.overlay.querySelector('[data-xp-games-cap-label]');
    if (capLabel) capLabel.textContent = `${cap} XP/day`;
    state.limitMessage.classList.toggle('show', Boolean(next.capReached));
    state.loginMessage.classList.toggle('show', !next.loggedIn);
    state.gameList.innerHTML = gameCardsHtml(next);
    if (state.twoPlayerList) state.twoPlayerList.innerHTML = twoPlayerCardsHtml();
  }

  function lockAppBehindHub() {
    document.body.classList.add('xp-games-modal-open');
  }

  function unlockAppBehindHub() {
    document.body.classList.remove('xp-games-modal-open');
  }

  function setMiniGameAudioFocus(active, gameId = '') {
    const next = Boolean(active);
    if (state.gameAudioFocus === next) return;
    state.gameAudioFocus = next;
    try {
      window.dispatchEvent(new CustomEvent('ict8:mini-game-audio-focus', {
        detail: { active: next, gameId: next ? String(gameId || state.activeGameId || '') : '' }
      }));
    } catch (_) {}
  }

  function openHub() {
    build();
    MINI_GAME_SOUNDTRACK.stop();
    setMiniGameAudioFocus(false);
    try { window.ICT8AppExitGuard?.arm?.(); } catch (_) {}
    state.bridge = getBridge();
    if (!state.bridge) {
      console.warn('XP Mini-Games bridge is unavailable. The rest of ICT 8 Connect remains active.');
      return;
    }
    state.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    state.open = true;
    state.gameOpen = false;
    state.activeGameId = '';
    state.activeGameApi = null;
    lockAppBehindHub();
    render();
    state.overlay.hidden = false;
    switchTab('games', { load: false });
    state.closeBtn.focus({ preventScroll: true });
  }

  function closeHub() {
    if (!state.open && !state.gameOpen) return;
    MINI_GAME_SOUNDTRACK.stop();
    setMiniGameAudioFocus(false);
    const api = state.activeGameApi;
    const closingGameId = state.activeGameId;
    try { if (closingGameId && !gameById(closingGameId)?.multiplayer) state.bridge?.cancelGame?.(closingGameId); } catch (_) {}
    state.gameOpen = false;
    state.open = false;
    state.activeGameId = '';
    state.activeGameApi = null;
    try {
      if (api?.isOpen?.()) api.close?.();
    } catch (_) {}
    if (state.overlay) state.overlay.hidden = true;
    unlockAppBehindHub();
    const focusTarget = state.previousFocus;
    state.previousFocus = null;
    if (focusTarget && document.contains(focusTarget)) {
      window.requestAnimationFrame(() => {
        try { focusTarget.focus({ preventScroll: true }); } catch (_) {}
      });
    }
  }

  function showHubAfterGame() {
    MINI_GAME_SOUNDTRACK.stop();
    setMiniGameAudioFocus(false);
    const closingGameId = state.activeGameId;
    const returnTab = gameById(closingGameId)?.multiplayer ? 'multiplayer' : 'games';
    try { if (closingGameId && !gameById(closingGameId)?.multiplayer) state.bridge?.cancelGame?.(closingGameId); } catch (_) {}
    state.open = true;
    state.gameOpen = false;
    state.activeGameId = '';
    state.activeGameApi = null;
    render();
    state.overlay.hidden = false;
    switchTab(returnTab, { load: false });
    window.requestAnimationFrame(() => {
      try { state.closeBtn.focus({ preventScroll: true }); } catch (_) {}
    });
  }

  function ensureStylesheet(game) {
    if (!game.style) return Promise.resolve();
    const selector = `link[data-xp-game-style="${game.id}"]`;
    let link = document.querySelector(selector);
    const expectedHref = `${game.style}?v=${ASSET_VERSION}`;
    const versionMatches = link && (link.dataset.xpAssetVersion === ASSET_VERSION || String(link.href || '').includes(`v=${ASSET_VERSION}`));
    if (link && !versionMatches) {
      try { link.remove(); } catch (_) {}
      link = null;
    }
    if (link?.dataset.xpStyleLoaded === '1' || link?.sheet) return Promise.resolve();

    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = expectedHref;
      link.dataset.xpGameStyle = game.id;
      link.dataset.xpAssetVersion = ASSET_VERSION;
      document.head.appendChild(link);
    }

    // The old loader started the game module immediately after appending the
    // stylesheet. On a first launch the module could open and measure its canvas
    // before CSS had applied, which is why CODE BRIDGE could look broken until
    // the user backed out and opened it a second time. Wait for CSS first.
    return new Promise(resolve => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        link.dataset.xpStyleLoaded = '1';
        resolve();
      };
      link.addEventListener('load', done, { once: true });
      link.addEventListener('error', done, { once: true });
      // A cached stylesheet can become ready between appendChild and listener
      // registration, so re-check it on the next paint before using the timeout.
      requestAnimationFrame(() => { if (link.sheet) done(); });
      window.setTimeout(done, 1800);
    });
  }

  function ensureDependencyScript(src) {
    if (!src) return Promise.resolve();
    const key = `dep:${src}`;
    if (state.assetPromises.has(key)) return state.assetPromises.get(key);
    let existing = Array.from(document.querySelectorAll('script[data-xp-game-dependency]'))
      .find(node => node.dataset.xpGameDependency === src) || null;
    const versionMatches = existing && (existing.dataset.xpAssetVersion === ASSET_VERSION || String(existing.src || '').includes(`v=${ASSET_VERSION}`));
    if (existing && !versionMatches) {
      try { existing.remove(); } catch (_) {}
      existing = null;
    }
    if (existing?.dataset.xpDependencyLoaded === '1') return Promise.resolve();
    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      const done = () => { script.dataset.xpDependencyLoaded = '1'; resolve(); };
      if (existing && existing.dataset.xpDependencyLoaded === '1') return done();
      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', () => reject(new Error(`Game dependency failed to load: ${src}`)), { once: true });
      if (!existing) {
        script.src = `${src}?v=${ASSET_VERSION}`;
        script.defer = true;
        script.dataset.xpGameDependency = src;
        script.dataset.xpAssetVersion = ASSET_VERSION;
        document.body.appendChild(script);
      }
    }).finally(() => state.assetPromises.delete(key));
    state.assetPromises.set(key, promise);
    return promise;
  }

  async function ensureGameDependencies(game) {
    const deps = Array.isArray(game.dependencies) ? game.dependencies : [];
    for (const src of deps) await ensureDependencyScript(src);
  }

  function ensureGameModule(game) {
    let current = window[game.globalName];
    if (current?.open) {
      if (game.id !== 'byte-hangman' || current.assetVersion === ASSET_VERSION) return Promise.resolve(current);
      // Byte Hangman is heavily iterated during this release cycle. If the SPA
      // already loaded an older copy, remove its old overlay/API before loading
      // the new version so the real app matches the standalone visual test.
      try { current.close?.(true); } catch (_) {}
      try { document.querySelectorAll('.bh-overlay').forEach(node => node.remove()); } catch (_) {}
      try { window[game.globalName] = null; } catch (_) {}
      current = null;
    }
    if (state.assetPromises.has(game.id)) return state.assetPromises.get(game.id);

    const promise = Promise.all([ensureStylesheet(game), ensureGameDependencies(game)]).then(() => new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-xp-game-script="${game.id}"]`);
      // If a previous attempt loaded a broken/stale module without registering
      // its API, remove that script so PLAY can retry cleanly instead of waiting
      // forever for a load event that already fired.
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.src = `${game.script}?v=${ASSET_VERSION}`;
      script.defer = true;
      script.dataset.xpGameScript = game.id;
      script.dataset.xpAssetVersion = ASSET_VERSION;
      script.addEventListener('load', () => {
        const api = window[game.globalName];
        if (api?.open) resolve(api);
        else reject(new Error(`${game.name} did not initialize.`));
      }, { once: true });
      script.addEventListener('error', () => reject(new Error(`${game.name} failed to load.`)), { once: true });
      document.body.appendChild(script);
    })).finally(() => state.assetPromises.delete(game.id));
    state.assetPromises.set(game.id, promise);
    return promise;
  }

  async function launchGame(gameId, button = null) {
    const game = gameById(gameId);
    if (!game || state.loadingGameId) return;
    // Unlock WebAudio directly inside the PLAY gesture before any async asset
    // loading. This keeps soundtrack startup reliable on iOS/Android browsers.
    MINI_GAME_SOUNDTRACK.unlock();
    state.loadingGameId = game.id;
    const originalButtonLabel = button?.textContent || 'PLAY';
    if (button) {
      button.disabled = true;
      button.textContent = 'LOADING…';
    }
    try {
      const api = await ensureGameModule(game);
      if (!api?.open) throw new Error(`${game.name} is unavailable.`);
      state.overlay.hidden = true;
      state.open = false;
      state.gameOpen = true;
      state.activeGameId = game.id;
      state.activeGameApi = api;
      // Audio focus changes before game.open() so the first game beat/SFX is
      // never masked by the Code Explorer background track.
      setMiniGameAudioFocus(true, game.id);
      const soundEnabled = state.bridge?.getSnapshot?.()?.soundEnabled !== false;
      MINI_GAME_SOUNDTRACK.start(game.id, { enabled: soundEnabled });
      api.open({
        bridge: state.bridge,
        music: MINI_GAME_SOUNDTRACK,
        onBack: showHubAfterGame,
        onClose: closeHub,
        onReward: result => {
          const amount = Math.max(0, Number(result?.awardedXp || 0));
          if (amount > 0) {
            state.weeklyData = null;
            state.weeklyLoadedAt = 0;
            animateXpAward(amount);
          }
          render();
        }
      });
    } catch (error) {
      MINI_GAME_SOUNDTRACK.stop();
      setMiniGameAudioFocus(false);
      console.warn(`${game.name} could not initialize.`, error);
      state.open = true;
      state.gameOpen = false;
      state.activeGameId = '';
      state.activeGameApi = null;
      state.overlay.hidden = false;
      render();
    } finally {
      state.loadingGameId = '';
      if (button && document.contains(button)) {
        button.disabled = false;
        button.textContent = originalButtonLabel;
      }
    }
  }


  function findVisibleResumeButton() {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(button => {
      if (button.hidden || button.disabled || button.getClientRects().length === 0) return false;
      return button.getAttributeNames().some(name => /^data-.*-resume$/i.test(name));
    }) || null;
  }

  function pauseActiveGameForExitGuard() {
    if (!state.gameOpen || !state.activeGameApi?.isOpen?.()) return false;
    MINI_GAME_SOUNDTRACK.pause();
    const api = state.activeGameApi;
    state.exitGuardWasAlreadyPaused = Boolean(findVisibleResumeButton());
    state.exitGuardPauseRequested = false;
    if (state.exitGuardWasAlreadyPaused) return false;

    try {
      if (typeof api.pauseForExitGuard === 'function') {
        state.exitGuardPauseRequested = api.pauseForExitGuard() !== false;
        return state.exitGuardPauseRequested;
      }
    } catch (_) {}

    try {
      window.dispatchEvent(new Event('blur'));
      state.exitGuardPauseRequested = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  function resumeActiveGameFromExitGuard() {
    if (!state.gameOpen || !state.activeGameApi?.isOpen?.()) return false;
    if (state.exitGuardWasAlreadyPaused || !state.exitGuardPauseRequested) {
      state.exitGuardWasAlreadyPaused = false;
      state.exitGuardPauseRequested = false;
      return false;
    }

    const api = state.activeGameApi;
    state.exitGuardPauseRequested = false;
    MINI_GAME_SOUNDTRACK.resume();
    try {
      if (typeof api.resumeFromExitGuard === 'function') {
        api.resumeFromExitGuard();
        state.exitGuardWasAlreadyPaused = false;
        return true;
      }
    } catch (_) {}

    try { window.dispatchEvent(new Event('focus')); } catch (_) {}
    window.setTimeout(() => {
      const resumeButton = findVisibleResumeButton();
      if (resumeButton) {
        try { resumeButton.click(); } catch (_) {}
      }
    }, 40);
    state.exitGuardWasAlreadyPaused = false;
    return true;
  }

  function isGameOpen() {
    return Boolean(state.gameOpen && state.activeGameApi?.isOpen?.());
  }

  function animateXpAward(amount) {
    const launcher = state.launcher || document.getElementById('codeExplorerXpBadge');
    if (!launcher || !amount) return;
    const rect = launcher.getBoundingClientRect();
    const floater = document.createElement('span');
    floater.className = 'xp-games-xp-float';
    floater.textContent = `⭐ +${amount} XP`;
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(floater);
    window.setTimeout(() => floater.remove(), 950);
  }

  function bindLauncher() {
    const launcher = document.getElementById('codeExplorerXpBadge');
    if (!launcher || launcher.dataset.xpMiniGamesBound === 'true') return false;
    launcher.dataset.xpMiniGamesBound = 'true';
    launcher.classList.add('xp-games-launcher');
    launcher.setAttribute('role', 'button');
    launcher.setAttribute('tabindex', '0');
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-controls', 'xpMiniGamesOverlay');
    launcher.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openHub();
    });
    launcher.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openHub();
    });
    state.launcher = launcher;
    return true;
  }

  function init() {
    build();
    state.bridge = getBridge();
    bindLauncher();
    if (state.bridge?.subscribe) {
      state.unsubscribe = state.bridge.subscribe(snapshot => {
        if (state.open) render(snapshot);
      });
    }

    if (!state.launcher) {
      const observer = new MutationObserver(() => {
        if (bindLauncher()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.setTimeout(() => observer.disconnect(), 10000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  window.ICT8XpMiniGames = Object.freeze({
    open: openHub,
    close: closeHub,
    render: () => render(),
    showWeekly: () => { openHub(); switchTab('weekly', { force: true }); },
    isOpen: () => state.open,
    isGameOpen,
    pauseActiveGameForExitGuard,
    resumeActiveGameFromExitGuard,
    games: GAME_REGISTRY.map(game => ({ id: game.id, name: game.name, mode: game.multiplayer ? '2p-no-xp' : 'solo-xp' }))
  });
})();
