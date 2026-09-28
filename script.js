(() => {
  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ROUND_DURATIONS = { '30': 30, '120': 120 }; // seconds, keyed by roundLength

  function roundDuration() {
    return ROUND_DURATIONS[state.roundLength] || 0;
  }

  const screens = {
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    results: document.getElementById('screen-results'),
  };

  const BACK_RANK_PIECE = {
    a: 'rook', b: 'knight', c: 'bishop', d: 'queen',
    e: 'king', f: 'bishop', g: 'knight', h: 'rook',
  };

  function pieceAt(square) {
    const file = square[0];
    const rank = parseInt(square.slice(1), 10);
    if (rank === 2 || rank === 7) return 'pawn';
    if (rank === 1 || rank === 8) return BACK_RANK_PIECE[file];
    return 'none';
  }

  function squareColor(square) {
    const fileIndex = FILES.indexOf(square[0]);
    const rank = parseInt(square.slice(1), 10);
    return (fileIndex + rank) % 2 === 1 ? 'black' : 'white';
  }

  function spokenSquare(square) {
    return `${square[0].toUpperCase()} ${square.slice(1)}`;
  }

  const PIECE_SPOKEN_NAME = {
    king: 'King', queen: 'Queen', rook: 'Rook', bishop: 'Bishop',
    knight: 'Knight', pawn: 'Pawn', none: 'None',
  };
  const COLOR_SPOKEN_NAME = { white: 'White', black: 'Black' };

  const ALL_SQUARES = FILES.flatMap(f => [1, 2, 3, 4, 5, 6, 7, 8].map(r => f + r));
  const ATTACK_PIECE_TYPES = ['bishop', 'knight', 'pawn'];

  // Attack pattern on an otherwise empty board - no blockers, no other pieces.
  function attackedSquares(piece, square, color) {
    const f = FILES.indexOf(square[0]);
    const r = parseInt(square.slice(1), 10);
    const results = [];
    const add = (nf, nr) => {
      if (nf >= 0 && nf <= 7 && nr >= 1 && nr <= 8) results.push(FILES[nf] + nr);
    };

    if (piece === 'knight') {
      [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
        .forEach(([df, dr]) => add(f + df, r + dr));
    } else if (piece === 'king') {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df !== 0 || dr !== 0) add(f + df, r + dr);
        }
      }
    } else if (piece === 'pawn') {
      const dir = color === 'white' ? 1 : -1;
      add(f - 1, r + dir);
      add(f + 1, r + dir);
    } else {
      const dirs = [];
      if (piece === 'rook' || piece === 'queen') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      if (piece === 'bishop' || piece === 'queen') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      dirs.forEach(([df, dr]) => {
        let nf = f + df, nr = r + dr;
        while (nf >= 0 && nf <= 7 && nr >= 1 && nr <= 8) {
          results.push(FILES[nf] + nr);
          nf += df;
          nr += dr;
        }
      });
    }
    return results;
  }

  // Generates a piece+square whose attacked-squares set is non-empty, so
  // there's always at least one correct answer to type.
  function generateAttackPrompt() {
    let piece, color, square, attacked;
    do {
      piece = ATTACK_PIECE_TYPES[Math.floor(Math.random() * ATTACK_PIECE_TYPES.length)];
      color = Math.random() < 0.5 ? 'white' : 'black';
      square = FILES[Math.floor(Math.random() * 8)] + (Math.floor(Math.random() * 8) + 1);
      attacked = attackedSquares(piece, square, color);
    } while (attacked.length < 1);

    return { piece, color, square, attacked };
  }

  function renderAttackPrompt(prompt) {
    attackPieceEl.textContent =
      `${COLOR_SPOKEN_NAME[prompt.color]} ${PIECE_SPOKEN_NAME[prompt.piece]} on ${prompt.square}`;
  }

  // Every typed square must genuinely be attacked, with at least one given.
  function validateAttackAnswer(prompt, squares) {
    if (squares.length === 0) return false;
    const seen = new Set();
    for (const sq of squares) {
      if (!ALL_SQUARES.includes(sq)) return false;
      if (seen.has(sq)) return false;
      if (!prompt.attacked.includes(sq)) return false;
      seen.add(sq);
    }
    return true;
  }

  // --- Move the Piece: type a path of legal moves from one square to another ---

  const MOVE_PIECE_TYPES = ['bishop', 'knight'];

  function isLegalPieceMove(piece, from, to) {
    if (from === to) return false;
    const df = FILES.indexOf(to[0]) - FILES.indexOf(from[0]);
    const dr = parseInt(to.slice(1), 10) - parseInt(from.slice(1), 10);
    if (piece === 'knight') {
      return (Math.abs(df) === 1 && Math.abs(dr) === 2) || (Math.abs(df) === 2 && Math.abs(dr) === 1);
    }
    if (piece === 'bishop') {
      return df !== 0 && Math.abs(df) === Math.abs(dr);
    }
    return false;
  }

  function generateMovePuzzle() {
    const piece = MOVE_PIECE_TYPES[Math.floor(Math.random() * MOVE_PIECE_TYPES.length)];
    const color = Math.random() < 0.5 ? 'white' : 'black';
    let start, end;
    do {
      start = FILES[Math.floor(Math.random() * 8)] + (Math.floor(Math.random() * 8) + 1);
      end = FILES[Math.floor(Math.random() * 8)] + (Math.floor(Math.random() * 8) + 1);
    } while (start === end || (piece === 'bishop' && squareColor(start) !== squareColor(end)));

    return { piece, color, start, end };
  }

  function renderMovePuzzle(move) {
    movePieceEl.textContent = `${COLOR_SPOKEN_NAME[move.color]} ${PIECE_SPOKEN_NAME[move.piece]}`;
    moveSquaresEl.textContent = `${move.start.toUpperCase()} → ${move.end.toUpperCase()}`;
  }

  // Validates the user's typed path: each step must be a legal move for the
  // piece, no square repeated, and it must land exactly on the target.
  function validateMovePath(piece, start, end, squares) {
    if (squares.length === 0) return false;
    let current = start;
    const seen = new Set([start]);
    for (const sq of squares) {
      if (!ALL_SQUARES.includes(sq)) return false;
      if (seen.has(sq)) return false;
      if (!isLegalPieceMove(piece, current, sq)) return false;
      seen.add(sq);
      current = sq;
    }
    return current === end;
  }

  // Shortest legal path from start to end, for feedback on a wrong answer.
  function findExamplePath(piece, start, end) {
    const prev = { [start]: null };
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      if (cur === end) break;
      for (const sq of ALL_SQUARES) {
        if (!(sq in prev) && isLegalPieceMove(piece, cur, sq)) {
          prev[sq] = cur;
          queue.push(sq);
        }
      }
    }
    if (!(end in prev)) return null;
    const path = [];
    for (let cur = end; cur !== null; cur = prev[cur]) path.unshift(cur);
    return path;
  }

  function speak(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      utter.onend = finish;
      utter.onerror = finish;
      setTimeout(() => window.speechSynthesis.speak(utter), 40);

      // Safety net: speech synthesis callbacks aren't 100% reliable across
      // browsers/OSes, so never let a round hang waiting on one indefinitely.
      setTimeout(finish, 4000);
    });
  }

  const modeSelect = document.getElementById('mode-select');
  const difficultySelect = document.getElementById('difficulty-select');
  const difficultyHeading = document.getElementById('difficulty-heading');
  const btnBackMode = document.getElementById('btn-back-mode');
  const cardExtreme = document.getElementById('card-extreme');
  const lengthToggle = document.getElementById('length-toggle');
  const povToggle = document.getElementById('pov-toggle');

  const MODE_LABELS = {
    locate: 'Locate the Square',
    piece: 'Name the Piece',
    color: 'Name the Color',
    attacks: 'Does It Attack?',
    move: 'Move the Piece',
  };

  const gameContent = document.getElementById('game-content');
  const boardStage = document.getElementById('board-stage');
  const boardWrapper = document.getElementById('board-wrapper');
  const centerOverlay = document.getElementById('center-overlay');
  const answerGrid = document.getElementById('answer-grid');
  const colorGrid = document.getElementById('color-grid');
  const attackPanel = document.getElementById('attack-panel');
  const attackPieceEl = document.getElementById('attack-piece');
  const attackInputEl = document.getElementById('attack-input');
  const attackSubmitBtn = document.getElementById('attack-submit');
  const attackFeedbackEl = document.getElementById('attack-feedback');
  const movePanel = document.getElementById('move-panel');
  const movePieceEl = document.getElementById('move-piece');
  const moveSquaresEl = document.getElementById('move-squares');
  const moveInputEl = document.getElementById('move-input');
  const moveSubmitBtn = document.getElementById('move-submit');
  const moveFeedbackEl = document.getElementById('move-feedback');
  const masterHint = document.getElementById('master-hint');
  const timerEl = document.getElementById('timer');
  const targetLabelEl = document.getElementById('target-label');
  const targetEl = document.getElementById('target-square');
  const btnQuit = document.getElementById('btn-quit');
  const btnAgain = document.getElementById('btn-again');
  const btnMenu = document.getElementById('btn-menu');
  const resultsHeadingEl = document.getElementById('results-heading');
  const resultCorrectEl = document.getElementById('result-correct');
  const resultIncorrectEl = document.getElementById('result-incorrect');
  const resultAccuracyEl = document.getElementById('result-accuracy');

  const state = {
    mode: 'locate', // 'locate' | 'piece' | 'color'
    selectedMode: null,
    difficulty: 'easy',
    roundLength: '30', // '30' | '120' | 'endless'
    pov: 'white', // 'white' | 'black' - board orientation
    target: null,
    attack: null, // { piece, color, square, attacked } - 'attacks' mode only
    move: null, // { piece, color, start, end } - 'move' mode only
    correct: 0,
    incorrect: 0,
    timeLeft: 30,
    timerId: null,
    countdownId: null,
    revealTimeoutId: null,
    moveFeedbackTimeoutId: null,
    attackFeedbackTimeoutId: null,
    active: false,
    speechToken: 0, // guards stale async speech callbacks in Master mode
  };

  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone({ freq, duration, type = 'sine', startTime = 0, gain = 0.2 }) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = gain;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    const t0 = ctx.currentTime + startTime;
    gainNode.gain.setValueAtTime(gain, t0);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  function playCorrectSound() {
    playTone({ freq: 880, duration: 0.12, type: 'sine' });
    playTone({ freq: 1318.5, duration: 0.18, startTime: 0.1, type: 'sine' });
  }

  function playIncorrectSound() {
    playTone({ freq: 180, duration: 0.28, type: 'sawtooth', gain: 0.15 });
  }

  function showScreen(name) {
    Object.values(screens).forEach(s => s.hidden = true);
    screens[name].hidden = false;
    document.body.classList.toggle('game-active', name === 'game');
  }

  function showMenuRoot() {
    modeSelect.hidden = false;
    difficultySelect.hidden = true;
    showScreen('menu');
  }

  function stopSpeech() {
    state.speechToken++;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function buildBoard() {
    boardWrapper.innerHTML = '';
    boardWrapper.className = 'board-wrapper';

    if (state.difficulty === 'easy') {
      boardWrapper.classList.add('show-colors', 'show-coords');
    } else if (state.difficulty === 'medium') {
      boardWrapper.classList.add('show-colors');
    } else if (state.difficulty === 'advanced') {
      boardWrapper.classList.add('grid-lines');
    } else if (state.difficulty === 'hard') {
      boardWrapper.classList.add('quadrants');
    }

    const flip = state.pov === 'black';

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (row === 8 && col === 0) {
          // empty corner
          const corner = document.createElement('div');
          boardWrapper.appendChild(corner);
          continue;
        }

        if (row === 8) {
          // file label row
          const label = document.createElement('div');
          label.className = 'label';
          label.textContent = FILES[flip ? 8 - col : col - 1];
          boardWrapper.appendChild(label);
          continue;
        }

        if (col === 0) {
          // rank label column
          const label = document.createElement('div');
          label.className = 'label';
          label.textContent = flip ? row + 1 : 8 - row;
          boardWrapper.appendChild(label);
          continue;
        }

        const fileIndex = flip ? 8 - col : col - 1;
        const rank = flip ? row + 1 : 8 - row;
        const square = document.createElement('div');
        const isDark = (fileIndex + rank) % 2 === 1;
        const classes = ['square', isDark ? 'dark' : 'light'];
        // Physical grid position (independent of POV) for the Advanced/Expert
        // divider lines, so they land in the same place regardless of flip.
        if (col === 8) classes.push('edge-col');
        if (row === 7) classes.push('edge-row');
        if (col === 4) classes.push('mid-col');
        if (row === 3) classes.push('mid-row');
        square.className = classes.join(' ');
        square.dataset.square = FILES[fileIndex] + rank;
        square.addEventListener('click', onSquareClick);
        boardWrapper.appendChild(square);
      }
    }
  }

  const PIECE_RANKS = [1, 8]; // only the back ranks - no pawns in this mode

  function randomTarget() {
    const ranks = state.mode === 'piece' ? PIECE_RANKS : null;
    let next;
    do {
      const file = FILES[Math.floor(Math.random() * 8)];
      const rank = ranks ? ranks[Math.floor(Math.random() * ranks.length)] : Math.floor(Math.random() * 8) + 1;
      next = file + rank;
    } while (next === state.target);
    return next;
  }

  function showOverlay(text) {
    centerOverlay.textContent = text;
    centerOverlay.hidden = false;
  }

  function hideOverlay() {
    centerOverlay.hidden = true;
  }

  function startRoundTimer() {
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      if (state.roundLength === 'endless') {
        state.timeLeft++;
        timerEl.textContent = state.timeLeft;
      } else {
        state.timeLeft--;
        timerEl.textContent = state.timeLeft;
        if (state.timeLeft <= 0) {
          endGame();
        }
      }
    }, 1000);
  }

  function runCountdown(onDone) {
    const steps = ['3', '2', '1'];
    let i = 0;
    showOverlay(steps[i]);
    clearInterval(state.countdownId);
    state.countdownId = setInterval(() => {
      i++;
      if (i < steps.length) {
        showOverlay(steps[i]);
      } else {
        clearInterval(state.countdownId);
        state.countdownId = null;
        hideOverlay();
        onDone();
      }
    }, 1000);
  }

  function nextTarget() {
    state.target = randomTarget();
    targetEl.textContent = '';
    showOverlay(state.target);

    clearTimeout(state.revealTimeoutId);
    state.revealTimeoutId = setTimeout(() => {
      hideOverlay();
      targetEl.textContent = state.target;
    }, 1000);
  }

  function nextAttackPrompt() {
    state.attack = generateAttackPrompt();
    renderAttackPrompt(state.attack);
    attackInputEl.value = '';
    attackFeedbackEl.textContent = '';
    attackInputEl.focus();
  }

  function submitAttackAnswer() {
    if (!state.active || state.mode !== 'attacks' || attackInputEl.disabled) return;

    const squares = attackInputEl.value
      .split(/[\s,]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const prompt = state.attack;
    const isCorrect = validateAttackAnswer(prompt, squares);

    attackInputEl.disabled = true;
    attackSubmitBtn.disabled = true;

    if (isCorrect) {
      state.correct++;
      playCorrectSound();
      attackInputEl.classList.add('flash-correct');
      attackFeedbackEl.textContent = 'Correct!';
    } else {
      state.incorrect++;
      playIncorrectSound();
      attackInputEl.classList.add('flash-incorrect');
      attackFeedbackEl.textContent = `Attacks: ${prompt.attacked.map(s => s.toUpperCase()).join(', ')}`;
    }

    clearTimeout(state.attackFeedbackTimeoutId);
    state.attackFeedbackTimeoutId = setTimeout(() => {
      attackInputEl.classList.remove('flash-correct', 'flash-incorrect');
      attackInputEl.disabled = false;
      attackSubmitBtn.disabled = false;
      if (state.mode === 'attacks' && state.active) nextAttackPrompt();
    }, 1600);
  }

  function nextMovePuzzle() {
    state.move = generateMovePuzzle();
    renderMovePuzzle(state.move);
    moveInputEl.value = '';
    moveFeedbackEl.textContent = '';
    moveInputEl.focus();
  }

  function submitMoveAnswer() {
    if (!state.active || state.mode !== 'move' || moveInputEl.disabled) return;

    const squares = moveInputEl.value
      .split(/[\s,]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const move = state.move;
    const isCorrect = validateMovePath(move.piece, move.start, move.end, squares);

    moveInputEl.disabled = true;
    moveSubmitBtn.disabled = true;

    if (isCorrect) {
      state.correct++;
      playCorrectSound();
      moveInputEl.classList.add('flash-correct');
      moveFeedbackEl.textContent = 'Correct!';
    } else {
      state.incorrect++;
      playIncorrectSound();
      moveInputEl.classList.add('flash-incorrect');
      const example = findExamplePath(move.piece, move.start, move.end);
      moveFeedbackEl.textContent = example
        ? `One way: ${example.slice(1).map(s => s.toUpperCase()).join(', ')}`
        : 'Incorrect.';
    }

    clearTimeout(state.moveFeedbackTimeoutId);
    state.moveFeedbackTimeoutId = setTimeout(() => {
      moveInputEl.classList.remove('flash-correct', 'flash-incorrect');
      moveInputEl.disabled = false;
      moveSubmitBtn.disabled = false;
      if (state.mode === 'move' && state.active) nextMovePuzzle();
    }, 1600);
  }

  function flashEl(el, className) {
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), 150);
  }

  function registerAnswer(isCorrect, el) {
    if (isCorrect) {
      state.correct++;
      playCorrectSound();
      flashEl(el, 'flash-correct');
    } else {
      state.incorrect++;
      playIncorrectSound();
      flashEl(el, 'flash-incorrect');
    }
    nextTarget();
  }

  // --- Master mode: app speaks the prompt, user answers by tapping a button ---

  async function runMasterCountdown(myToken) {
    const steps = ['Three', 'Two', 'One'];
    for (const s of steps) {
      if (myToken !== state.speechToken) return;
      await speak(s);
    }
  }

  function presentNextMasterTarget(mode, myToken) {
    if (myToken !== state.speechToken || !state.active) return;
    state.target = randomTarget();
    targetEl.textContent = state.target;

    const prompt = mode === 'piece'
      ? `What's on ${spokenSquare(state.target)}?`
      : `Color of ${spokenSquare(state.target)}?`;
    speak(prompt);
  }

  function registerMasterAnswer(mode, isCorrect) {
    const myToken = state.speechToken;
    const correctKey = mode === 'piece' ? pieceAt(state.target) : squareColor(state.target);
    const correctLabel = mode === 'piece' ? PIECE_SPOKEN_NAME[correctKey] : COLOR_SPOKEN_NAME[correctKey];

    if (isCorrect) {
      state.correct++;
      playCorrectSound();
    } else {
      state.incorrect++;
      playIncorrectSound();
    }

    const feedback = isCorrect ? 'Correct.' : `Incorrect, it's ${correctLabel}.`;
    speak(feedback).then(() => {
      if (myToken !== state.speechToken || !state.active) return;
      presentNextMasterTarget(mode, myToken);
    });
  }

  async function startMasterRound(mode) {
    const myToken = ++state.speechToken;

    state.mode = mode;
    state.difficulty = 'extreme';
    state.correct = 0;
    state.incorrect = 0;
    state.active = false;

    clearInterval(state.timerId);
    clearInterval(state.countdownId);
    clearTimeout(state.revealTimeoutId);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    getAudioCtx();

    screens.game.classList.remove('mode-color', 'mode-piece');
    screens.game.classList.add('mode-master');
    gameContent.classList.remove('stack');

    boardStage.hidden = true;
    answerGrid.hidden = mode !== 'piece';
    colorGrid.hidden = mode !== 'color';
    masterHint.hidden = false;

    targetLabelEl.textContent = mode === 'piece' ? "What's on:" : mode === 'color' ? 'Color of:' : '';
    targetEl.textContent = '';
    state.timeLeft = state.roundLength === 'endless' ? 0 : roundDuration();
    timerEl.textContent = state.timeLeft;

    showScreen('game');

    await runMasterCountdown(myToken);
    if (myToken !== state.speechToken) return;

    state.active = true;
    presentNextMasterTarget(mode, myToken);

    startRoundTimer();
  }

  // --- Click handlers (shared by all difficulties; Master branches to speech) ---

  function onSquareClick(e) {
    if (!state.active || state.mode !== 'locate') return;
    const square = e.currentTarget;
    registerAnswer(square.dataset.square === state.target, square);
  }

  function onAnswerClick(e) {
    if (!state.active) return;
    const btn = e.currentTarget;
    const isCorrect = btn.dataset.piece === pieceAt(state.target);
    if (state.difficulty === 'extreme') {
      flashEl(btn, isCorrect ? 'flash-correct' : 'flash-incorrect');
      registerMasterAnswer('piece', isCorrect);
    } else {
      registerAnswer(isCorrect, btn);
    }
  }

  function onColorClick(e) {
    if (!state.active) return;
    const btn = e.currentTarget;
    const isCorrect = btn.dataset.color === squareColor(state.target);
    if (state.difficulty === 'extreme') {
      flashEl(btn, isCorrect ? 'flash-correct' : 'flash-incorrect');
      registerMasterAnswer('color', isCorrect);
    } else {
      registerAnswer(isCorrect, btn);
    }
  }

  function startRound(mode, difficulty) {
    stopSpeech();

    if (difficulty === 'extreme') {
      startMasterRound(mode);
      return;
    }

    state.mode = mode;
    state.difficulty = difficulty;
    state.correct = 0;
    state.incorrect = 0;
    state.active = false;

    clearInterval(state.timerId);
    clearInterval(state.countdownId);
    clearTimeout(state.revealTimeoutId);
    clearTimeout(state.moveFeedbackTimeoutId);
    clearTimeout(state.attackFeedbackTimeoutId);

    // resume/create audio context in response to user gesture
    getAudioCtx();

    screens.game.classList.remove('mode-master');
    screens.game.classList.toggle('mode-color', mode === 'color');
    screens.game.classList.toggle('mode-piece', mode === 'piece');
    screens.game.classList.toggle('mode-attacks', mode === 'attacks');
    screens.game.classList.toggle('mode-move', mode === 'move');
    gameContent.classList.toggle('stack', mode === 'color' || mode === 'attacks' || mode === 'move');

    buildBoard();
    boardWrapper.classList.toggle('reference', mode !== 'locate');
    boardStage.hidden = false;
    answerGrid.hidden = mode !== 'piece';
    colorGrid.hidden = mode !== 'color';
    attackPanel.hidden = mode !== 'attacks';
    attackInputEl.disabled = false;
    attackSubmitBtn.disabled = false;
    movePanel.hidden = mode !== 'move';
    moveInputEl.disabled = false;
    moveSubmitBtn.disabled = false;
    masterHint.hidden = true;
    targetLabelEl.textContent = mode === 'piece' ? "What's on:" : mode === 'color' ? 'Color of:' : 'Find:';
    if (mode === 'attacks' || mode === 'move') targetLabelEl.textContent = '';
    targetEl.textContent = '';
    state.timeLeft = state.roundLength === 'endless' ? 0 : roundDuration();
    timerEl.textContent = state.timeLeft;

    showScreen('game');

    runCountdown(() => {
      state.active = true;
      if (mode === 'attacks') {
        nextAttackPrompt();
      } else if (mode === 'move') {
        nextMovePuzzle();
      } else {
        nextTarget();
      }
      startRoundTimer();
    });
  }

  function endGame() {
    state.active = false;
    clearInterval(state.timerId);
    clearTimeout(state.revealTimeoutId);
    clearTimeout(state.moveFeedbackTimeoutId);
    clearTimeout(state.attackFeedbackTimeoutId);
    hideOverlay();

    const wasMaster = state.difficulty === 'extreme';
    const wasEndless = state.roundLength === 'endless';

    resultsHeadingEl.textContent = wasEndless ? 'Round complete!' : "Time's up!";
    resultCorrectEl.textContent = state.correct;
    resultIncorrectEl.textContent = state.incorrect;

    const total = state.correct + state.incorrect;
    const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    resultAccuracyEl.textContent = total > 0
      ? `${accuracy}% accuracy (${total} total)`
      : 'No answers given';

    showScreen('results');

    if (wasMaster) {
      const prefix = wasEndless ? '' : "Time's up. ";
      speak(`${prefix}You got ${state.correct} correct and ${state.incorrect} incorrect.`);
    }
  }

  function quitToMenu() {
    state.active = false;
    clearInterval(state.timerId);
    clearInterval(state.countdownId);
    clearTimeout(state.revealTimeoutId);
    clearTimeout(state.moveFeedbackTimeoutId);
    clearTimeout(state.attackFeedbackTimeoutId);
    hideOverlay();
    stopSpeech();
    showMenuRoot();
  }

  function requestQuit() {
    // An endless round has no natural end, so quitting mid-round is how you
    // "finish" it - show the results instead of silently discarding them.
    if (state.active && state.roundLength === 'endless') {
      endGame();
    } else {
      quitToMenu();
    }
  }

  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selectedMode = card.dataset.mode;
      difficultyHeading.textContent = MODE_LABELS[state.selectedMode];
      cardExtreme.hidden = ['locate', 'move', 'attacks'].includes(state.selectedMode);
      modeSelect.hidden = true;
      difficultySelect.hidden = false;
    });
  });

  btnBackMode.addEventListener('click', () => {
    difficultySelect.hidden = true;
    modeSelect.hidden = false;
  });

  lengthToggle.querySelectorAll('.length-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.roundLength = btn.dataset.length;
      lengthToggle.querySelectorAll('.length-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  povToggle.querySelectorAll('.pov-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.pov = btn.dataset.pov;
      povToggle.querySelectorAll('.pov-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  document.querySelectorAll('#difficulty-select .difficulty-card').forEach(card => {
    card.addEventListener('click', () => startRound(state.selectedMode, card.dataset.difficulty));
  });

  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', onAnswerClick);
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', onColorClick);
  });

  attackSubmitBtn.addEventListener('click', submitAttackAnswer);
  attackInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAttackAnswer();
    }
  });

  moveSubmitBtn.addEventListener('click', submitMoveAnswer);
  moveInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitMoveAnswer();
    }
  });

  btnQuit.addEventListener('click', requestQuit);
  btnMenu.addEventListener('click', quitToMenu);
  btnAgain.addEventListener('click', () => startRound(state.mode, state.difficulty));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !screens.game.hidden) {
      requestQuit();
    }
  });

  showMenuRoot();
})();
