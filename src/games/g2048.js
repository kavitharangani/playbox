import sound from '../sound.js';

export default {
  id: '2048',
  name: '2048',
  icon: '🔢',
  color: '#d19a3f',
  age: 'junior',
  category: 'Puzzle',
  tags: ['numbers', 'tiles', 'merge', 'logic', 'swipe'],
  description: 'Slide the tiles and merge matching numbers.',
  howTo: ['Arrow keys, WASD or swipe to slide', 'Matching tiles merge into one', 'Every merge adds its value to your score'],
  bots: [800, 2500, 6000, 16000],
  mount(root, api) {
    const COLORS = {
      2: ['#3b3f52', '#f4f2ea'], 4: ['#4a4f68', '#f4f2ea'], 8: ['#c9772f', '#fff'], 16: ['#d8652c', '#fff'],
      32: ['#df4f3a', '#fff'], 64: ['#d9352f', '#fff'], 128: ['#e0b23c', '#231a00'], 256: ['#e6bc3f', '#231a00'],
      512: ['#efc53f', '#231a00'], 1024: ['#f6cf3e', '#231a00'], 2048: ['#ffd83d', '#231a00'],
    };
    const KEYS = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    };
    const SLIDE_MS = 110;
    root.innerHTML = `<div class="board2048" role="img" aria-label="2048 board">${'<div class="slot"></div>'.repeat(16)}<div class="tile-layer"></div></div>`;
    const boardEl = root.firstElementChild;
    const layer = boardEl.querySelector('.tile-layer');

    let cells = new Array(16).fill(null);
    let score = 0, over = false, touch = null;
    const timers = new Set();

    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    }

    function paint(tile) {
      const [bg, fg] = COLORS[tile.value] || ['#ffe680', '#231a00'];
      tile.el.textContent = tile.value;
      tile.el.style.background = bg;
      tile.el.style.color = fg;
      tile.el.classList.toggle('long', tile.value >= 1000);
    }

    function place(tile, i) {
      tile.el.style.setProperty('--x', i % 4);
      tile.el.style.setProperty('--y', Math.floor(i / 4));
    }

    function addTile() {
      const free = [];
      cells.forEach((tile, i) => { if (!tile) free.push(i); });
      const i = free[Math.floor(Math.random() * free.length)];
      const tile = { value: Math.random() < 0.9 ? 2 : 4, el: document.createElement('div') };
      tile.el.className = 'tile spawn';
      place(tile, i);
      paint(tile);
      layer.appendChild(tile.el);
      cells[i] = tile;
    }

    // Cell indexes for each line, ordered so that index 0 is the side tiles slide towards.
    function lines(dir) {
      const out = [];
      for (let a = 0; a < 4; a++) {
        const line = [];
        for (let b = 0; b < 4; b++) {
          if (dir === 'left') line.push(a * 4 + b);
          if (dir === 'right') line.push(a * 4 + 3 - b);
          if (dir === 'up') line.push(b * 4 + a);
          if (dir === 'down') line.push((3 - b) * 4 + a);
        }
        out.push(line);
      }
      return out;
    }

    function canMove() {
      return cells.some((tile, i) => !tile
        || (i % 4 < 3 && cells[i + 1] && tile.value === cells[i + 1].value)
        || (i < 12 && cells[i + 4] && tile.value === cells[i + 4].value));
    }

    function move(dir) {
      if (over) return;
      const absorbed = [];
      const grown = [];
      let moved = false;
      lines(dir).forEach((line) => {
        const items = line.map((i) => cells[i]).filter(Boolean);
        const merged = [];
        for (let i = 0; i < items.length; i++) {
          const tile = items[i];
          const next = items[i + 1];
          merged.push(tile);
          if (next && next.value === tile.value) {
            tile.value *= 2;
            score += tile.value;
            grown.push(tile);
            place(next, line[merged.length - 1]);
            absorbed.push(next);
            i++;
          }
        }
        line.forEach((cell, i) => {
          const tile = merged[i] || null;
          if (cells[cell] !== tile) moved = true;
          cells[cell] = tile;
          if (tile) place(tile, cell);
        });
      });
      if (!moved) return;

      later(() => {
        absorbed.forEach((tile) => tile.el.remove());
        grown.forEach((tile) => {
          paint(tile);
          tile.el.classList.remove('pop');
          void tile.el.offsetWidth;
          tile.el.classList.add('pop');
        });
      }, SLIDE_MS);
      addTile();
      api.setScore(score);
      if (grown.length) sound.play('hit');
      if (!canMove()) {
        over = true;
        api.setInfo('No moves left');
        later(() => api.end(score), 800);
      }
    }

    function onKey(e) {
      if (!KEYS[e.key]) return;
      e.preventDefault();
      move(KEYS[e.key]);
    }
    function onTouchStart(e) {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (!touch) return;
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      touch = null;
    }
    window.addEventListener('keydown', onKey);
    boardEl.addEventListener('touchstart', onTouchStart, { passive: true });
    boardEl.addEventListener('touchmove', onTouchMove, { passive: false });

    addTile();
    addTile();
    api.setInfo('Use arrow keys or swipe');

    return () => {
      over = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  },
};
