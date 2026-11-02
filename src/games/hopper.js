import sound from '../sound.js';

export default {
  id: 'hopper',
  name: 'Sky Hopper',
  icon: '🐤',
  color: '#d4668f',
  age: 'junior',
  category: 'Arcade',
  tags: ['flappy', 'bird', 'tap', 'endless', 'one button'],
  description: 'One button, endless pipes and very little mercy.',
  howTo: ['Tap, click or press Space to flap', 'Fly through the gaps', '+1 for every pipe you pass'],
  bots: [2, 8, 20, 40],
  mount(root, api) {
    const W = 360, H = 540, GROUND = 44, PIPE_W = 58, SPACING = 200;
    const BIRD_X = 90, BIRD_R = 14, GRAVITY = 1500, FLAP = -430;
    const FONT = '"Segoe UI", system-ui, sans-serif';
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Sky Hopper game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1d2c55');
    sky.addColorStop(.65, '#4a5a94');
    sky.addColorStop(1, '#e2917f');
    const pipeFill = ctx.createLinearGradient(0, 0, PIPE_W, 0);
    pipeFill.addColorStop(0, '#3a9e68');
    pipeFill.addColorStop(.4, '#71d797');
    pipeFill.addColorStop(1, '#2d7f53');
    const STARS = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * 240, r: .6 + Math.random() }));
    const CLOUDS = [{ x: 40, y: 90, s: 1 }, { x: 210, y: 160, s: .75 }, { x: 330, y: 60, s: .9 }];

    let y = H / 2, vy = 0, pipes = [], puffs = [], score = 0;
    let started = false, alive = true, stopped = false;
    let last = null, raf = 0, timer = 0, scroll = 0, flap = 0, flash = 0;

    function addPipe(x) {
      const gap = Math.max(125, 170 - score);
      const top = 50 + Math.random() * (H - GROUND - gap - 100);
      pipes.push({ x, top, gap, passed: false });
    }

    function hits(p) {
      const rects = [[p.x, 0, PIPE_W, p.top], [p.x, p.top + p.gap, PIPE_W, H - p.top - p.gap]];
      return rects.some(([rx, ry, rw, rh]) => {
        const cx = Math.max(rx, Math.min(BIRD_X, rx + rw));
        const cy = Math.max(ry, Math.min(y, ry + rh));
        return (BIRD_X - cx) ** 2 + (y - cy) ** 2 < BIRD_R ** 2;
      });
    }

    function crash() {
      alive = false;
      flash = 1;
      sound.play('crash');
      timer = setTimeout(() => api.end(score), 750);
    }

    function update(dt) {
      flap = Math.max(0, flap - dt * 5);
      flash = Math.max(0, flash - dt * 3);
      puffs.forEach((p) => {
        p.x -= 60 * dt;
        p.y += 30 * dt;
        p.life -= dt;
      });
      puffs = puffs.filter((p) => p.life > 0);
      if (!started) {
        y = H / 2 + Math.sin(performance.now() / 260) * 7;
        scroll += 40 * dt;
        return;
      }
      vy += GRAVITY * dt;
      y = Math.min(y + vy * dt, H - GROUND - BIRD_R);
      if (y < BIRD_R) { y = BIRD_R; vy = 0; }
      if (!alive) return;

      const speed = Math.min(230, 150 + score * 3);
      scroll += speed * dt;
      pipes.forEach((p) => {
        p.x -= speed * dt;
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true;
          score++;
          api.setScore(score);
          sound.play('score');
        }
      });
      pipes = pipes.filter((p) => p.x + PIPE_W > 0);
      if (pipes[pipes.length - 1].x < W - SPACING) addPipe(W);
      if (y + BIRD_R >= H - GROUND || pipes.some(hits)) crash();
    }

    function drawCloud(c) {
      const x = W + 60 - ((scroll * .15 * c.s + (W + 120 - c.x)) % (W + 120));
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      [[0, 0, 22], [24, 5, 17], [-24, 6, 15]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(x + dx * c.s, c.y + dy * c.s, r * c.s, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawHills(speed, base, height, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        ctx.lineTo(x, base - Math.sin((x + scroll * speed) / 62) * height - Math.sin((x + scroll * speed) / 23) * height * .3);
      }
      ctx.lineTo(W, H);
      ctx.fill();
    }

    function drawPipe(p) {
      ctx.save();
      ctx.translate(p.x, 0);
      ctx.fillStyle = pipeFill;
      ctx.fillRect(0, 0, PIPE_W, p.top);
      ctx.fillRect(0, p.top + p.gap, PIPE_W, H - p.top - p.gap);
      ctx.fillRect(-4, p.top - 18, PIPE_W + 8, 18);
      ctx.fillRect(-4, p.top + p.gap, PIPE_W + 8, 18);
      ctx.fillStyle = 'rgba(10,40,25,.45)';
      ctx.fillRect(-4, p.top - 2, PIPE_W + 8, 2);
      ctx.fillRect(-4, p.top + p.gap + 16, PIPE_W + 8, 2);
      ctx.restore();
    }

    function drawBird() {
      ctx.save();
      ctx.translate(BIRD_X, y);
      ctx.rotate(Math.max(-.45, Math.min(1.1, vy / 620)));
      ctx.fillStyle = alive ? '#ffc83d' : '#d98a6a';
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath();
      ctx.arc(2, 5, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8a3d';
      ctx.beginPath();
      ctx.moveTo(BIRD_R - 3, -3);
      ctx.lineTo(BIRD_R + 9, 1);
      ctx.lineTo(BIRD_R - 3, 5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(6, -5, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#231a00';
      ctx.beginPath();
      ctx.arc(7.5, -5, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8a11f';
      ctx.beginPath();
      ctx.ellipse(-6, 1 - flap * 7, 8, 4.5 + flap * 2, -.35 + flap * -.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      STARS.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      CLOUDS.forEach(drawCloud);
      drawHills(.25, H - GROUND - 70, 28, '#3a4778');
      drawHills(.5, H - GROUND - 26, 18, '#2c3560');
      pipes.forEach(drawPipe);

      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = '#6fbf63';
      ctx.fillRect(0, H - GROUND, W, 9);
      ctx.fillStyle = '#5da654';
      for (let x = -(scroll % 24); x < W; x += 24) ctx.fillRect(x, H - GROUND, 12, 9);

      puffs.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / .35) * .7;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + (.35 - p.life) * 12, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      drawBird();

      ctx.textAlign = 'center';
      if (started) {
        ctx.font = `800 44px ${FONT}`;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(18,19,26,.75)';
        ctx.strokeText(score, W / 2, 62);
        ctx.fillStyle = '#fff8e7';
        ctx.fillText(score, W / 2, 62);
      } else {
        ctx.fillStyle = '#f4f2ea';
        ctx.font = `700 20px ${FONT}`;
        ctx.fillText('Tap or press Space to flap', W / 2, H / 2 - 50);
      }
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash * .75})`;
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

    function doFlap() {
      if (!alive) return;
      started = true;
      vy = FLAP;
      flap = 1;
      puffs.push({ x: BIRD_X - 12, y: y + 8, life: .35 });
      sound.play('flap');
    }
    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      if (!e.repeat) doFlap();
    }
    function onPointer(e) {
      e.preventDefault();
      doFlap();
    }
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);

    addPipe(W + 60);
    api.setInfo('Tap or press Space');
    draw();
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
