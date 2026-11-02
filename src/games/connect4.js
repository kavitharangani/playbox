import sound from '../sound.js';

const COLS = 7, ROWS = 6;

// Every run of four cells on the board.
const LINES = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => {
      const endR = r + dr * 3, endC = c + dc * 3;
      if (endR >= 0 && endR < ROWS && endC >= 0 && endC < COLS) {
        LINES.push([0, 1, 2, 3].map((k) => (r + dr * k) * COLS + c + dc * k));
      }
    });
  }
}

const winningLine = (board) => LINES.find(([a, b, c, d]) => board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]);

// Lowest free row in a column, or -1 when the column is full. Row 0 is the top.
function landing(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r * COLS + col]) return r;
  }
  return -1;
}

function evaluate(board) {
  let total = 0;
  LINES.forEach((line) => {
    const mine = line.filter((i) => board[i] === 'cpu').length;
    const yours = line.filter((i) => board[i] === 'you').length;
    if (mine && yours) return;
    if (mine) total += mine === 3 ? 12 : mine === 2 ? 3 : 1;
    if (yours) total -= yours === 3 ? 14 : yours === 2 ? 3 : 1;
  });
  return total;
}

function search(board, depth, alpha, beta, cpuTurn) {
  const line = winningLine(board);
  if (line) return { value: board[line[0]] === 'cpu' ? 1000 + depth : -1000 - depth };
  const moves = [3, 2, 4, 1, 5, 0, 6].filter((c) => landing(board, c) >= 0);
  if (!moves.length) return { value: 0 };
  if (depth === 0) return { value: evaluate(board) };
  let best = { value: cpuTurn ? -Infinity : Infinity, col: moves[0] };
  for (const col of moves) {
    const i = landing(board, col) * COLS + col;
    board[i] = cpuTurn ? 'cpu' : 'you';
    const { value } = search(board, depth - 1, alpha, beta, !cpuTurn);
    board[i] = null;
    if (cpuTurn ? value > best.value : value < best.value) best = { value, col };
    if (cpuTurn) alpha = Math.max(alpha, value);
    else beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return best;
}

export default {
  id: 'connect4',
  name: 'Four in a Row',
  icon: '🔴',
  color: '#4a79d6',
  age: 'junior',
  category: 'Puzzle',
  tags: ['connect four', 'connect 4', 'strategy', 'board game', 'logic', 'adults', 'thinking'],
  description: 'Line up four discs before the computer does. One loss ends your run.',
  howTo: ['Tap a column, or press keys 1 to 7, to drop a disc', '+150 for a win, plus a bonus for a win streak', '+50 for a draw. The computer gets sharper as you win'],
  bots: [150, 500, 900, 1500],
  mount(root, api) {
    root.innerHTML = '<div class="c4"><div class="ttt-status" aria-live="polite"></div><div class="c4-grid"></div></div>';
    const statusEl = root.querySelector('.ttt-status');
    const grid = root.querySelector('.c4-grid');
    const cells = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'c4-cell';
      cell.setAttribute('aria-label', `Column ${(i % COLS) + 1}`);
      cell.addEventListener('click', () => play(i % COLS));
      grid.appendChild(cell);
      cells.push(cell);
    }

    let board, score = 0, streak = 0, wins = 0, round = 0, locked = true, timer = 0;

    function info() {
      api.setInfo(`Round ${round} · Streak ${streak}`);
    }

    function place(col, who) {
      const r = landing(board, col);
      const i = r * COLS + col;
      board[i] = who;
      cells[i].innerHTML = `<span class="c4-disc ${who}" style="--fall:${r + 1}"></span>`;
      sound.play('tap');
    }

    function newRound() {
      round++;
      board = new Array(COLS * ROWS).fill(null);
      cells.forEach((cell) => {
        cell.innerHTML = '';
        cell.classList.remove('won');
      });
      info();
      if (round % 2) {
        statusEl.textContent = 'Your turn';
        locked = false;
      } else {
        statusEl.textContent = 'Computer starts';
        timer = setTimeout(cpuMove, 550);
      }
    }

    // Returns true when the round has finished.
    function settle() {
      const line = winningLine(board);
      if (line) {
        line.forEach((i) => cells[i].classList.add('won'));
        locked = true;
        if (board[line[0]] === 'you') {
          wins++;
          streak++;
          score += 150 + (streak - 1) * 50;
          api.setScore(score);
          statusEl.textContent = streak > 1 ? `You win! Streak ×${streak}` : 'You win!';
          sound.play('score');
          timer = setTimeout(newRound, 1500);
        } else {
          statusEl.textContent = 'The computer wins';
          sound.play('bad');
          timer = setTimeout(() => api.end(score), 1500);
        }
        return true;
      }
      if (!board.includes(null)) {
        locked = true;
        streak = 0;
        score += 50;
        api.setScore(score);
        statusEl.textContent = 'Draw! +50';
        timer = setTimeout(newRound, 1500);
        return true;
      }
      return false;
    }

    function cpuMove() {
      const open = [0, 1, 2, 3, 4, 5, 6].filter((c) => landing(board, c) >= 0);
      const careless = Math.random() < Math.max(0, .3 - wins * .1);
      const depth = Math.min(6, 3 + wins);
      const col = careless ? open[Math.floor(Math.random() * open.length)] : search(board, depth, -Infinity, Infinity, true).col;
      place(col, 'cpu');
      if (!settle()) {
        statusEl.textContent = 'Your turn';
        locked = false;
      }
    }

    function play(col) {
      if (locked || landing(board, col) < 0) return;
      place(col, 'you');
      if (settle()) return;
      locked = true;
      statusEl.textContent = 'Computer is thinking…';
      timer = setTimeout(cpuMove, 500);
    }

    function onKey(e) {
      if (e.key >= '1' && e.key <= '7') play(Number(e.key) - 1);
    }
    window.addEventListener('keydown', onKey);
    newRound();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
