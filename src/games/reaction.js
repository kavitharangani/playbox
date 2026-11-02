import sound from '../sound.js';

export default {
  id: 'reaction',
  name: 'Reaction Rush',
  icon: '⚡',
  color: '#d6a92e',
  age: 'junior',
  category: 'Reflex',
  tags: ['speed', 'reflex', 'test', 'tap', 'timing', 'quick'],
  description: 'Wait for green, then tap as fast as you can. Five rounds.',
  howTo: ['Tap the pad, or press Space, the moment it turns green', 'Faster taps score more, up to 600 a round', 'Tap too early and that round scores nothing'],
  bots: [600, 1000, 1300, 1600],
  mount(root, api) {
    const ROUNDS = 5, TOO_SLOW = 1500;
    root.innerHTML = `
      <div class="react">
        <button class="react-pad" type="button"></button>
        <div class="react-dots" aria-hidden="true">${'<i></i>'.repeat(ROUNDS)}</div>
      </div>`;
    const pad = root.querySelector('.react-pad');
    const dots = Array.from(root.querySelectorAll('.react-dots i'));

    let state = 'idle', round = 0, score = 0, goAt = 0, timer = 0;

    function show(name, title, note) {
      pad.className = `react-pad ${name}`;
      pad.innerHTML = `<strong>${title}</strong>${note ? `<span>${note}</span>` : ''}`;
    }

    function startRound() {
      round++;
      state = 'waiting';
      show('wait', 'Wait for green…');
      api.setInfo(`Round ${round} of ${ROUNDS}`);
      timer = setTimeout(() => {
        state = 'go';
        goAt = performance.now();
        show('go', 'TAP!');
        sound.note(880, .1);
        timer = setTimeout(() => finishRound(0, 'bad', 'Too slow!', 'No points this round'), TOO_SLOW);
      }, 1000 + Math.random() * 2200);
    }

    function finishRound(points, dot, title, note) {
      clearTimeout(timer);
      state = 'idle';
      score += points;
      api.setScore(score);
      dots[round - 1].className = dot;
      show(dot === 'good' ? 'done' : 'early', title, note);
      timer = setTimeout(() => {
        if (round === ROUNDS) api.end(score);
        else startRound();
      }, 1200);
    }

    function press() {
      if (state === 'waiting') {
        sound.play('bad');
        finishRound(0, 'bad', 'Too early!', 'No points this round');
      } else if (state === 'go') {
        const ms = Math.round(performance.now() - goAt);
        const points = Math.max(0, 600 - ms);
        sound.play('score');
        finishRound(points, 'good', `${ms} ms`, `+${points} points`);
      }
    }

    pad.addEventListener('pointerdown', press);
    pad.addEventListener('click', (e) => { if (e.detail === 0) press(); });
    function onKey(e) {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) press();
    }
    window.addEventListener('keydown', onKey);
    startRound();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
