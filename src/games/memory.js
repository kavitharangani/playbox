import sound from '../sound.js';

export default {
  id: 'memory',
  name: 'Memory Match',
  icon: '🃏',
  color: '#6f7ff0',
  age: 'child',
  category: 'Brain',
  tags: ['cards', 'pairs', 'concentration', 'kids'],
  description: 'Flip the cards and find all eight pairs.',
  howTo: ['Tap two cards to flip them', '+100 for a pair, -10 for a miss', 'Finish fast for a time bonus of up to 300'],
  bots: [500, 800, 950, 1050],
  mount(root, api) {
    const SYMBOLS = ['🍎', '🚀', '🐘', '🌙', '⚽', '🎸', '🌵', '🍕'];
    const deck = SYMBOLS.concat(SYMBOLS);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    root.innerHTML = '<div class="memory"></div>';
    const grid = root.firstElementChild;
    const cards = deck.map((symbol, i) => {
      const btn = document.createElement('button');
      btn.className = 'mem-card';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Card ${i + 1}, hidden`);
      btn.innerHTML = `<span class="mem-inner" aria-hidden="true"><span class="mem-face mem-back"></span><span class="mem-face mem-front">${symbol}</span></span>`;
      btn.addEventListener('click', () => flip(i));
      grid.appendChild(btn);
      return btn;
    });

    const startedAt = Date.now();
    let open = [], locked = false, pairs = 0, moves = 0, score = 0, timer = 0;

    const seconds = () => Math.floor((Date.now() - startedAt) / 1000);
    function info() { api.setInfo(`Moves ${moves} · Time ${seconds()}s`); }
    const clock = setInterval(info, 500);

    function show(i, visible) {
      cards[i].classList.toggle('open', visible);
      cards[i].setAttribute('aria-label', visible ? `Card ${i + 1}, ${deck[i]}` : `Card ${i + 1}, hidden`);
    }

    function flip(i) {
      if (locked || open.includes(i) || cards[i].classList.contains('done')) return;
      show(i, true);
      sound.play('flip');
      open.push(i);
      if (open.length < 2) return;
      moves++;
      const [a, b] = open;
      if (deck[a] === deck[b]) {
        cards[a].classList.add('done');
        cards[b].classList.add('done');
        open = [];
        pairs++;
        score += 100;
        api.setScore(score);
        sound.play('score');
        if (pairs === SYMBOLS.length) {
          score += Math.max(0, 300 - seconds() * 5);
          api.setScore(score);
          locked = true;
          timer = setTimeout(() => api.end(score), 500);
        }
      } else {
        locked = true;
        score = Math.max(0, score - 10);
        api.setScore(score);
        cards[a].classList.add('miss');
        cards[b].classList.add('miss');
        timer = setTimeout(() => {
          cards[a].classList.remove('miss');
          cards[b].classList.remove('miss');
          show(a, false);
          show(b, false);
          open = [];
          locked = false;
        }, 750);
      }
      info();
    }

    info();

    return () => {
      clearInterval(clock);
      clearTimeout(timer);
    };
  },
};
