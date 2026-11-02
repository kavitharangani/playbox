import sound from '../sound.js';

function makeMount({ SIZE, MINES, perSquare, winBonus }) {
  return function mount(root, api) {
    const TOTAL = SIZE * SIZE;
    root.innerHTML = `
      <div class="mines" style="--cols:${SIZE}">
        <button class="btn btn-small mines-mode" type="button"></button>
        <div class="mines-grid"></div>
      </div>`;
    const modeBtn = root.querySelector('.mines-mode');
    const grid = root.querySelector('.mines-grid');

    const cells = [];
    let flagMode = false, placed = false, over = false, longPressed = false;
    let opened = 0, flags = 0, score = 0, startedAt = 0, timer = 0, pressTimer = 0;

    const seconds = () => (startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0);

    function info() {
      api.setInfo(`Mines ${MINES - flags} · Time ${seconds()}s`);
    }
    const clock = setInterval(info, 500);

    function showMode() {
      modeBtn.textContent = flagMode ? '🚩 Flag mode: on' : '🚩 Flag mode: off';
      modeBtn.setAttribute('aria-pressed', flagMode);
    }

    function neighbours(i) {
      const out = [];
      const x = i % SIZE, y = Math.floor(i / SIZE);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx, ny = y + dy;
          if ((dx || dy) && nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) out.push(ny * SIZE + nx);
        }
      }
      return out;
    }

    // Mines are placed after the first tap, so that tap always opens a safe area.
    function placeMines(first) {
      const safe = new Set([first, ...neighbours(first)]);
      const pool = cells.map((_, i) => i).filter((i) => !safe.has(i));
      for (let k = 0; k < MINES; k++) {
        const [i] = pool.splice(Math.floor(Math.random() * pool.length), 1);
        cells[i].mine = true;
      }
      cells.forEach((cell, i) => {
        cell.near = neighbours(i).filter((n) => cells[n].mine).length;
      });
      placed = true;
      startedAt = Date.now();
    }

    function openOne(i, depth) {
      const cell = cells[i];
      cell.open = true;
      opened++;
      cell.el.classList.add('open', `n${cell.near}`);
      cell.el.style.animationDelay = `${depth * 35}ms`;
      cell.el.textContent = cell.near || '';
      cell.el.setAttribute('aria-label', `Square ${i + 1}, ${cell.near} nearby`);
    }

    function reveal(i) {
      const queue = [[i, 0]];
      const seen = new Set([i]);
      while (queue.length) {
        const [at, depth] = queue.shift();
        if (cells[at].flag) continue;
        openOne(at, depth);
        if (cells[at].near === 0) {
          neighbours(at).forEach((n) => {
            if (!seen.has(n) && !cells[n].open) {
              seen.add(n);
              queue.push([n, depth + 1]);
            }
          });
        }
      }
    }

    function lose(i) {
      over = true;
      cells.forEach((cell, n) => {
        if (!cell.mine) return;
        cell.el.classList.add('mine');
        cell.el.style.animationDelay = `${Math.abs(n - i) * 12}ms`;
        cell.el.textContent = '💣';
      });
      cells[i].el.classList.add('boom');
      sound.play('crash');
      timer = setTimeout(() => api.end(score), 1300);
    }

    function press(i) {
      const cell = cells[i];
      if (over || cell.open || cell.flag) return;
      if (!placed) placeMines(i);
      if (cell.mine) {
        lose(i);
        return;
      }
      reveal(i);
      score = opened * perSquare;
      sound.play('flip');
      if (opened === TOTAL - MINES) {
        over = true;
        score += winBonus + Math.max(0, winBonus - seconds() * 2);
        cells.forEach((c) => { if (c.mine) c.el.classList.add('safe-mine'); });
        sound.play('score');
        timer = setTimeout(() => api.end(score), 1000);
      }
      api.setScore(score);
      info();
    }

    function toggleFlag(i) {
      const cell = cells[i];
      if (over || cell.open) return;
      cell.flag = !cell.flag;
      flags += cell.flag ? 1 : -1;
      cell.el.textContent = cell.flag ? '🚩' : '';
      cell.el.classList.toggle('flag', cell.flag);
      sound.play('tap');
      info();
    }

    for (let i = 0; i < TOTAL; i++) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mine-cell';
      el.setAttribute('aria-label', `Square ${i + 1}`);
      el.addEventListener('click', () => {
        if (longPressed) return;
        if (flagMode) toggleFlag(i);
        else press(i);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!longPressed) toggleFlag(i);
      });
      el.addEventListener('pointerdown', (e) => {
        longPressed = false;
        if (e.pointerType !== 'touch') return;
        pressTimer = setTimeout(() => {
          longPressed = true;
          toggleFlag(i);
        }, 420);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => {
        el.addEventListener(name, () => clearTimeout(pressTimer));
      });
      grid.appendChild(el);
      cells.push({ el, mine: false, open: false, flag: false, near: 0 });
    }

    modeBtn.addEventListener('click', () => {
      flagMode = !flagMode;
      showMode();
    });
    function onKey(e) {
      if (e.key === 'f' || e.key === 'F') {
        flagMode = !flagMode;
        showMode();
      }
    }
    window.addEventListener('keydown', onKey);
    showMode();
    info();

    return () => {
      clearInterval(clock);
      clearTimeout(timer);
      clearTimeout(pressTimer);
      window.removeEventListener('keydown', onKey);
  };
  };
}

export default {
  id: 'mines',
  name: 'Minesweeper',
  icon: '💣',
  color: '#6b8ca8',
  age: 'junior',
  category: 'Puzzle',
  tags: ['mines', 'bombs', 'flags', 'logic', 'classic', 'grid'],
  description: 'Clear the board without touching one of the ten mines.',
  howTo: ['Tap a square to open it. Numbers count nearby mines', 'Flag with right-click, a long press or the Flag button', '+5 per square, plus a big bonus for a fast win'],
  bots: [80, 200, 450, 700],
  mount: makeMount({ SIZE: 9, MINES: 10, perSquare: 5, winBonus: 250 }),
};

export const expertMines = {
  id: 'minesexpert',
  art: 'mines',
  name: 'Expert Minesweeper',
  icon: '💣',
  color: '#4c6478',
  age: 'senior',
  category: 'Puzzle',
  tags: ['minesweeper', 'mines', 'bombs', 'flags', 'logic', 'expert', 'hard', 'grid'],
  description: 'A bigger board packed with 35 mines. One wrong tap ends it.',
  howTo: ['Tap a square to open it. Numbers count nearby mines', 'Flag with right-click, a long press or the Flag button', '+5 per square, and up to 2,000 more for a fast win'],
  bots: [150, 400, 700, 1800],
  mount: makeMount({ SIZE: 14, MINES: 35, perSquare: 5, winBonus: 1000 }),
};
