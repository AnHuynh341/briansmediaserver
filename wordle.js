/* W41IT Wordle — standalone client-side game. No storage or API calls. */
(() => {
  'use strict';

  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;
  const answerWords = Array.isArray(window.WORDLE_ANSWER_WORDS) ? window.WORDLE_ANSWER_WORDS : [];
  const validWords = new Set([
    ...(Array.isArray(window.WORDLE_VALID_GUESSES) ? window.WORDLE_VALID_GUESSES : []),
    ...answerWords
  ]);

  const state = {
    answer: '',
    answerQueue: [],
    lastAnswer: '',
    row: 0,
    currentGuess: '',
    finished: false,
    guesses: [],
    keyboard: new Map(),
    stats: { played: 0, wins: 0, streak: 0 }
  };

  const overlay = document.getElementById('wordleOverlay');
  const board = document.getElementById('wordleBoard');
  const keyboard = document.getElementById('wordleKeyboard');
  const message = document.getElementById('wordleMessage');
  const nextButton = document.getElementById('wordleNextButton');
  const answerReveal = document.getElementById('wordleAnswer');
  const statsPlayed = document.getElementById('wordlePlayed');
  const statsWins = document.getElementById('wordleWins');
  const statsRate = document.getElementById('wordleRate');
  const statsStreak = document.getElementById('wordleStreak');

  if (!overlay || !board || !keyboard || answerWords.length === 0 || validWords.size === 0) return;

  const keyboardRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function drawAnswer() {
    if (state.answerQueue.length === 0) {
      state.answerQueue = shuffle(answerWords);
      if (state.answerQueue.length > 1 && state.answerQueue[0] === state.lastAnswer) {
        [state.answerQueue[0], state.answerQueue[1]] = [state.answerQueue[1], state.answerQueue[0]];
      }
    }
    const next = state.answerQueue.shift();
    state.lastAnswer = next;
    return next;
  }

  function buildBoard() {
    board.replaceChildren();
    for (let row = 0; row < MAX_GUESSES; row += 1) {
      const rowElement = document.createElement('div');
      rowElement.className = 'wordle-row';
      rowElement.setAttribute('role', 'group');
      rowElement.setAttribute('aria-label', `Guess ${row + 1}`);
      for (let col = 0; col < WORD_LENGTH; col += 1) {
        const tile = document.createElement('div');
        tile.className = 'wordle-tile';
        tile.dataset.row = String(row);
        tile.dataset.col = String(col);
        tile.setAttribute('aria-hidden', 'true');
        rowElement.appendChild(tile);
      }
      board.appendChild(rowElement);
    }
  }

  function buildKeyboard() {
    keyboard.replaceChildren();
    keyboardRows.forEach((letters, rowIndex) => {
      const row = document.createElement('div');
      row.className = 'wordle-key-row';
      if (rowIndex === 2) {
        row.appendChild(makeKey('ENTER', 'Enter', 'wordle-key-wide'));
      }
      for (const letter of letters) row.appendChild(makeKey(letter, letter));
      if (rowIndex === 2) {
        row.appendChild(makeKey('⌫', 'Backspace', 'wordle-key-wide'));
      }
      keyboard.appendChild(row);
    });
  }

  function makeKey(label, value, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `wordle-key ${extraClass}`.trim();
    button.textContent = label;
    button.dataset.key = value;
    button.setAttribute('aria-label', value === 'Backspace' ? 'Delete letter' : value === 'Enter' ? 'Submit guess' : label);
    button.addEventListener('click', () => handleKey(value));
    return button;
  }

  function setMessage(text, type = '') {
    message.textContent = text;
    message.className = `wordle-message${type ? ` is-${type}` : ''}`;
  }

  function updateStats() {
    statsPlayed.textContent = String(state.stats.played);
    statsWins.textContent = String(state.stats.wins);
    statsRate.textContent = state.stats.played
      ? `${Math.round((state.stats.wins / state.stats.played) * 100)}%`
      : '0%';
    statsStreak.textContent = String(state.stats.streak);
  }

  function updateCurrentRow() {
    for (let col = 0; col < WORD_LENGTH; col += 1) {
      const tile = board.querySelector(`.wordle-tile[data-row="${state.row}"][data-col="${col}"]`);
      if (!tile) continue;
      tile.textContent = state.currentGuess[col] || '';
      tile.classList.toggle('is-filled', Boolean(state.currentGuess[col]));
    }
  }

  function updateKeyboard() {
    keyboard.querySelectorAll('.wordle-key[data-key]').forEach(key => {
      const value = key.dataset.key;
      if (value.length !== 1) return;
      key.classList.remove('is-correct', 'is-present', 'is-absent');
      const status = state.keyboard.get(value);
      if (status) key.classList.add(`is-${status}`);
    });
  }

  function evaluateGuess(guess) {
    const result = Array(WORD_LENGTH).fill('absent');
    const remaining = Object.create(null);

    for (let i = 0; i < WORD_LENGTH; i += 1) {
      if (guess[i] === state.answer[i]) {
        result[i] = 'correct';
      } else {
        remaining[state.answer[i]] = (remaining[state.answer[i]] || 0) + 1;
      }
    }

    for (let i = 0; i < WORD_LENGTH; i += 1) {
      if (result[i] === 'correct') continue;
      const letter = guess[i];
      if (remaining[letter] > 0) {
        result[i] = 'present';
        remaining[letter] -= 1;
      }
    }
    return result;
  }

  function paintSubmittedRow(guess, result) {
    for (let col = 0; col < WORD_LENGTH; col += 1) {
      const tile = board.querySelector(`.wordle-tile[data-row="${state.row}"][data-col="${col}"]`);
      if (!tile) continue;
      tile.textContent = guess[col];
      tile.classList.remove('is-filled');
      tile.classList.add(`is-${result[col]}`);
      tile.style.animationDelay = `${col * 90}ms`;
    }

    const priority = { absent: 1, present: 2, correct: 3 };
    for (let i = 0; i < WORD_LENGTH; i += 1) {
      const letter = guess[i];
      const current = state.keyboard.get(letter);
      if (!current || priority[result[i]] > priority[current]) {
        state.keyboard.set(letter, result[i]);
      }
    }
    updateKeyboard();
  }

  function shakeCurrentRow() {
    const row = board.children[state.row];
    if (!row) return;
    row.classList.remove('is-shaking');
    void row.offsetWidth;
    row.classList.add('is-shaking');
  }

  function submitGuess() {
    if (state.finished) return;
    if (state.currentGuess.length !== WORD_LENGTH) {
      setMessage('Not enough letters');
      shakeCurrentRow();
      return;
    }
    const guess = state.currentGuess.toLowerCase();
    if (!validWords.has(guess)) {
      setMessage('Word not in the word list');
      shakeCurrentRow();
      return;
    }

    const result = evaluateGuess(guess);
    state.guesses.push(guess);
    paintSubmittedRow(guess, result);

    const won = guess === state.answer;
    const lost = !won && state.row === MAX_GUESSES - 1;

    if (won || lost) {
      state.finished = true;
      state.stats.played += 1;
      if (won) {
        state.stats.wins += 1;
        state.stats.streak += 1;
        setMessage('You got it! Nice work.', 'success');
      } else {
        state.stats.streak = 0;
        setMessage('Out of guesses. Better luck next round.', 'failure');
        answerReveal.textContent = `The word was ${state.answer.toUpperCase()}.`;
      }
      nextButton.classList.remove('hidden');
      keyboard.querySelector('[data-key="Enter"]')?.setAttribute('aria-label', 'Start next word');
      updateStats();
      return;
    }

    state.row += 1;
    state.currentGuess = '';
    setMessage('');
  }

  function handleKey(key) {
    if (state.finished) {
      if (key === 'Enter') startNextRound();
      return;
    }
    if (key === 'Enter') {
      submitGuess();
      return;
    }
    if (key === 'Backspace') {
      state.currentGuess = state.currentGuess.slice(0, -1);
      updateCurrentRow();
      setMessage('');
      return;
    }
    if (/^[a-z]$/i.test(key) && state.currentGuess.length < WORD_LENGTH) {
      state.currentGuess += key.toUpperCase();
      updateCurrentRow();
      setMessage('');
    }
  }

  function startNextRound() {
    state.answer = drawAnswer();
    state.row = 0;
    state.currentGuess = '';
    state.finished = false;
    state.guesses = [];
    state.keyboard.clear();
    nextButton.classList.add('hidden');
    keyboard.querySelector('[data-key="Enter"]')?.setAttribute('aria-label', 'Submit guess');
    answerReveal.textContent = '';
    setMessage('Type a five-letter word to begin.');
    buildBoard();
    updateKeyboard();
  }

  function openWordle() {
    overlay.classList.remove('hidden');
    document.body.classList.add('wordle-open');
    document.getElementById('navWordle')?.classList.add('active');
    document.getElementById('navAllTracks')?.classList.remove('active');
    document.getElementById('navVideo')?.classList.remove('active');
    if (window.innerWidth <= 900 && typeof closeSidebar === 'function') closeSidebar();
    document.getElementById('wordleCloseButton')?.focus({ preventScroll: true });
  }

  function closeWordle() {
    overlay.classList.add('hidden');
    document.body.classList.remove('wordle-open');
    document.getElementById('navWordle')?.classList.remove('active');
    const isVideo = document.getElementById('mainPage')?.classList.contains('video-mode');
    document.getElementById(isVideo ? 'navVideo' : 'navAllTracks')?.classList.add('active');
  }

  function handleDocumentKeydown(event) {
    if (overlay.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeWordle();
      return;
    }
    // Keep player shortcuts (N/P/S/L/Space) from firing while the game is open.
    event.stopImmediatePropagation();
    if (event.key === 'Enter' || event.key === 'Backspace' || /^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      handleKey(event.key);
    }
  }

  function setupLayout() {
    const shell = overlay.querySelector('.wordle-shell');
    const nextWrap = nextButton.closest('.wordle-next-wrap');
    const footnote = shell.querySelector('.wordle-footnote');
    if (!shell || !nextWrap || !footnote || board.closest('.wordle-game-column')) return;

    const playArea = document.createElement('div');
    playArea.className = 'wordle-play-area';

    const gameColumn = document.createElement('div');
    gameColumn.className = 'wordle-game-column';

    const keyboardPanel = document.createElement('aside');
    keyboardPanel.className = 'wordle-keyboard-panel';
    keyboardPanel.setAttribute('aria-label', 'Wordle keyboard');

    shell.insertBefore(playArea, board);
    gameColumn.append(board, message, answerReveal, nextWrap);
    keyboardPanel.append(keyboard, footnote);
    playArea.append(gameColumn, keyboardPanel);
  }

  function initialize() {
    setupLayout();
    buildBoard();
    buildKeyboard();
    startNextRound();
    nextButton.addEventListener('click', startNextRound);
    document.getElementById('wordleCloseButton')?.addEventListener('click', closeWordle);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeWordle();
    });
    document.addEventListener('keydown', handleDocumentKeydown, true);
    window.openWordle = openWordle;
    window.closeWordle = closeWordle;
  }

  initialize();
})();
