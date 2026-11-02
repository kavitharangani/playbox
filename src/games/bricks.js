import sound from '../sound.js';

export default {
  id: 'bricks',
  name: 'Brick Breaker',
  icon: '🧱',
  color: '#d3624e',
  age: 'junior',
  category: 'Arcade',
  tags: ['breakout', 'ball', 'paddle', 'retro', 'classic'],
  description: 'Bounce the ball and smash every brick. Three lives.',
  howTo: ['Drag on the board or use the arrow keys', 'Higher bricks are worth more points', 'Clear the board to reach a faster level'],
  bots: [200, 500, 1000, 2000],
  mount(root, api) {
    const W = 360, H = 480, COLS = 7, ROWS = 5;
    const PADDLE_W = 76, PADDLE_H = 12, PADDLE_Y = H - 30, BALL_R = 7;
    const COLORS = ['#ff6b5e', '#ff9d4d', '#ffd24a', '#6fd08c', '#6cc4ff'];
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Brick Breaker game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    let paddle = W / 2, ball = { x: 0, y: 0, vx: 0, vy: 0 };
    let bricks = [], sparks = [], keys = {};
    let score = 0, lives = 3, level = 1, waiting = 1.2;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0, flash = 0;

    function buildLevel() {
      const gap = 4, side = 12;
      const w = (W - side * 2 - gap * (COLS - 1)) / COLS;
      bricks = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          bricks.push({ x: side + col * (w + gap), y: 44 + row * 22, w, h: 18, row });
        }
      }
    }

    function info() {
      api.setInfo(`Level ${level} · ${'♥'.repeat(lives)}`);
    }

    function launch() {
      if (waiting <= 0 || !alive) return;
      waiting = 0;
      const speed = 250 + level * 30;
      const angle = (Math.random() - .5) * .9;
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
    }

    function burst(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 110;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .45, color });
      }
    }

    function advance(dt) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

      const px = paddle - PADDLE_W / 2;
      if (ball.vy > 0 && ball.y + BALL_R >= PADDLE_Y && ball.y - BALL_R <= PADDLE_Y + PADDLE_H
        && ball.x >= px - BALL_R && ball.x <= px + PADDLE_W + BALL_R) {
        const speed = Math.hypot(ball.vx, ball.vy);
        const offset = Math.max(-1, Math.min(1, (ball.x - paddle) / (PADDLE_W / 2)));
        ball.vx = speed * Math.sin(offset * 1.05);
        ball.vy = -speed * Math.cos(offset * 1.05);
        ball.y = PADDLE_Y - BALL_R;
        sound.play('tap');
      }

      const hit = bricks.find((b) => {
        const cx = Math.max(b.x, Math.min(ball.x, b.x + b.w));
        const cy = Math.max(b.y, Math.min(ball.y, b.y + b.h));
        return (ball.x - cx) ** 2 + (ball.y - cy) ** 2 < BALL_R ** 2;
      });
      if (hit) {
        const overlapX = Math.min(ball.x + BALL_R - hit.x, hit.x + hit.w - ball.x + BALL_R);
        const overlapY = Math.min(ball.y + BALL_R - hit.y, hit.y + hit.h - ball.y + BALL_R);
        if (overlapX < overlapY) ball.vx = -ball.vx;
        else ball.vy = -ball.vy;
        bricks = bricks.filter((b) => b !== hit);
        score += (ROWS - hit.row) * 10;
        api.setScore(score);
        burst(hit.x + hit.w / 2, hit.y + hit.h / 2, COLORS[hit.row]);
        sound.play('hit');
        if (!bricks.length) {
          level++;
          buildLevel();
          waiting = 1.2;
          info();
          sound.play('score');
        }
      }

      if (ball.y - BALL_R > H) {
        lives--;
        flash = 1;
        info();
        sound.play('crash');
        if (lives <= 0) {
          alive = false;
          timer = setTimeout(() => api.end(score), 600);
        } else {
          waiting = 1.2;
        }
      }
    }

    function update(dt) {
      if (keys.ArrowLeft || keys.a) paddle -= 430 * dt;
      if (keys.ArrowRight || keys.d) paddle += 430 * dt;
      paddle = Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, paddle));
      if (alive) {
        if (waiting > 0) {
          ball.x = paddle;
          ball.y = PADDLE_Y - BALL_R;
          waiting -= dt;
          if (waiting <= 0) {
            waiting = .001;
            launch();
          }
        } else {
          for (let i = 0; i < 4 && alive && waiting <= 0; i++) advance(dt / 4);
        }
      }
      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 260 * dt;
        s.life -= dt;
      });
      sparks = sparks.filter((s) => s.life > 0);
      flash = Math.max(0, flash - dt * 3);
    }

    function pill(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.fill();
    }

    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#191b2c');
      sky.addColorStop(1, '#0c0d13');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      bricks.forEach((b) => {
        pill(b.x, b.y, b.w, b.h, 4, COLORS[b.row]);
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.fillRect(b.x + 3, b.y + 2, b.w - 6, 3);
      });
      sparks.forEach((s) => {
        ctx.globalAlpha = Math.max(0, s.life / .45);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;

      pill(paddle - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H, 6, '#f4f2ea');
      if (alive) {
        ctx.fillStyle = 'rgba(255,210,74,.25)';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }
      if (alive && waiting > 0) {
        ctx.fillStyle = '#f4f2ea';
        ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${level}`, W / 2, H / 2 + 20);
      }
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,90,80,${flash * .35})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function frame(now) {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 1 / 30);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function aim(e) {
      const rect = canvas.getBoundingClientRect();
      paddle = ((e.clientX - rect.left) / rect.width) * W;
    }
    function onDown(e) {
      e.preventDefault();
      aim(e);
      launch();
    }
    function onKey(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        e.preventDefault();
        keys[e.key] = e.type === 'keydown';
      } else if (e.code === 'Space' && e.type === 'keydown') {
        e.preventDefault();
        launch();
      }
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', aim);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    buildLevel();
    info();
    draw();
    raf = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  },
};
