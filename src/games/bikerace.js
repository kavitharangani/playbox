import sound from '../sound.js';

export default {
  id: 'bikerace',
  name: 'Bike Rush',
  icon: '🏍️',
  color: '#dd8339',
  age: 'junior',
  category: 'Racing',
  tags: ['bike', 'motorbike', 'motorcycle', 'race', 'racing', 'jump', 'tap', 'one button', 'endless'],
  description: 'Ride flat out and jump the cones, barrels and tyres in your way.',
  howTo: ['Tap, click or press Space to jump', 'Coins float above the obstacles, +20 each', 'The bike keeps getting faster. One crash ends the ride'],
  bots: [200, 600, 1200, 2200],
  mount(root, api) {
    const W = 480, H = 300, GROUND = H - 46, BIKE_X = 96, GRAVITY = 1750, JUMP = -640;
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Bike Rush game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#2a2355');
    sky.addColorStop(.6, '#b1527d');
    sky.addColorStop(1, '#f6a15a');
    const KINDS = {
      cone: { w: 20, h: 26 },
      barrel: { w: 28, h: 38 },
      tyres: { w: 30, h: 44 },
    };

    let rise = 0, vy = 0, onGround = true, buffered = 0;
    let obstacles = [], coins = [], dust = [];
    let speed = 240, distance = 0, nextIn = 420, bonus = 0, score = 0;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0;
    let fall = null;

    function updateScore() {
      const next = Math.floor(distance / 150) * 5 + bonus;
      if (next !== score) {
        score = next;
        api.setScore(score);
        api.setInfo(`${Math.round(speed / 3)} km/h`);
      }
    }

    function spawn() {
      const names = Object.keys(KINDS);
      const kind = names[Math.floor(Math.random() * names.length)];
      const x = W + 30;
      obstacles.push({ x, kind, ...KINDS[kind] });
      if (Math.random() < .55) {
        for (let i = -1; i <= 1; i++) {
          coins.push({ x: x + KINDS[kind].w / 2 + i * 26, y: GROUND - 100 - (i === 0 ? 14 : 0) });
        }
      }
      // Always leave room to land and take off again at the current speed.
      nextIn = speed * .86 + 40 + Math.random() * 260;
    }

    function jump() {
      if (!alive) return;
      if (!onGround) {
        buffered = .12;
        return;
      }
      onGround = false;
      vy = JUMP;
      sound.play('flap');
      for (let i = 0; i < 5; i++) {
        dust.push({ x: BIKE_X - 20 + Math.random() * 14, y: GROUND - 2, vx: -60 - Math.random() * 60, vy: -Math.random() * 50, life: .35 });
      }
    }

    function crash() {
      alive = false;
      fall = { x: BIKE_X, y: GROUND - rise - 46, vx: 170, vy: -300, spin: 0 };
      sound.play('crash');
      timer = setTimeout(() => api.end(score), 1100);
    }

    function update(dt) {
      dust.forEach((d) => {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.life -= dt;
      });
      dust = dust.filter((d) => d.life > 0);
      if (fall) {
        fall.vy += GRAVITY * dt;
        fall.x += fall.vx * dt;
        fall.y = Math.min(GROUND - 8, fall.y + fall.vy * dt);
        fall.spin += dt * 11;
      }
      if (!onGround) {
        vy += GRAVITY * dt;
        rise -= vy * dt;
        if (rise <= 0) {
          rise = 0;
          vy = 0;
          onGround = true;
        }
      }
      if (!alive) return;

      speed = Math.min(560, 240 + distance / 45);
      const step = speed * dt;
      distance += step;
      buffered = Math.max(0, buffered - dt);
      if (onGround && buffered > 0) {
        buffered = 0;
        jump();
      }
      nextIn -= step;
      if (nextIn <= 0) spawn();

      obstacles.forEach((o) => { o.x -= step; });
      obstacles = obstacles.filter((o) => o.x + o.w > -10);
      coins.forEach((c) => { c.x -= step; });
      coins = coins.filter((c) => {
        const got = Math.abs(c.x - BIKE_X) < 30 && Math.abs(c.y - (GROUND - rise - 30)) < 44;
        if (got) {
          bonus += 20;
          sound.play('score');
        }
        return !got && c.x > -20;
      });
      updateScore();

      const hit = obstacles.some((o) => o.x < BIKE_X + 26 && o.x + o.w > BIKE_X - 24 && rise < o.h - 3);
      if (hit) crash();
    }

    function drawMountains(rate, base, height, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 10) {
        const p = x + distance * rate;
        ctx.lineTo(x, base - Math.abs(Math.sin(p / 90)) * height - Math.sin(p / 31) * height * .15);
      }
      ctx.lineTo(W, GROUND);
      ctx.fill();
    }

    function drawObstacle(o) {
      const top = GROUND - o.h;
      if (o.kind === 'cone') {
        ctx.fillStyle = '#ff7a2f';
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, top);
        ctx.lineTo(o.x + o.w, GROUND - 3);
        ctx.lineTo(o.x, GROUND - 3);
        ctx.fill();
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(o.x + 5.5, top + 13, o.w - 11, 5);
        ctx.fillStyle = '#c9561e';
        ctx.fillRect(o.x - 3, GROUND - 3, o.w + 6, 3);
      } else if (o.kind === 'barrel') {
        ctx.fillStyle = '#3f79c9';
        ctx.fillRect(o.x, top, o.w, o.h);
        ctx.fillStyle = '#2a5697';
        ctx.fillRect(o.x, top + 9, o.w, 4);
        ctx.fillRect(o.x, top + 25, o.w, 4);
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        ctx.fillRect(o.x + 4, top, 5, o.h);
      } else {
        for (let i = 0; i < 3; i++) {
          const y = GROUND - 7 - i * 15;
          ctx.fillStyle = '#17181f';
          ctx.fillRect(o.x, y - 7, o.w, 14);
          ctx.fillStyle = '#3a3c47';
          ctx.fillRect(o.x + 7, y - 2, o.w - 14, 4);
        }
      }
    }

    function drawWheel(x, y, spin) {
      ctx.fillStyle = '#121218';
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9ccd6';
      ctx.beginPath();
      ctx.arc(x, y, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a3c47';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = spin + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7);
        ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
        ctx.stroke();
      }
    }

    function drawRider() {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#2a3f7a';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-6, -22);
      ctx.lineTo(6, -13);
      ctx.lineTo(1, -4);
      ctx.stroke();
      ctx.strokeStyle = '#e4574c';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(-7, -23);
      ctx.lineTo(4, -41);
      ctx.stroke();
      ctx.strokeStyle = '#f0c8a0';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(4, -39);
      ctx.lineTo(17, -27);
      ctx.stroke();
      ctx.fillStyle = '#f4f2ea';
      ctx.beginPath();
      ctx.arc(9, -50, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b2233';
      ctx.fillRect(10, -54, 9, 6);
    }

    function drawBike() {
      const spin = distance / 13;
      ctx.save();
      ctx.translate(BIKE_X, GROUND - rise - 13);
      if (!onGround) ctx.rotate(Math.max(-.32, Math.min(.3, vy / 1800)));
      drawWheel(-23, 0, spin);
      drawWheel(25, 0, spin);
      ctx.strokeStyle = '#6d7180';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(13, -24);
      ctx.stroke();
      ctx.fillStyle = '#ef8a3c';
      ctx.beginPath();
      ctx.moveTo(-23, -2);
      ctx.lineTo(-14, -16);
      ctx.lineTo(15, -22);
      ctx.lineTo(19, -13);
      ctx.lineTo(3, -2);
      ctx.fill();
      ctx.fillStyle = '#23252e';
      ctx.fillRect(-16, -22, 17, 5);
      ctx.fillStyle = '#c9ccd6';
      ctx.fillRect(-26, -7, 18, 4);
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(20, -21, 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (alive) drawRider();
      ctx.restore();
    }

    function draw(now) {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffe2a0';
      ctx.beginPath();
      ctx.arc(355, 150, 40, 0, Math.PI * 2);
      ctx.fill();
      drawMountains(.08, GROUND - 42, 62, '#6b3a78');
      drawMountains(.2, GROUND - 16, 40, '#43295f');

      ctx.fillStyle = '#26262f';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#b8bac4';
      ctx.fillRect(0, GROUND, W, 3);
      ctx.fillStyle = '#ffd24a';
      for (let x = -(distance % 70); x < W; x += 70) ctx.fillRect(x, GROUND + 22, 38, 4);

      coins.forEach((c) => {
        const spin = Math.abs(Math.sin(now / 150 + c.x / 40));
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 2 + 7 * spin, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      obstacles.forEach(drawObstacle);
      dust.forEach((d) => {
        ctx.globalAlpha = Math.max(0, d.life / .35) * .6;
        ctx.fillStyle = '#d9d2c5';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3 + (.35 - d.life) * 10, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      drawBike();
      if (fall) {
        ctx.save();
        ctx.translate(fall.x, fall.y);
        ctx.rotate(fall.spin);
        ctx.translate(0, 30);
        drawRider();
        ctx.restore();
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

    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      if (!e.repeat) jump();
    }
    function onPointer(e) {
      e.preventDefault();
      jump();
    }
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);

    api.setInfo('Tap or press Space to jump');
    draw(0);
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
