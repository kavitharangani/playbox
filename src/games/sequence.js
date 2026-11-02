import sound from '../sound.js';

export default {
  id: 'sequence',
  name: 'Color Sequence',
  icon: '🚥',
  color: '#9b6fd6',
  age: 'child',
  category: 'Brain',
  tags: ['simon', 'memory', 'pattern', 'colours', 'colors', 'sound', 'kids'],
  description: 'Watch the lights, then repeat the pattern as it grows.',
  howTo: ['Watch the pads light up', 'Tap them in the same order, or press keys 1 to 4', 'Each finished round scores 10 × its length'],
  bots: [60, 150, 280, 450],
  mount(root, api) {
    const NOTES = [330, 415, 494, 659];
    root.innerHTML = `
      <div class="seq">
        <div class="seq-status" aria-live="polite"></div>
        <div class="seq-pads">
          ${NOTES.map((_, i) => `<button class="seq-pad seq-${i}" type="button" data-i="${i}" aria-label="Pad ${i + 1}"><span>${i + 1}</span></button>`).join('')}
        </div>
      </div>`;
    const statusEl = root.querySelector('.seq-status');
    const padsEl = root.querySelector('.seq-pads');
    const pads = Array.from(root.querySelectorAll('.seq-pad'));
    const timers = new Set();

    const sequence = [];
    let position = 0, score = 0, accepting = false;

    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    }

    function flash(i, ms) {
      pads[i].classList.add('lit');
      sound.note(NOTES[i], ms / 1000);
      later(() => pads[i].classList.remove('lit'), ms);
    }

    function nextRound() {
      sequence.push(Math.floor(Math.random() * 4));
      position = 0;
      accepting = false;
      statusEl.textContent = 'Watch…';
      api.setInfo(`Length ${sequence.length}`);
      const step = Math.max(320, 640 - sequence.length * 28);
      sequence.forEach((pad, i) => later(() => flash(pad, step * .65), 400 + i * step));
      later(() => {
        accepting = true;
        statusEl.textContent = 'Your turn';
      }, 400 + sequence.length * step);
    }

    function press(i) {
      if (!accepting) return;
      flash(i, 180);
      if (i !== sequence[position]) {
        accepting = false;
        statusEl.textContent = 'Wrong pad!';
        padsEl.classList.add('wrong');
        sound.play('bad');
        later(() => api.end(score), 800);
        return;
      }
      position++;
      if (position === sequence.length) {
        accepting = false;
        score += 10 * sequence.length;
        api.setScore(score);
        statusEl.textContent = 'Nice!';
        later(nextRound, 800);
      }
    }

    padsEl.addEventListener('click', (e) => {
      const pad = e.target.closest('.seq-pad');
      if (pad) press(Number(pad.dataset.i));
    });
    function onKey(e) {
      if (e.key >= '1' && e.key <= '4') press(Number(e.key) - 1);
    }
    window.addEventListener('keydown', onKey);
    nextRound();

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  },
};
