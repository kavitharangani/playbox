import sound from '../sound.js';

const SHAPES = {
  circle: '<circle cx="50" cy="50" r="38"/>',
  square: '<rect x="15" y="15" width="70" height="70" rx="10"/>',
  triangle: '<path d="M50 12l40 72H10z"/>',
  star: '<path d="M50 8l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 39l30-4z"/>',
  heart: '<path d="M50 88S10 62 10 34a21 21 0 0 1 40-9 21 21 0 0 1 40 9c0 28-40 54-40 54z"/>',
  diamond: '<path d="M50 8l36 42-36 42-36-42z"/>',
};
const COLORS = { red: '#ff7b8a', orange: '#ffb454', green: '#6fd08c', blue: '#6cc4ff', purple: '#b9a0ff' };

export default {
  id: 'shapes',
  name: 'Shape Match',
  icon: '🔺',
  color: '#4fb0c6',
  age: 'child',
  category: 'Brain',
  tags: ['shapes', 'colours', 'colors', 'matching', 'learning', 'easy', 'kids', 'education'],
  description: 'Find the shape that looks exactly the same as the big one.',
  howTo: ['Look at the big shape at the top', 'Tap the one that matches, or press keys 1 to 4', '+10 for a match, plus a bonus for a streak. 45 seconds'],
  bots: [60, 120, 200, 300],
  mount(root, api) {
    const DURATION = 45000;
    root.innerHTML = `
      <div class="kid-game">
        <div class="time-bar"><i></i></div>
        <div class="kid-target"></div>
        <div class="kid-note" aria-live="polite">Find this one!</div>
        <div class="kid-options"></div>
      </div>`;
    const targetEl = root.querySelector('.kid-target');
    const noteEl = root.querySelector('.kid-note');
    const optionsEl = root.querySelector('.kid-options');
    const bar = root.querySelector('.time-bar i');

    const startedAt = Date.now();
    let score = 0, streak = 0, solved = 0, answer = 0, locked = false, timer = 0;

    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const shapeNames = Object.keys(SHAPES);
    const colorNames = Object.keys(COLORS);
    const shuffled = (list) => list.slice().sort(() => Math.random() - .5);
    const svg = ({ shape, color }) => `<svg viewBox="0 0 100 100" fill="${COLORS[color]}" aria-hidden="true">${SHAPES[shape]}</svg>`;

    function question() {
      const target = { shape: pick(shapeNames), color: pick(colorNames) };
      const hard = solved >= 6;
      const seen = new Set([`${target.shape}-${target.color}`]);
      const options = [target];
      while (options.length < 4) {
        // Later rounds use the same colour or shape, so looking closely matters more.
        const option = hard && Math.random() < .7
          ? (Math.random() < .5 ? { shape: target.shape, color: pick(colorNames) } : { shape: pick(shapeNames), color: target.color })
          : { shape: pick(shapeNames), color: pick(colorNames) };
        const id = `${option.shape}-${option.color}`;
        if (!seen.has(id)) {
          seen.add(id);
          options.push(option);
        }
      }
      const mixed = shuffled(options);
      answer = mixed.indexOf(target);
      targetEl.innerHTML = svg(target);
      targetEl.setAttribute('aria-label', `Find the ${target.color} ${target.shape}`);
      targetEl.setAttribute('role', 'img');
      optionsEl.innerHTML = mixed.map((option, i) => (
        `<button class="kid-option" type="button" data-i="${i}" aria-label="${option.color} ${option.shape}">${svg(option)}</button>`
      )).join('');
      locked = false;
    }

    function choose(i) {
      const btn = optionsEl.children[i];
      if (locked || !btn) return;
      if (i === answer) {
        locked = true;
        streak++;
        solved++;
        const bonus = Math.min(10, (streak - 1) * 2);
        score += 10 + bonus;
        api.setScore(score);
        btn.classList.add('right');
        noteEl.textContent = streak > 1 ? `Great! ${streak} in a row` : 'Great!';
        sound.play('score');
        timer = setTimeout(question, 450);
      } else {
        streak = 0;
        btn.classList.add('wrong');
        btn.disabled = true;
        noteEl.textContent = 'Not that one. Try again!';
        sound.play('bad');
      }
    }

    optionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.kid-option');
      if (btn) choose(Number(btn.dataset.i));
    });
    function onKey(e) {
      if (e.key >= '1' && e.key <= '4') choose(Number(e.key) - 1);
    }
    window.addEventListener('keydown', onKey);

    function tick() {
      const elapsed = Date.now() - startedAt;
      api.setInfo(`Time ${Math.max(0, Math.ceil((DURATION - elapsed) / 1000))}s`);
      bar.style.transform = `scaleX(${Math.max(0, 1 - elapsed / DURATION)})`;
      if (elapsed >= DURATION) api.end(score);
    }
    const clock = setInterval(tick, 200);
    question();
    tick();

    return () => {
      clearInterval(clock);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
