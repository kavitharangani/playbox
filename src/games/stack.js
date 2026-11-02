import sound from '../sound.js';

export default {
  id: 'stack',
  name: 'Stack Tower',
  icon: '🏗️',
  color: '#33a899',
  age: 'junior',
  category: 'Reflex',
  tags: ['tower', 'blocks', 'timing', 'tap', 'one button', 'endless'],
  description: 'Drop each sliding block on the last one. Whatever hangs over is gone.',
  howTo: ['Tap, click or press Space to drop the block', '+10 for each block on the tower', 'Land it perfectly to keep its size and earn a combo bonus'],
  bots: [50, 120, 220, 350],
  mount(root, api) {
    const W = 360, H = 520, BLOCK = 26, PERFECT = 4, START_W = 180;
    const FONT = '"Segoe UI", system-ui, sans-serif';
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Stack Tower game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#141a33');
    sky.addColorStop(1, '#2b2547');

    const colorFor = (level) => `hsl(${(165 + level * 11) % 360} 68% 58%)`;
    let tower = [{ x: (W - START_W) / 2, w: START_W }];
    let block = null, debris = [], score = 0, combo = 0, camera = 0, glow = 0;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0;

    function nextBlock() {
      const top = tower[tower.length - 1];
      const fromLeft = tower.length % 2 === 0;
      block = { x: fromLeft ? -top.w : W, w: top.w, dir: fromLeft ? 1 : -1 };
    }

    const yFor = (level) => H - 70 - level * BLOCK + camera;

    function drop() {
      if (!alive || !block) return;
      const top = tower[tower.length - 1];
      const level = tower.length;
      const left = Math.max(block.x, top.x);
      const right = Math.min(block.x + block.w, top.x + top.w);
      const overlap = right - left;

      if (overlap <= 0) {
        debris.push({ x: block.x, y: yFor(level), w: block.w, vy: 0, color: colorFor(level) });
        block = null;
        alive = false;
        sound.play('crash');
        timer = setTimeout(() => api.end(score), 900);
        return;
      }

      if (Math.abs(block.x - top.x) <= PERFECT) {
        tower.push({ x: top.x, w: top.w });
        combo++;
        score += 10 + combo * 5;
        glow = 1;
        sound.play('score');
        api.setInfo(`Perfect! Combo ×${combo}`);
      } else {
        const cutX = block.x < top.x ? block.x : right;
        debris.push({ x: cutX, y: yFor(level), w: block.w - overlap, vy: 0, color: colorFor(level) });
        tower.push({ x: left, w: overlap });
        combo = 0;
        score += 10;
        sound.play('tap');
        api.setInfo(`Height ${tower.length - 1}`);
      }
      api.setScore(score);
      nextBlock();
    }

    function update(dt) {
      const target = Math.max(0, (tower.length - 9) * BLOCK);
      camera += (target - camera) * Math.min(1, dt * 6);
      glow = Math.max(0, glow - dt * 3);
      if (block) {
        const speed = Math.min(330, 135 + tower.length * 7);
        block.x += block.dir * speed * dt;
        if (block.x > W) { block.x = W; block.dir = -1; }
        if (block.x + block.w < 0) { block.x = -block.w; block.dir = 1; }
      }
      debris.forEach((d) => {
        d.vy += 1300 * dt;
        d.y += d.vy * dt;
      });
      debris = debris.filter((d) => d.y < H + 40);
    }

    function drawBlock(x, y, w, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, BLOCK - 2);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(x, y + BLOCK - 6, w, 4);
    }

    function draw() {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      tower.forEach((t, level) => {
        const y = yFor(level);
        if (y < H && y > -BLOCK) drawBlock(t.x, y, t.w, colorFor(level));
      });
      if (glow > 0) {
        const t = tower[tower.length - 1];
        ctx.strokeStyle = `rgba(255,255,255,${glow})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(t.x - (1 - glow) * 12, yFor(tower.length - 1) - (1 - glow) * 12, t.w + (1 - glow) * 24, BLOCK - 2 + (1 - glow) * 24);
      }
      if (block) drawBlock(block.x, yFor(tower.length), block.w, colorFor(tower.length));
      debris.forEach((d) => drawBlock(d.x, d.y, d.w, d.color));

      ctx.textAlign = 'center';
      ctx.font = `800 40px ${FONT}`;
      ctx.fillStyle = 'rgba(255,248,231,.9)';
      ctx.fillText(score, W / 2, 56);
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
      drop();
    }
    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      if (!e.repeat) drop();
    }
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);

    nextBlock();
    api.setInfo('Tap or press Space to drop');
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
