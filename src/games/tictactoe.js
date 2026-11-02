import sound from '../sound.js';

export default {
  id: 'tictactoe',
  name: 'Tic-Tac-Toe',
  icon: '⭕',
  color: '#7d9c4d',
  age: 'child',
  category: 'Puzzle',
  tags: ['x and o', 'noughts and crosses', 'strategy', 'logic', 'kids'],
  description: 'Beat the computer round after round. One loss ends your run.',
  howTo: ['You are X. Tap a square or press keys 1 to 9', '+100 for a win, plus a bonus for a win streak', '+25 for a draw. The computer gets sharper as you win'],
  bots: [100, 300, 600, 1000],
  mount(root, api) {
    const WINS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const MARKS = {
      X: '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="draw" d="M26 26L74 74M74 26L26 74"/></svg>',
      O: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="draw" cx="50" cy="50" r="27"/></svg>',
    };
    root.innerHTML = '<div class="ttt"><div class="ttt-status" aria-live="polite"></div><div class="ttt-grid"></div></div>';
    const statusEl = root.querySelector('.ttt-status');
    const grid = root.querySelector('.ttt-grid');
    const squares = [];
    for (let i = 0; i < 9; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ttt-cell';
      btn.addEventListener('click', () => play(i));
      grid.appendChild(btn);
      squares.push(btn);
    }

    let board, score = 0, streak = 0, wins = 0, round = 0, locked = true, timer = 0;

    const winner = (b) => WINS.find(([x, y, z]) => b[x] && b[x] === b[y] && b[x] === b[z]);
    const free = (b) => b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);

    function minimax(b, turn, depth) {
      const line = winner(b);
      if (line) return { value: b[line[0]] === 'O' ? 10 - depth : depth - 10 };
      const moves = free(b);
      if (!moves.length) return { value: 0 };
      let best = null;
      moves.forEach((i) => {
        b[i] = turn;
        const { value } = minimax(b, turn === 'O' ? 'X' : 'O', depth + 1);
        b[i] = null;
        const better = !best || (turn === 'O' ? value > best.value : value < best.value);
        if (better) best = { value, move: i };
      });
      return best;
    }

    function info() {
      api.setInfo(`Round ${round} · Streak ${streak}`);
    }

    function mark(i, who) {
      board[i] = who;
      squares[i].innerHTML = MARKS[who];
      squares[i].classList.add(who === 'X' ? 'is-x' : 'is-o');
      squares[i].setAttribute('aria-label', `Square ${i + 1}, ${who}`);
      sound.play('tap');
    }

    function newRound() {
      round++;
      board = new Array(9).fill(null);
      squares.forEach((s, i) => {
        s.innerHTML = '';
        s.className = 'ttt-cell';
        s.setAttribute('aria-label', `Square ${i + 1}, empty`);
      });
      info();
      if (round % 2) {
        statusEl.textContent = 'Your turn';
        locked = false;
      } else {
        statusEl.textContent = 'Computer starts';
        timer = setTimeout(cpuMove, 500);
      }
    }

    // Returns true when the round has finished.
    function settle() {
      const line = winner(board);
      if (line) {
        line.forEach((i) => squares[i].classList.add('won'));
        locked = true;
        if (board[line[0]] === 'X') {
          wins++;
          streak++;
          score += 100 + (streak - 1) * 20;
          api.setScore(score);
          statusEl.textContent = streak > 1 ? `You win! Streak ×${streak}` : 'You win!';
          sound.play('score');
          timer = setTimeout(newRound, 1000);
        } else {
          statusEl.textContent = 'The computer wins';
          sound.play('bad');
          timer = setTimeout(() => api.end(score), 1000);
        }
        return true;
      }
      if (!free(board).length) {
        locked = true;
        streak = 0;
        score += 25;
        api.setScore(score);
        statusEl.textContent = 'Draw! +25';
        timer = setTimeout(newRound, 1000);
        return true;
      }
      return false;
    }

    function cpuMove() {
      const moves = free(board);
      const mistake = Math.random() < Math.max(.05, .45 - wins * .07);
      const move = mistake ? moves[Math.floor(Math.random() * moves.length)] : minimax(board, 'O', 0).move;
      mark(move, 'O');
      if (!settle()) {
        statusEl.textContent = 'Your turn';
        locked = false;
      }
    }

    function play(i) {
      if (locked || board[i]) return;
      mark(i, 'X');
      if (settle()) return;
      locked = true;
      statusEl.textContent = 'Computer is thinking…';
      timer = setTimeout(cpuMove, 450);
    }

    function onKey(e) {
      if (e.key >= '1' && e.key <= '9') play(Number(e.key) - 1);
    }
    window.addEventListener('keydown', onKey);
    newRound();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
