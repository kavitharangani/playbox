import sound from '../sound.js';

export default {
  id: 'balloons',
  name: 'Balloon Pop',
  icon: '🎈',
  color: '#e27a9e',
  age: 'child',
  category: 'Reflex',
  tags: ['balloon', 'pop', 'tap', 'colours', 'colors', 'easy', 'kids', 'timed'],
  description: 'Pop as many balloons as you can before they float away.',
  howTo: ['Tap or click a balloon to pop it', '+10 for a balloon, +30 for a gold one', 'You have 45 seconds. Nothing bad can happen!'],
  bots: [80, 160, 260, 360],
  mount(root, api) {
    const W = 360, H = 480, DURATION = 45;
    const COLORS = ['#ff7b8a', '#ffb454', '#6fd08c', '#6cc4ff', '#b9a0ff'];
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Balloon Pop game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2c5fa8');
    sky.addColorStop(1, '#9ad3e8');
    const clouds = [{ x: 60, y: 80, s: 1 }, { x: 240, y: 170, s: .8 }, { x: 150, y: 300, s: .65 }];

    let balloons = [], bits = [], score = 0, left = DURATION, spawnIn = .2, second = -1;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0;

    function spawn() {
      const gold = Math.random() < .1;
      const r = gold ? 21 : 27;
      balloons.push({
        x: r + Math.random() * (W - r * 2),
        y: H + r * 2,
        r,
        gold,
        color: gold ? '#ffd24a' : COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: (gold ? 125 : 70) + (DURATION - left) * 1.1 + Math.random() * 25,
        sway: Math.random() * 6,
      });
    }

    function update(dt) {
      clouds.forEach((c) => {
        c.x += 12 * c.s * dt;
        if (c.x > W + 60) c.x = -60;
      });
      bits.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy += 320 * dt;
        b.life -= dt;
      });
      bits = bits.filter((b) => b.life > 0);
      if (!alive) return;

      left -= dt;
      if (Math.ceil(left) !== second) {
        second = Math.ceil(left);
        api.setInfo(`Time ${Math.max(0, second)}s`);
      }
      if (left <= 0) {
        alive = false;
        timer = setTimeout(() => api.end(score), 500);
        return;
      }
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = Math.max(.4, .8 - (DURATION - left) * .008);
        spawn();
      }
      balloons.forEach((b) => {
        b.y -= b.speed * dt;
        b.x += Math.sin(b.y / 40 + b.sway) * 20 * dt;
      });
      balloons = balloons.filter((b) => b.y > -b.r * 3);
    }

    function draw() {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.65)';
      clouds.forEach((c) => {
        [[0, 0, 22], [24, 5, 17], [-24, 6, 15]].forEach(([dx, dy, r]) => {
          ctx.beginPath();
          ctx.arc(c.x + dx * c.s, c.y + dy * c.s, r * c.s, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      balloons.forEach((b) => {
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.r * 1.2);
        ctx.quadraticCurveTo(b.x + 7, b.y + b.r * 1.8, b.x, b.y + b.r * 2.4);
        ctx.stroke();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.x - 5, b.y + b.r * 1.28);
        ctx.lineTo(b.x + 5, b.y + b.r * 1.28);
        ctx.lineTo(b.x, b.y + b.r * 1.12);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r, b.r * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.beginPath();
        ctx.ellipse(b.x - b.r * .35, b.y - b.r * .42, b.r * .2, b.r * .3, .4, 0, Math.PI * 2);
        ctx.fill();
      });
      bits.forEach((b) => {
        ctx.globalAlpha = Math.max(0, b.life / .5);
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
      });
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 1 / 30);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function onPointer(e) {
      e.preventDefault();
      if (!alive) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      const hit = balloons.slice().reverse().find((b) => Math.hypot(b.x - x, (b.y - y) / 1.2) < b.r + 8);
      if (!hit) return;
      balloons = balloons.filter((b) => b !== hit);
      score += hit.gold ? 30 : 10;
      api.setScore(score);
      sound.play(hit.gold ? 'score' : 'hit');
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 60 + Math.random() * 130;
        bits.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .5, color: hit.color });
      }
    }
    canvas.addEventListener('pointerdown', onPointer);

    draw();
    raf = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  },
};
