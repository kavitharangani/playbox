import sound from '../sound.js';

const WORDS = `about after again always animal answer around because before better between bring change
choose city close could country dance different doctor during early earth enough every family father
follow forest friend garden great group happy house important island journey keep kitchen knowledge
language laugh learn letter light little market minute money morning mother mountain music nature
never number ocean often open orange people picture place planet please power question quick
rain reason remember river school second sentence simple sister small sound speak start story
strong student study summer teacher thought through together travel under village water weather
window winter wonder world write yellow young`.split(/\s+/);

export default {
  id: 'typing',
  name: 'Speed Typing',
  icon: '⌨️',
  color: '#4bab8a',
  age: 'junior',
  category: 'Reflex',
  tags: ['type', 'keyboard', 'words', 'wpm', 'english', 'adults', 'skill', 'timed'],
  description: 'Type as many words as you can in sixty seconds.',
  howTo: ['Type the highlighted word in the box', 'It moves on as soon as the word is right', 'Longer words score more. A real keyboard helps!'],
  bots: [150, 300, 500, 700],
  mount(root, api) {
    const DURATION = 60000;
    root.innerHTML = `
      <div class="typing">
        <div class="time-bar"><i></i></div>
        <div class="typing-words" aria-live="polite"></div>
        <input class="typing-input" type="text" aria-label="Type the highlighted word"
          autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Start typing…">
      </div>`;
    const wordsEl = root.querySelector('.typing-words');
    const input = root.querySelector('.typing-input');
    const bar = root.querySelector('.time-bar i');

    const queue = [];
    let startedAt = 0, done = 0, score = 0, ended = false;

    const refill = () => {
      while (queue.length < 6) {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        if (word !== queue[queue.length - 1]) queue.push(word);
      }
    };

    function showWords() {
      refill();
      const typed = input.value;
      const [current, ...rest] = queue;
      const right = current.startsWith(typed);
      wordsEl.innerHTML = `<span class="typing-current${right ? '' : ' wrong'}"><b>${right ? typed : ''}</b>${right ? current.slice(typed.length) : current}</span>${rest.slice(0, 4).map((w) => `<span>${w}</span>`).join('')}`;
      input.classList.toggle('wrong', !right);
    }

    function info(elapsed) {
      const minutes = Math.max(elapsed, 1000) / 60000;
      const left = Math.max(0, Math.ceil((DURATION - elapsed) / 1000));
      api.setInfo(`Time ${left}s · ${startedAt ? Math.round(done / minutes) : 0} words a minute`);
      bar.style.transform = `scaleX(${Math.max(0, 1 - elapsed / DURATION)})`;
    }

    input.addEventListener('input', () => {
      if (ended) return;
      if (!startedAt) startedAt = Date.now();
      input.value = input.value.toLowerCase().trim();
      if (input.value === queue[0]) {
        const word = queue.shift();
        done++;
        score += 5 + word.length;
        api.setScore(score);
        input.value = '';
        sound.play('hit');
      }
      showWords();
    });

    // The clock starts with the first letter, so nobody loses time finding the box.
    function tick() {
      const elapsed = startedAt ? Date.now() - startedAt : 0;
      info(elapsed);
      if (elapsed >= DURATION) {
        ended = true;
        input.disabled = true;
        api.end(score);
      }
    }
    const clock = setInterval(tick, 200);
    showWords();
    tick();
    input.focus({ preventScroll: true });

    return () => {
      ended = true;
      clearInterval(clock);
    };
  },
};
