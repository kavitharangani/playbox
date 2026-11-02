import sound from '../sound.js';

const SIZE = 8;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
// Corners win games, and the squares next to them give corners away.
const WEIGHTS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
];

const other = (who) => (who === 'you' ? 'cpu' : 'you');

// The discs that playing at i would flip.
function flips(board, i, who) {
  if (board[i]) return [];
  const out = [];
  const r = Math.floor(i / SIZE), c = i % SIZE;
  DIRS.forEach(([dr, dc]) => {
    const line = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nc >= 0 && nr < SIZE && nc < SIZE) {
      const at = nr * SIZE + nc;
      if (board[at] === other(who)) line.push(at);
      else {
        if (board[at] === who) out.push(...line);
        break;
      }
      nr += dr;
      nc += dc;
    }
  });
  return out;
}

function legalMoves(board, who) {
  const moves = [];
  for (let i = 0; i < board.length; i++) {
    if (!board[i] && flips(board, i, who).length) moves.push(i);
  }
  return moves;
}

function evaluate(board) {
  let total = 0;
  board.forEach((v, i) => {
    if (v === 'cpu') total += WEIGHTS[i];
    if (v === 'you') total -= WEIGHTS[i];
  });
  return total + (legalMoves(board, 'cpu').length - legalMoves(board, 'you').length) * 6;
}

function search(board, depth, alpha, beta, who, passed) {
  if (depth === 0) return { value: evaluate(board) };
  const moves = legalMoves(board, who);
  if (!moves.length) {
    if (passed) {
      const diff = board.filter((v) => v === 'cpu').length - board.filter((v) => v === 'you').length;
      return { value: diff * 1000 };
    }
    return { value: search(board, depth - 1, alpha, beta, other(who), true).value };
  }
  let best = { value: who === 'cpu' ? -Infinity : Infinity, move: moves[0] };
  for (const move of moves) {
    const flipped = flips(board, move, who);
    board[move] = who;
    flipped.forEach((f) => { board[f] = who; });
    const { value } = search(board, depth - 1, alpha, beta, other(who), false);
    board[move] = null;
    flipped.forEach((f) => { board[f] = other(who); });
    if (who === 'cpu' ? value > best.value : value < best.value) best = { value, move };
    if (who === 'cpu') alpha = Math.max(alpha, value);
    else beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return best;
}

export default {
  id: 'reversi',
  name: 'Reversi',
  icon: '⚫',
  color: '#2f8a68',
  age: 'senior',
  category: 'Puzzle',
  tags: ['othello', 'board game', 'strategy', 'expert', 'hard', 'thinking', 'discs'],
  description: 'Trap the computer\'s discs and flip them. It looks ahead, so plan further.',
  howTo: ['You are black. Tap a dotted square to trap white discs in a line', 'Most discs when the board fills wins. One loss ends your run', '+300 for a win, plus points for your margin and win streak'],
  bots: [300, 700, 1200, 2000],
  mount(root, api) {
    root.innerHTML = `
      <div class="rev">
        <div class="ttt-status" aria-live="polite"></div>
        <div class="rev-count"><span class="you"><i></i><b></b></span><span class="cpu"><i></i><b></b></span></div>
        <div class="rev-grid"></div>
      </div>`;
    const statusEl = root.querySelector('.ttt-status');
    const youCount = root.querySelector('.rev-count .you b');
    const cpuCount = root.querySelector('.rev-count .cpu b');
    const grid = root.querySelector('.rev-grid');
    const cells = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'rev-cell';
      cell.addEventListener('click', () => playerMove(i));
      grid.appendChild(cell);
      cells.push(cell);
    }

    let board, score = 0, streak = 0, wins = 0, round = 0, locked = true, timer = 0;

    function draw(changed = [], placed = -1) {
      const legal = locked ? [] : legalMoves(board, 'you');
      cells.forEach((cell, i) => {
        const v = board[i];
        cell.classList.toggle('legal', legal.includes(i));
        cell.classList.toggle('last', i === placed);
        cell.setAttribute('aria-label', `Square ${i + 1}, ${v === 'you' ? 'black' : v === 'cpu' ? 'white' : legal.includes(i) ? 'can play here' : 'empty'}`);
        const anim = i === placed ? ' new' : changed.includes(i) ? ' flip' : '';
        if (!v) cell.innerHTML = '';
        else if (anim || !cell.firstChild) cell.innerHTML = `<span class="rev-disc ${v}${anim}"></span>`;
      });
      youCount.textContent = board.filter((v) => v === 'you').length;
      cpuCount.textContent = board.filter((v) => v === 'cpu').length;
    }

    function apply(i, who) {
      const flipped = flips(board, i, who);
      board[i] = who;
      flipped.forEach((f) => { board[f] = who; });
      sound.play('flip');
      return flipped;
    }

    function finishRound() {
      locked = true;
      const you = board.filter((v) => v === 'you').length;
      const cpu = board.filter((v) => v === 'cpu').length;
      if (you > cpu) {
        wins++;
        streak++;
        score += 300 + (you - cpu) * 5 + (streak - 1) * 100;
        api.setScore(score);
        statusEl.textContent = `You win ${you} to ${cpu}!`;
        sound.play('score');
        timer = setTimeout(newRound, 1800);
      } else if (you === cpu) {
        streak = 0;
        score += 100;
        api.setScore(score);
        statusEl.textContent = 'Draw! +100';
        timer = setTimeout(newRound, 1800);
      } else {
        statusEl.textContent = `The computer wins ${cpu} to ${you}`;
        sound.play('bad');
        timer = setTimeout(() => api.end(score), 1800);
      }
    }

    function yourTurn(changed, placed) {
      if (legalMoves(board, 'you').length) {
        statusEl.textContent = 'Your turn';
        locked = false;
        draw(changed, placed);
        return;
      }
      if (legalMoves(board, 'cpu').length) {
        statusEl.textContent = 'No move for you. Computer plays again';
        draw(changed, placed);
        timer = setTimeout(cpuMove, 900);
        return;
      }
      draw(changed, placed);
      finishRound();
    }

    function cpuMove() {
      const depth = Math.min(6, 4 + wins);
      const { move } = search(board, depth, -Infinity, Infinity, 'cpu', false);
      const flipped = apply(move, 'cpu');
      yourTurn(flipped, move);
    }

    function cpuTurn(changed, placed) {
      if (legalMoves(board, 'cpu').length) {
        locked = true;
        statusEl.textContent = 'Computer is thinking…';
        draw(changed, placed);
        timer = setTimeout(cpuMove, 500);
        return;
      }
      if (legalMoves(board, 'you').length) {
        statusEl.textContent = 'Computer has no move. Your turn again';
        locked = false;
        draw(changed, placed);
        return;
      }
      locked = true;
      draw(changed, placed);
      finishRound();
    }

    function playerMove(i) {
      if (locked || !flips(board, i, 'you').length) return;
      locked = true;
      cpuTurn(apply(i, 'you'), i);
    }

    function newRound() {
      round++;
      board = new Array(SIZE * SIZE).fill(null);
      board[27] = 'cpu';
      board[28] = 'you';
      board[35] = 'you';
      board[36] = 'cpu';
      cells.forEach((cell) => { cell.innerHTML = ''; });
      api.setInfo(`Round ${round} · Streak ${streak}`);
      if (round % 2) {
        locked = false;
        statusEl.textContent = 'Your turn';
        draw();
      } else {
        locked = true;
        statusEl.textContent = 'Computer starts';
        draw();
        timer = setTimeout(cpuMove, 700);
      }
    }

    newRound();

    return () => {
      clearTimeout(timer);
    };
  },
};
