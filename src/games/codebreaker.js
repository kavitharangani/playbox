import sound from '../sound.js';

const COLORS = ['#ff7b8a', '#ffb454', '#ffe066', '#6fd08c', '#6cc4ff', '#b9a0ff', '#f0efe8'];
const LENGTH = 5, GUESSES = 10;

// Exact is the right colour in the right place. Near is the right colour in the wrong place.
function marks(secret, guess) {
  let exact = 0;
  const left = {};
  const rest = [];
  secret.forEach((s, i) => {
    if (s === guess[i]) exact++;
    else {
      left[s] = (left[s] || 0) + 1;
      rest.push(guess[i]);
    }
  });
  let near = 0;
  rest.forEach((g) => {
    if (left[g]) {
      left[g]--;
      near++;
    }
  });
  return { exact, near };
}

export default {
  id: 'codebreaker',
  name: 'Code Breaker',
  icon: '🔐',
  color: '#8f62c9',
  age: 'senior',
  category: 'Brain',
  tags: ['mastermind', 'logic', 'code', 'deduction', 'colours', 'colors', 'expert', 'hard', 'thinking'],
  description: 'Work out the secret five-colour code in ten guesses using only clues.',
  howTo: ['Tap colours or press keys 1 to 7. Enter checks, Backspace undoes', 'Green dot: right colour, right place. White dot: right colour, wrong place', '100 points a code, plus 20 per guess left. Colours can repeat'],
  bots: [200, 500, 900, 1400],
  mount(root, api) {
    root.innerHTML = `
      <div class="code">
        <div class="code-secret" aria-live="polite"></div>
        <div class="code-legend"><i class="exact"></i>Right place<i class="near"></i>Wrong place</div>
        <div class="code-rows"></div>
        <div class="code-palette"></div>
        <div class="code-actions">
          <button class="btn" type="button" data-act="undo">Undo</button>
          <button class="btn btn-primary" type="button" data-act="check">Check code</button>
        </div>
      </div>`;
    const statusEl = root.querySelector('.code-secret');
    const rowsEl = root.querySelector('.code-rows');
    const palette = root.querySelector('.code-palette');
    const checkBtn = root.querySelector('[data-act="check"]');

    palette.innerHTML = COLORS.map((color, i) => (
      `<button class="code-color" type="button" data-c="${i}" style="background:${color}" aria-label="Colour ${i + 1}">${i + 1}</button>`
    )).join('');

    let secret = [], history = [], current = [];
    let score = 0, solved = 0, locked = true, timer = 0;

    function pegHtml(value, fresh) {
      if (value === undefined) return '<span class="code-peg"></span>';
      return `<span class="code-peg${fresh ? ' set' : ''}" style="background:${COLORS[value]}">${value + 1}</span>`;
    }

    function marksHtml(result) {
      const dots = [];
      for (let i = 0; i < LENGTH; i++) {
        const cls = result && i < result.exact ? 'exact' : result && i < result.exact + result.near ? 'near' : '';
        dots.push(`<i class="${cls}"></i>`);
      }
      return `<span class="code-marks" role="img" aria-label="${result ? `${result.exact} exact, ${result.near} near` : 'not checked'}">${dots.join('')}</span>`;
    }

    function draw() {
      let html = history.map((h, i) => (
        `<div class="code-row"><span>${i + 1}</span>${h.guess.map((v) => pegHtml(v)).join('')}${marksHtml(h.result)}</div>`
      )).join('');
      if (!locked && history.length < GUESSES) {
        const pegs = Array.from({ length: LENGTH }, (_, i) => pegHtml(current[i], i === current.length - 1)).join('');
        html += `<div class="code-row active"><span>${history.length + 1}</span>${pegs}${marksHtml(null)}</div>`;
      }
      rowsEl.innerHTML = html;
      // Every earlier clue stays available, with the row being played kept in view.
      rowsEl.scrollTop = rowsEl.scrollHeight;
      checkBtn.disabled = locked || current.length < LENGTH;
      api.setInfo(`Code ${solved + 1} · Guess ${Math.min(history.length + 1, GUESSES)} of ${GUESSES}`);
    }

    function newCode() {
      secret = Array.from({ length: LENGTH }, () => Math.floor(Math.random() * COLORS.length));
      history = [];
      current = [];
      locked = false;
      statusEl.textContent = 'Crack the code';
      draw();
    }

    function add(color) {
      if (locked || current.length === LENGTH) return;
      current.push(color);
      sound.play('tap');
      draw();
    }

    function undo() {
      if (locked || !current.length) return;
      current.pop();
      draw();
    }

    function check() {
      if (locked || current.length < LENGTH) return;
      const result = marks(secret, current);
      history.push({ guess: current, result });
      current = [];
      if (result.exact === LENGTH) {
        locked = true;
        solved++;
        const left = GUESSES - history.length;
        score += 100 + left * 20;
        api.setScore(score);
        statusEl.textContent = `Cracked in ${history.length}!`;
        sound.play('score');
        draw();
        timer = setTimeout(newCode, 1400);
      } else if (history.length === GUESSES) {
        locked = true;
        statusEl.textContent = `Out of guesses. The code was ${secret.map((v) => v + 1).join(' ')}`;
        sound.play('bad');
        draw();
        timer = setTimeout(() => api.end(score), 2200);
      } else {
        sound.play('flip');
        draw();
      }
    }

    palette.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-color');
      if (btn) add(Number(btn.dataset.c));
    });
    root.querySelector('[data-act="undo"]').addEventListener('click', undo);
    checkBtn.addEventListener('click', check);
    function onKey(e) {
      if (e.key >= '1' && e.key <= '7') add(Number(e.key) - 1);
      else if (e.key === 'Backspace') undo();
      else if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    }
    window.addEventListener('keydown', onKey);
    newCode();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
