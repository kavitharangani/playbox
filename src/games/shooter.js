import sound from '../sound.js';

export default {
  id: 'shooter',
  name: 'Space Shooter',
  icon: '🚀',
  color: '#5a6fdc',
  age: 'junior',
  category: 'Shooting',
  tags: ['space', 'aliens', 'invaders', 'spaceship', 'gun', 'wedi', 'shoot', 'retro', 'arcade'],
  description: 'Your ship fires by itself. Blast the aliens before they get past you.',
  howTo: ['Drag on the board or use the arrow keys to move', '+10 for small aliens, +25 for the big ones', 'You have three lives. Do not let aliens get past'],
  bots: [150, 400, 800, 1500],
  mount(root, api) {
    const W = 360, H = 520, SHIP_Y = H - 48, SHIP_R = 15, SHOT_EVERY = .22;
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Space Shooter game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: .4 + Math.random() * 1.6,
    }));
    let ship = W / 2, shots = [], aliens = [], sparks = [], keys = {};
    let score = 0, lives = 3, elapsed = 0, shotIn = 0, spawnIn = .6, hurt = 0;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0, flash = 0;

    function info() {
      api.setInfo(`${'♥'.repeat(lives)}`);
    }

    function burst(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 140;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .5, color });
      }
    }

    function loseLife() {
      lives--;
      flash = 1;
      hurt = 1.2;
      info();
      sound.play('crash');
      if (lives <= 0) {
        alive = false;
        burst(ship, SHIP_Y, '#ffd24a', 30);
        timer = setTimeout(() => api.end(score), 800);
      }
    }

    function spawn() {
      const big = elapsed > 12 && Math.random() < .18;
      const r = big ? 20 : 13;
      aliens.push({
        x: r + Math.random() * (W - r * 2),
        y: -r,
        r,
        big,
        hp: big ? 3 : 1,
        speed: (big ? 45 : 70) + Math.min(120, elapsed * 2.2) + Math.random() * 25,
        phase: Math.random() * 6,
      });
    }

    function update(dt) {
      stars.forEach((s) => {
        s.y += s.s * 40 * dt;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      });
      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
      });
      sparks = sparks.filter((s) => s.life > 0);
      flash = Math.max(0, flash - dt * 3);
      if (!alive) return;

      elapsed += dt;
      hurt = Math.max(0, hurt - dt);
      if (keys.ArrowLeft || keys.a) ship -= 340 * dt;
      if (keys.ArrowRight || keys.d) ship += 340 * dt;
      ship = Math.max(SHIP_R, Math.min(W - SHIP_R, ship));

      shotIn -= dt;
      if (shotIn <= 0) {
        shotIn = SHOT_EVERY;
        shots.push({ x: ship, y: SHIP_Y - SHIP_R });
      }
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = Math.max(.32, .95 - elapsed * .012);
        spawn();
      }

      shots.forEach((s) => { s.y -= 460 * dt; });
      aliens.forEach((a) => {
        a.y += a.speed * dt;
        a.x += Math.sin(elapsed * 2.4 + a.phase) * 26 * dt;
      });

      shots = shots.filter((shot) => {
        const target = aliens.find((a) => a.hp > 0 && (a.x - shot.x) ** 2 + (a.y - shot.y) ** 2 < (a.r + 3) ** 2);
        if (!target) return shot.y > -10;
        target.hp--;
        if (target.hp === 0) {
          score += target.big ? 25 : 10;
          api.setScore(score);
          burst(target.x, target.y, target.big ? '#ff9d4d' : '#6fe39b', target.big ? 18 : 10);
          sound.play(target.big ? 'score' : 'hit');
        }
        return false;
      });

      aliens = aliens.filter((a) => {
        if (a.hp <= 0) return false;
        if (a.y - a.r > H) {
          if (alive) loseLife();
          return false;
        }
        if (hurt <= 0 && alive && (a.x - ship) ** 2 + (a.y - SHIP_Y) ** 2 < (a.r + SHIP_R) ** 2) {
          burst(a.x, a.y, '#ff6b5e', 14);
          loseLife();
          return false;
        }
        return true;
      });
    }

    function drawAlien(a) {
      ctx.fillStyle = a.big ? '#ff9d4d' : '#6fe39b';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, Math.PI, 0);
      ctx.lineTo(a.x + a.r, a.y + a.r * .6);
      for (let i = 3; i >= 0; i--) {
        const x = a.x - a.r + (a.r * 2 * i) / 3;
        ctx.lineTo(x, a.y + a.r * (i % 2 ? .6 : .25));
      }
      ctx.fill();
      ctx.fillStyle = '#12131a';
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(a.x + side * a.r * .38, a.y - a.r * .15, a.r * .2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawShip(now) {
      if (hurt > 0 && Math.floor(now / 90) % 2) return;
      ctx.save();
      ctx.translate(ship, SHIP_Y);
      ctx.fillStyle = '#ff9d4d';
      ctx.beginPath();
      ctx.moveTo(-6, SHIP_R);
      ctx.lineTo(0, SHIP_R + 8 + Math.sin(now / 40) * 4);
      ctx.lineTo(6, SHIP_R);
      ctx.fill();
      ctx.fillStyle = '#f4f2ea';
      ctx.beginPath();
      ctx.moveTo(0, -SHIP_R - 3);
      ctx.lineTo(SHIP_R, SHIP_R);
      ctx.lineTo(0, SHIP_R - 6);
      ctx.lineTo(-SHIP_R, SHIP_R);
      ctx.fill();
      ctx.fillStyle = '#6cc4ff';
      ctx.beginPath();
      ctx.arc(0, 1, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw(now) {
      ctx.fillStyle = '#0b0c16';
      ctx.fillRect(0, 0, W, H);
      stars.forEach((s) => {
        ctx.fillStyle = `rgba(255,255,255,${.25 + s.s * .35})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });
      ctx.fillStyle = '#ffd24a';
      shots.forEach((s) => ctx.fillRect(s.x - 2, s.y - 7, 4, 14));
      aliens.forEach(drawAlien);
      sparks.forEach((s) => {
        ctx.globalAlpha = Math.max(0, s.life / .5);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      if (alive) drawShip(now);
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
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function aim(e) {
      const rect = canvas.getBoundingClientRect();
      ship = ((e.clientX - rect.left) / rect.width) * W;
    }
    function onDown(e) {
      e.preventDefault();
      aim(e);
    }
    function onKey(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        e.preventDefault();
        keys[e.key] = e.type === 'keydown';
      }
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', aim);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    info();
    draw(0);
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
