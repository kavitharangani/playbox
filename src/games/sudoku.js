import sound from '../sound.js';

const shuffled = (list) => list.slice().sort(() => Math.random() - .5);

function makeSolution() {
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const lines = () => shuffled([0, 1, 2]).flatMap((band) => shuffled([0, 1, 2]).map((n) => band * 3 + n));
  const rows = lines();
  const cols = lines();
  return rows.flatMap((r) => cols.map((c) => digits[(r * 3 + Math.floor(r / 3) + c) % 9]));
}

function fits(grid, i, n) {
  const r = Math.floor(i / 9), c = i % 9;
  const boxR = r - (r % 3), boxC = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (grid[r * 9 + k] === n || grid[k * 9 + c] === n) return false;
    if (grid[(boxR + Math.floor(k / 3)) * 9 + boxC + (k % 3)] === n) return false;
  }
  return true;
}

// Counts solutions up to two, which is all that is needed to prove a puzzle has only one answer.
function countSolutions(grid) {
  // Trying the square with the fewest options first keeps this fast on very empty grids.
  let at = -1, options = null;
  for (let i = 0; i < 81 && (!options || options.length > 1); i++) {
    if (grid[i]) continue;
    const fitting = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => fits(grid, i, n));
    if (!options || fitting.length < options.length) {
      at = i;
      options = fitting;
    }
  }
  if (at < 0) return 1;
  let total = 0;
  for (let k = 0; k < options.length && total < 2; k++) {
    grid[at] = options[k];
    total += countSolutions(grid);
    grid[at] = 0;
  }
  return total;
}

function makePuzzle(solution, blanks) {
  const puzzle = solution.slice();
  let removed = 0;
  shuffled(puzzle.map((_, i) => i)).forEach((i) => {
    if (removed === blanks) return;
    const value = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle.slice()) === 1) removed++;
    else puzzle[i] = value;
  });
  return puzzle;
}

function makeMount({ blanks, winBonus, maxMistakes }) {
  return function mount(root, api) {
    const solution = makeSolution();
    const puzzle = makePuzzle(solution, blanks);
    root.innerHTML = `
      <div class="sudoku">
        <div class="sudoku-grid"></div>
        <div class="sudoku-pad"></div>
      </div>`;
    const grid = root.querySelector('.sudoku-grid');
    const pad = root.querySelector('.sudoku-pad');

    const startedAt = Date.now();
    let selected = puzzle.indexOf(0), score = 0, mistakes = 0, over = false, timer = 0;

    const cells = puzzle.map((value, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sudoku-cell${value ? ' given' : ''}${i % 9 === 2 || i % 9 === 5 ? ' edge-r' : ''}${Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5 ? ' edge-b' : ''}`;
      btn.textContent = value || '';
      btn.addEventListener('click', () => select(i));
      grid.appendChild(btn);
      return btn;
    });
    const digitBtns = {};
    for (let n = 1; n <= 9; n++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sudoku-key';
      btn.textContent = n;
      btn.addEventListener('click', () => enter(n));
      pad.appendChild(btn);
      digitBtns[n] = btn;
    }

    function info() {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      api.setInfo(`Time ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · Mistakes ${mistakes}${maxMistakes ? ` of ${maxMistakes}` : ''}`);
    }
    const clock = setInterval(info, 500);

    function refresh() {
      const value = puzzle[selected];
      cells.forEach((cell, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        const sr = Math.floor(selected / 9), sc = selected % 9;
        const peer = r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3));
        cell.classList.toggle('selected', i === selected);
        cell.classList.toggle('peer', peer && i !== selected);
        cell.classList.toggle('same', !!value && puzzle[i] === value && i !== selected);
        cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${puzzle[i] || 'empty'}`);
      });
      for (let n = 1; n <= 9; n++) {
        digitBtns[n].disabled = puzzle.filter((v) => v === n).length === 9;
      }
    }

    function select(i) {
      selected = i;
      refresh();
    }

    function enter(n) {
      if (over || puzzle[selected] !== 0) return;
      const cell = cells[selected];
      if (solution[selected] === n) {
        puzzle[selected] = n;
        cell.textContent = n;
        cell.classList.add('filled');
        score += 10;
        sound.play('flip');
        if (!puzzle.includes(0)) {
          over = true;
          const secs = Math.floor((Date.now() - startedAt) / 1000);
          score += winBonus + Math.max(0, winBonus - secs);
          sound.play('score');
          grid.classList.add('solved');
          timer = setTimeout(() => api.end(score), 1200);
        }
        const next = puzzle.indexOf(0, selected);
        if (next >= 0) selected = next;
        else if (puzzle.includes(0)) selected = puzzle.indexOf(0);
      } else {
        mistakes++;
        score = Math.max(0, score - 10);
        cell.classList.remove('oops');
        void cell.offsetWidth;
        cell.classList.add('oops');
        sound.play('bad');
        if (mistakes === maxMistakes) {
          over = true;
          timer = setTimeout(() => api.end(score), 900);
        }
      }
      api.setScore(score);
      info();
      refresh();
    }

    function onKey(e) {
      if (e.key >= '1' && e.key <= '9') {
        enter(Number(e.key));
        return;
      }
      const move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!move) return;
      e.preventDefault();
      const next = selected + move;
      const sameRow = Math.abs(move) === 9 || Math.floor(next / 9) === Math.floor(selected / 9);
      if (next >= 0 && next < 81 && sameRow) select(next);
    }
    window.addEventListener('keydown', onKey);
    info();
    refresh();

    return () => {
      clearInterval(clock);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
  };
  };
}

export default {
  id: 'sudoku',
  name: 'Sudoku',
  icon: '🧩',
  color: '#5f7fb8',
  age: 'junior',
  category: 'Puzzle',
  tags: ['numbers', 'logic', 'grid', 'classic', 'adults', 'thinking', 'calm'],
  description: 'Fill the grid so every row, column and box holds 1 to 9.',
  howTo: ['Pick a square, then tap a number or use your keyboard', '+10 for each correct number, -10 for a mistake', 'Finish for 500 points, plus a bonus for being quick'],
  bots: [200, 500, 900, 1200],
  mount: makeMount({ blanks: 40, winBonus: 500, maxMistakes: 0 }),
};

export const expertSudoku = {
  id: 'sudokuexpert',
  art: 'sudoku',
  name: 'Expert Sudoku',
  icon: '🧩',
  color: '#46618f',
  age: 'senior',
  category: 'Puzzle',
  tags: ['sudoku', 'numbers', 'logic', 'grid', 'expert', 'hard', 'thinking'],
  description: 'Far fewer starting numbers, and three mistakes ends the game.',
  howTo: ['Pick a square, then tap a number or use your keyboard', '+10 for each correct number, -10 for a mistake', 'Three mistakes ends it. Finish for 1,000 plus a speed bonus'],
  bots: [300, 800, 1500, 1900],
  mount: makeMount({ blanks: 54, winBonus: 1000, maxMistakes: 3 }),
};
