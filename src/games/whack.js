import sound from '../sound.js';

export default {
  id: 'whack',
  name: 'Whack-a-Mole',
  icon: '🔨',
  color: '#c77a52',
  age: 'child',
  category: 'Reflex',
  tags: ['speed', 'tap', 'timed', 'kids'],
  description: 'Thirty seconds. Hit every mole that pops up.',
  howTo: ['Tap a mole, or press keys 1 to 9', '+10 for a mole, +30 for a golden star', 'Moles get faster as time runs out'],
  bots: [100, 180, 260, 340],
  mount(root, api) {
    const DURATION = 30000;
    const MOLE = `<svg viewBox="0 0 100 100"><path d="M18 100V52a32 32 0 0 1 64 0v48z" fill="#a9744f"/><path d="M34 100V68a16 14 0 0 1 32 0v32z" fill="#d9ad85"/><circle cx="38" cy="46" r="6" fill="#12131a"/><circle cx="62" cy="46" r="6" fill="#12131a"/><circle cx="40" cy="44" r="2" fill="#fff"/><circle cx="64" cy="44" r="2" fill="#fff"/><ellipse cx="50" cy="60" rx="8" ry="6" fill="#3a2418"/><rect x="45" y="66" width="10" height="10" rx="2" fill="#fff8e7"/></svg>`;
    const STAR = `<svg viewBox="0 0 100 100"><path d="M50 8l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 39l30-4z" fill="#ffd24a" stroke="#fff3c4" stroke-width="4" stroke-linejoin="round"/><circle cx="40" cy="48" r="4.500" fill="#12131a"/><circle cx="60" cy="48" r="4.500" fill="#12131a"/><path d="M40 60q10 9 20 0" fill="none" stroke="#12131a" stroke-width="4" stroke-linecap="round"/></svg>`;
    root.innerHTML = '<div class="time-bar"><i></i></div><div class="whack"></div>';
    const grid = root.querySelector('.whack');
    const bar = root.querySelector('.time-bar i');
    const holes = [];
    for (let i = 0; i < 9; i++) {
      const btn = document.createElement('button');
      btn.className = 'hole';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Hole ${i + 1}`);
      btn.innerHTML = '<span class="mole" aria-hidden="true"></span>';
      btn.addEventListener('pointerdown', () => hit(i));
      btn.addEventListener('click', (e) => { if (e.detail === 0) hit(i); });
      grid.appendChild(btn);
      holes.push({ btn, mole: btn.firstElementChild, up: false, gold: false, timer: 0 });
    }

    const startedAt = Date.now();
    let score = 0, spawnTimer = 0, over = false;

    function hide(hole) {
      clearTimeout(hole.timer);
      hole.up = false;
      hole.gold = false;
      hole.btn.classList.remove('up', 'gold');
    }

    function spawn() {
      if (over) return;
      const elapsed = (Date.now() - startedAt) / 1000;
      const free = holes.filter((h) => !h.up);
      if (free.length) {
        const hole = free[Math.floor(Math.random() * free.length)];
        hole.up = true;
        hole.gold = Math.random() < 0.12;
        hole.mole.innerHTML = hole.gold ? STAR : MOLE;
        hole.btn.classList.add('up');
        hole.btn.classList.toggle('gold', hole.gold);
        hole.timer = setTimeout(() => hide(hole), Math.max(480, 950 - elapsed * 15));
      }
      spawnTimer = setTimeout(spawn, Math.max(280, 700 - elapsed * 14));
    }

    function hit(i) {
      const hole = holes[i];
      if (over || !hole.up) return;
      const points = hole.gold ? 30 : 10;
      score += points;
      api.setScore(score);
      sound.play(hole.gold ? 'score' : 'hit');
      hide(hole);
      hole.btn.classList.add('hit');
      setTimeout(() => hole.btn.classList.remove('hit'), 120);
      const float = document.createElement('span');
      float.className = 'float-score';
      float.setAttribute('aria-hidden', 'true');
      float.textContent = `+${points}`;
      hole.btn.appendChild(float);
      setTimeout(() => float.remove(), 600);
    }

    function onKey(e) {
      if (e.key >= '1' && e.key <= '9') hit(Number(e.key) - 1);
    }
    window.addEventListener('keydown', onKey);

    function tick() {
      const left = Math.ceil((DURATION - (Date.now() - startedAt)) / 1000);
      api.setInfo(`Time ${Math.max(0, left)}s`);
      bar.style.transform = `scaleX(${Math.max(0, 1 - (Date.now() - startedAt) / DURATION)})`;
      if (left <= 0) api.end(score);
    }
    const clock = setInterval(tick, 200);
    tick();
    spawn();

    return () => {
      over = true;
      clearInterval(clock);
      clearTimeout(spawnTimer);
      holes.forEach(hide);
      window.removeEventListener('keydown', onKey);
    };
  },
};
