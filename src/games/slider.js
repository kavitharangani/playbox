import sound from '../sound.js';

export default {
  id: 'slider',
  name: 'Sliding Puzzle',
  icon: '🔢',
  color: '#3f8fa8',
  age: 'senior',
  category: 'Puzzle',
  tags: ['15 puzzle', 'fifteen', 'tiles', 'numbers', 'logic', 'expert', 'hard', 'thinking'],
  description: 'Slide fifteen scrambled tiles back into order using the one empty space.',
  howTo: ['Tap a tile in line with the gap, or use the arrow keys', 'Put 1 to 15 in order, with the gap at the bottom right', 'You start with 2,000 points and lose some for each move and second'],
  bots: [600, 1000, 1400, 1700],
  mount(root, api) {
    const N = 4, SHUFFLE_MOVES = 240;
    root.innerHTML = '<div class="slider"></div>';
    const boardEl = root.firstElementChild;

    // board[position] is the tile number there, and 0 is the gap.
    const board = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));
    let gap = N * N - 1;

    const neighbours = (i) => {
      const out = [];
      if (i >= N) out.push(i - N);
      if (i < N * N - N) out.push(i + N);
      if (i % N > 0) out.push(i - 1);
      if (i % N < N - 1) out.push(i + 1);
      return out;
    };

    // Scrambling with legal moves guarantees the puzzle can be solved.
    let previous = -1;
    for (let k = 0; k < SHUFFLE_MOVES; k++) {
      const options = neighbours(gap).filter((n) => n !== previous);
      const next = options[Math.floor(Math.random() * options.length)];
      board[gap] = board[next];
      board[next] = 0;
      previous = gap;
      gap = next;
    }

    const tiles = {};
    for (let t = 1; t < N * N; t++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slider-tile';
      btn.textContent = t;
      btn.addEventListener('click', () => tap(t));
      boardEl.appendChild(btn);
      tiles[t] = btn;
    }

    const startedAt = Date.now();
    let moves = 0, solved = false, timer = 0;

    const seconds = () => Math.floor((Date.now() - startedAt) / 1000);
    const correct = () => board.filter((t, i) => t !== 0 && t === i + 1).length;

    function info() {
      api.setInfo(`Moves ${moves} · Time ${seconds()}s`);
    }
    const clock = setInterval(info, 500);

    function draw() {
      board.forEach((t, i) => {
        if (!t) return;
        const btn = tiles[t];
        btn.style.setProperty('--x', i % N);
        btn.style.setProperty('--y', Math.floor(i / N));
        btn.classList.toggle('home', t === i + 1);
        btn.setAttribute('aria-label', `Tile ${t}, row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}`);
      });
    }

    function slide(from) {
      board[gap] = board[from];
      board[from] = 0;
      gap = from;
      moves++;
    }

    function afterMove() {
      draw();
      sound.play('tap');
      if (correct() === N * N - 1) {
        solved = true;
        const final = Math.max(200, 2000 - moves * 5 - seconds() * 2);
        api.setScore(final);
        boardEl.classList.add('solved');
        sound.play('score');
        timer = setTimeout(() => api.end(final), 1100);
      } else {
        // Until it is solved, the score just reflects how many tiles are home.
        api.setScore(correct() * 10);
      }
      info();
    }

    function tap(tile) {
      if (solved) return;
      const at = board.indexOf(tile);
      const sameRow = Math.floor(at / N) === Math.floor(gap / N);
      const sameCol = at % N === gap % N;
      if (!sameRow && !sameCol) return;
      const step = sameRow ? Math.sign(at - gap) : Math.sign(at - gap) * N;
      while (gap !== at) slide(gap + step);
      afterMove();
    }

    function onKey(e) {
      // The arrow says which way a tile moves, so the gap moves the opposite way.
      const from = { ArrowUp: gap + N, ArrowDown: gap - N, ArrowLeft: gap + 1, ArrowRight: gap - 1 }[e.key];
      if (from === undefined) return;
      e.preventDefault();
      if (solved || !neighbours(gap).includes(from)) return;
      slide(from);
      afterMove();
    }
    window.addEventListener('keydown', onKey);
    draw();
    info();

    return () => {
      clearInterval(clock);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
