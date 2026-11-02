import sound from '../sound.js';

export default {
  id: 'math',
  name: 'Quick Math',
  icon: '➗',
  color: '#2f9fbd',
  age: 'child',
  category: 'Brain',
  tags: ['numbers', 'quiz', 'timed', 'education', 'maths', 'kids'],
  description: 'Sixty seconds of sums. How far can your streak go?',
  howTo: ['Tap the right answer, or press keys 1 to 4', '+10 for correct, plus a streak bonus', '-5 for a wrong answer'],
  bots: [60, 150, 280, 450],
  mount(root, api) {
    const DURATION = 60000;
    root.innerHTML = `
      <div class="math">
        <div class="time-bar"><i></i></div>
        <div class="math-q" aria-live="polite"></div>
        <div class="math-answers"></div>
        <div class="math-feedback" aria-live="polite"></div>
      </div>`;
    const qEl = root.querySelector('.math-q');
    const answersEl = root.querySelector('.math-answers');
    const feedbackEl = root.querySelector('.math-feedback');
    const bar = root.querySelector('.time-bar i');

    function replay(el, name) {
      el.classList.remove(name);
      void el.offsetWidth;
      el.classList.add(name);
    }

    const startedAt = Date.now();
    let score = 0, streak = 0, solved = 0, answer = 0, options = [];

    const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

    function question() {
      const level = 1 + Math.floor(solved / 5);
      const top = 8 + level * 6;
      const kind = rand(0, level >= 2 ? 2 : 1);
      let a, b, text;
      if (kind === 0) {
        a = rand(2, top); b = rand(2, top);
        answer = a + b; text = `${a} + ${b}`;
      } else if (kind === 1) {
        a = rand(2, top); b = rand(1, a);
        answer = a - b; text = `${a} − ${b}`;
      } else {
        a = rand(2, 3 + level); b = rand(2, 9);
        answer = a * b; text = `${a} × ${b}`;
      }
      const set = new Set([answer]);
      while (set.size < 4) {
        const wrong = answer + rand(-10, 10);
        if (wrong >= 0) set.add(wrong);
      }
      options = Array.from(set).sort(() => Math.random() - 0.5);
      qEl.textContent = `${text} = ?`;
      answersEl.innerHTML = options
        .map((v, i) => `<button type="button" data-i="${i}"><small>${i + 1}</small>${v}</button>`)
        .join('');
    }

    function choose(i) {
      if (options[i] === undefined) return;
      if (options[i] === answer) {
        streak++;
        solved++;
        const bonus = Math.min(10, (streak - 1) * 2);
        score += 10 + bonus;
        feedbackEl.className = 'math-feedback good';
        feedbackEl.textContent = bonus ? `Correct! Streak ×${streak}, +${10 + bonus}` : 'Correct! +10';
        sound.play('score');
        replay(qEl, 'slide');
      } else {
        sound.play('bad');
        replay(qEl, 'shake');
        streak = 0;
        score = Math.max(0, score - 5);
        feedbackEl.className = 'math-feedback bad';
        feedbackEl.textContent = `It was ${answer}. -5`;
      }
      api.setScore(score);
      question();
    }

    answersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) choose(Number(btn.dataset.i));
    });
    function onKey(e) {
      if (e.key >= '1' && e.key <= '4') choose(Number(e.key) - 1);
    }
    window.addEventListener('keydown', onKey);

    function tick() {
      const left = Math.ceil((DURATION - (Date.now() - startedAt)) / 1000);
      api.setInfo(`Time ${Math.max(0, left)}s`);
      bar.style.transform = `scaleX(${Math.max(0, 1 - (Date.now() - startedAt) / DURATION)})`;
      if (left <= 0) api.end(score);
    }
    const clock = setInterval(tick, 200);
    question();
    tick();

    return () => {
      clearInterval(clock);
      window.removeEventListener('keydown', onKey);
    };
  },
};
