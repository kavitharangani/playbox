import sound from '../sound.js';

export default {
  id: 'snake',
  name: 'Snake',
  icon: '🐍',
  color: '#2f9e76',
  age: 'junior',
  category: 'Arcade',
  tags: ['classic', 'retro', 'keyboard', 'swipe'],
  description: 'Eat, grow and try not to bite your own tail.',
  howTo: ['Arrow keys or WASD to turn', 'On a phone, swipe or use the buttons', '+10 for every apple'],
  bots: [30, 80, 160, 300],
  mount(root, api) {
    const N = 20, CELL = 24, SIZE = N * CELL;
    root.innerHTML = `
      <canvas class="game-canvas" style="--r:1" aria-label="Snake game board"></canvas>
      <div class="dpad">
        <button class="up" data-d="up" aria-label="Up">▲</button>
        <button class="left" data-d="left" aria-label="Left">◀</button>
        <button class="down" data-d="down" aria-label="Down">▼</button>
        <button class="right" data-d="right" aria-label="Right">▶</button>
      </div>`;
    const canvas = root.querySelector('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.height = SIZE * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    const KEYS = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
    };
    let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    let from = snake.slice();
    let dir = DIRS.right;
    let queue = [];
    let food = placeFood();
    let sparks = [];
    let score = 0, acc = 0, last = null, raf = 0, timer = 0, shake = 0;
    let alive = true, stopped = false;
    let touch = null;

    function placeFood() {
      const free = [];
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
        }
      }
      return free.length ? free[Math.floor(Math.random() * free.length)] : null;
    }

    function turn(name) {
      const next = DIRS[name];
      const prev = queue.length ? queue[queue.length - 1] : dir;
      if (queue.length >= 2 || (next.x === -prev.x && next.y === -prev.y) || next === prev) return;
      queue.push(next);
    }

    function finish() {
      alive = false;
      shake = 1;
      sound.play('crash');
      timer = setTimeout(() => api.end(score), 600);
    }

    function step() {
      dir = queue.shift() || dir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const eats = food && head.x === food.x && head.y === food.y;
      const body = eats ? snake : snake.slice(0, -1);
      const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
      if (hitWall || body.some((s) => s.x === head.x && s.y === head.y)) {
        finish();
        return;
      }
      from = snake;
      snake = [head].concat(body);
      if (eats) {
        score += 10;
        api.setScore(score);
        sound.play('score');
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 50 + Math.random() * 110;
          sparks.push({
            x: (food.x + .5) * CELL, y: (food.y + .5) * CELL,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .4,
          });
        }
        food = placeFood();
        if (!food) finish();
      }
    }

    function drawApple(now) {
      const cx = (food.x + .5) * CELL, cy = (food.y + .5) * CELL;
      const r = CELL / 2 - 3 + Math.sin(now / 180) * 1.2;
      ctx.fillStyle = 'rgba(255,107,94,.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6b5e';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.arc(cx - r * .35, cy - r * .35, r * .22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7fd27a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r + 1);
      ctx.quadraticCurveTo(cx + 2, cy - r - 5, cx + 7, cy - r - 5);
      ctx.stroke();
    }

    function draw(now, t) {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - .5) * 10 * shake, (Math.random() - .5) * 10 * shake);

      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          ctx.fillStyle = (x + y) % 2 ? '#10121a' : '#141721';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
      if (food) drawApple(now);

      const points = snake.map((s, i) => {
        const p = from[i] || from[from.length - 1];
        return { x: (p.x + (s.x - p.x) * t + .5) * CELL, y: (p.y + (s.y - p.y) * t + .5) * CELL };
      });
      const trace = () => {
        ctx.beginPath();
        points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = alive ? '#2f9b5e' : '#a34a44';
      ctx.lineWidth = CELL - 3;
      trace();
      ctx.stroke();
      ctx.strokeStyle = alive ? '#6fd08c' : '#d9776f';
      ctx.lineWidth = CELL - 9;
      trace();
      ctx.stroke();

      const head = points[0];
      ctx.fillStyle = alive ? '#c9f27b' : '#ffb0a8';
      ctx.beginPath();
      ctx.arc(head.x, head.y, CELL / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      [-1, 1].forEach((side) => {
        const ex = head.x + dir.x * 4 - dir.y * 5 * side;
        const ey = head.y + dir.y * 4 + dir.x * 5 * side;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#12131a';
        ctx.beginPath();
        ctx.arc(ex + dir.x * 1.2, ey + dir.y * 1.2, 1.7, 0, Math.PI * 2);
        ctx.fill();
      });

      sparks.forEach((s) => {
        ctx.globalAlpha = Math.max(0, s.life / .4);
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function frame(now) {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min(now - last, 200);
      last = now;
      const interval = Math.max(70, 140 - (score / 10) * 3);
      if (alive) {
        acc += dt;
        while (acc >= interval && alive) {
          acc -= interval;
          step();
        }
      }
      sparks.forEach((s) => {
        s.x += s.vx * dt / 1000;
        s.y += s.vy * dt / 1000;
        s.life -= dt / 1000;
      });
      sparks = sparks.filter((s) => s.life > 0);
      shake = Math.max(0, shake - dt / 450);
      draw(now, alive ? acc / interval : 1);
      raf = requestAnimationFrame(frame);
    }

    function onKey(e) {
      if (!KEYS[e.key]) return;
      e.preventDefault();
      turn(KEYS[e.key]);
    }
    function onTouchStart(e) {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (!touch) return;
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      touch = null;
    }
    root.querySelectorAll('.dpad button').forEach((b) => {
      b.addEventListener('pointerdown', () => turn(b.dataset.d));
    });
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    api.setInfo('Use arrow keys or swipe');
    draw(0, 1);
    raf = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  },
};
