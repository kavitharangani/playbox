import sound from '../sound.js';

export default {
  id: 'counting',
  name: 'Count With Me',
  icon: '🍎',
  color: '#e0b03f',
  age: 'child',
  category: 'Brain',
  tags: ['count', 'counting', 'numbers', 'maths', 'learning', 'easy', 'kids', 'education'],
  description: 'Count the pictures and tap the right number. No timer, no rush.',
  howTo: ['Count all the pictures on the screen', 'Tap the right number, or press keys 1 to 3', '+15 if you get it first time, +5 if you need another try'],
  bots: [40, 80, 110, 140],
  mount(root, api) {
    const ROUNDS = 10;
    const ITEMS = ['🍎', '🐟', '⭐', '🦋', '🌸', '🚗', '🐤', '🍓', '⚽', '🐢'];
    root.innerHTML = `
      <div class="kid-game">
        <div class="kid-note" aria-live="polite"></div>
        <div class="count-items"></div>
        <div class="kid-options three"></div>
      </div>`;
    const noteEl = root.querySelector('.kid-note');
    const itemsEl = root.querySelector('.count-items');
    const optionsEl = root.querySelector('.kid-options');

    const icons = ITEMS.slice().sort(() => Math.random() - .5);
    let round = 0, answer = 0, score = 0, firstTry = true, locked = false, timer = 0;

    function question() {
      round++;
      firstTry = true;
      locked = false;
      const top = Math.min(10, 3 + round);
      answer = 1 + Math.floor(Math.random() * top);
      const choices = new Set([answer]);
      while (choices.size < 3) {
        const other = answer + Math.floor(Math.random() * 7) - 3;
        if (other >= 1 && other <= 12) choices.add(other);
      }
      const icon = icons[(round - 1) % icons.length];
      itemsEl.innerHTML = Array.from({ length: answer }, (_, i) => `<span style="--i:${i}">${icon}</span>`).join('');
      itemsEl.setAttribute('role', 'img');
      itemsEl.setAttribute('aria-label', `${answer} pictures`);
      noteEl.textContent = 'How many can you count?';
      optionsEl.innerHTML = Array.from(choices).sort((a, b) => a - b)
        .map((n) => `<button class="kid-option number" type="button" data-n="${n}">${n}</button>`).join('');
      api.setInfo(`Round ${round} of ${ROUNDS}`);
    }

    function choose(btn) {
      if (locked || !btn || btn.disabled) return;
      if (Number(btn.dataset.n) === answer) {
        locked = true;
        score += firstTry ? 15 : 5;
        api.setScore(score);
        btn.classList.add('right');
        noteEl.textContent = firstTry ? 'Well done!' : 'You got it!';
        sound.play('score');
        timer = setTimeout(() => {
          if (round === ROUNDS) api.end(score);
          else question();
        }, 800);
      } else {
        firstTry = false;
        btn.classList.add('wrong');
        btn.disabled = true;
        noteEl.textContent = 'Count again. You can do it!';
        sound.play('bad');
      }
    }

    optionsEl.addEventListener('click', (e) => choose(e.target.closest('.kid-option')));
    function onKey(e) {
      if (e.key >= '1' && e.key <= '3') choose(optionsEl.children[Number(e.key) - 1]);
    }
    window.addEventListener('keydown', onKey);
    question();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
