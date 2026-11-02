import sound from '../sound.js';

const WORDS = {
  Animal: ['ELEPHANT', 'LEOPARD', 'PEACOCK', 'MONKEY', 'TURTLE', 'DOLPHIN', 'GIRAFFE', 'PENGUIN'],
  Fruit: ['MANGO', 'PAPAYA', 'BANANA', 'PINEAPPLE', 'COCONUT', 'ORANGE', 'AVOCADO', 'GRAPES'],
  Country: ['INDIA', 'JAPAN', 'BRAZIL', 'CANADA', 'FRANCE', 'EGYPT', 'NORWAY', 'MEXICO'],
  Sport: ['CRICKET', 'FOOTBALL', 'TENNIS', 'VOLLEYBALL', 'RUGBY', 'CHESS', 'SWIMMING', 'BASKETBALL'],
  Transport: ['TRAIN', 'BICYCLE', 'ROCKET', 'AIRPLANE', 'SUBMARINE', 'TRACTOR', 'SCOOTER', 'HELICOPTER'],
};

export default {
  id: 'wordguess',
  name: 'Word Guess',
  icon: '🔤',
  color: '#c9a03f',
  age: 'junior',
  category: 'Brain',
  tags: ['hangman', 'words', 'letters', 'spelling', 'english', 'education', 'kids'],
  description: 'Guess the hidden word one letter at a time before your hearts run out.',
  howTo: ['Tap letters or use your keyboard', 'You lose a heart for each wrong letter', '50 points a word, plus 10 for every heart left'],
  bots: [60, 180, 350, 600],
  mount(root, api) {
    const MAX_HEARTS = 6;
    const pool = Object.entries(WORDS)
      .flatMap(([hint, words]) => words.map((word) => ({ hint, word })))
      .sort(() => Math.random() - .5);
    root.innerHTML = `
      <div class="word">
        <div class="word-hint"></div>
        <div class="word-letters" aria-live="polite"></div>
        <div class="word-hearts" aria-hidden="true"></div>
        <div class="word-keys"></div>
      </div>`;
    const hintEl = root.querySelector('.word-hint');
    const lettersEl = root.querySelector('.word-letters');
    const heartsEl = root.querySelector('.word-hearts');
    const keysEl = root.querySelector('.word-keys');

    const keys = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'word-key';
      btn.textContent = letter;
      btn.addEventListener('click', () => guess(letter));
      keysEl.appendChild(btn);
      keys[letter] = btn;
    });

    let current = null, used = new Set(), hearts = MAX_HEARTS;
    let score = 0, round = 0, locked = true, timer = 0;

    function drawHearts() {
      heartsEl.innerHTML = Array.from({ length: MAX_HEARTS }, (_, i) => `<span class="${i < hearts ? '' : 'lost'}">♥</span>`).join('');
    }

    function drawLetters(revealAll) {
      lettersEl.innerHTML = current.word.split('').map((letter) => {
        const shown = used.has(letter);
        const cls = shown ? 'hit' : revealAll ? 'missed' : '';
        return `<span class="word-letter ${cls}">${shown || revealAll ? letter : ''}</span>`;
      }).join('');
      lettersEl.setAttribute('aria-label', current.word.split('').map((l) => (used.has(l) ? l : 'blank')).join(' '));
    }

    function nextWord() {
      if (round === pool.length) {
        api.end(score);
        return;
      }
      current = pool[round];
      round++;
      used = new Set();
      hearts = MAX_HEARTS;
      Object.values(keys).forEach((btn) => {
        btn.disabled = false;
        btn.className = 'word-key';
      });
      hintEl.textContent = current.hint;
      drawLetters(false);
      drawHearts();
      api.setInfo(`Word ${round}`);
      locked = false;
    }

    function guess(letter) {
      if (locked || used.has(letter)) return;
      used.add(letter);
      keys[letter].disabled = true;
      if (current.word.includes(letter)) {
        keys[letter].classList.add('right');
        drawLetters(false);
        sound.play('flip');
        if (current.word.split('').every((l) => used.has(l))) {
          locked = true;
          score += 50 + hearts * 10;
          api.setScore(score);
          sound.play('score');
          lettersEl.classList.remove('solved');
          void lettersEl.offsetWidth;
          lettersEl.classList.add('solved');
          timer = setTimeout(nextWord, 1000);
        }
        return;
      }
      keys[letter].classList.add('wrong');
      hearts--;
      drawHearts();
      sound.play('bad');
      if (hearts === 0) {
        locked = true;
        drawLetters(true);
        timer = setTimeout(() => api.end(score), 1500);
      }
    }

    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const letter = e.key.toUpperCase();
      if (keys[letter]) guess(letter);
    }
    window.addEventListener('keydown', onKey);
    nextWord();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
