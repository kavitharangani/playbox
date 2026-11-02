import sound from '../sound.js';

export default {
  id: 'targets',
  name: 'Target Range',
  icon: '🎯',
  color: '#b4544f',
  age: 'junior',
  category: 'Shooting',
  tags: ['gun', 'guns', 'wedi', 'shoot', 'shooting', 'aim', 'sniper', 'targets', 'timed'],
  description: 'Sixty seconds at the shooting range. Hit the targets, not the bombs.',
  howTo: ['Aim with the mouse and click, or tap to shoot', 'Six bullets, then reload. Press R or tap the ammo bar', 'Bullseye +25, ring +10, can +30, bomb -20'],
  bots: [150, 400, 700, 1100],
  mount(root, api) {
    const W = 360, H = 480, DURATION = 60, MAGAZINE = 6, RELOAD = .85, BAR_Y = H - 44;
    const RAILS = [90, 180, 270];
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H};cursor:none" aria-label="Target Range game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    let aim = { x: W / 2, y: H / 2 }, keys = {};
    let targets = [], holes = [], sparks = [], popups = [];
    let ammo = MAGAZINE, reloading = 0, left = DURATION, spawnIn = .3;
    let score = 0, streak = 0, kick = 0, muzzle = 0, shownSecond = -1;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0;

    function info() {
      const status = reloading > 0 ? 'Reloading…' : `Ammo ${ammo}/${MAGAZINE}`;
      api.setInfo(`Time ${Math.ceil(left)}s · ${status}${streak >= 3 ? ` · Streak ×${streak}` : ''}`);
    }

    function spawn() {
      const rail = RAILS[Math.floor(Math.random() * RAILS.length)];
      const dir = Math.random() < .5 ? 1 : -1;
      const roll = Math.random();
      const kind = roll < .62 ? 'target' : roll < .82 ? 'can' : 'bomb';
      const r = kind === 'target' ? 26 : kind === 'can' ? 14 : 19;
      const pace = 60 + (DURATION - left) * 1.6 + Math.random() * 40;
      targets.push({
        kind, r, y: rail, x: dir > 0 ? -r : W + r, vx: dir * pace * (kind === 'can' ? 1.45 : 1), wobble: Math.random() * 6,
      });
    }

    function reload() {
      if (reloading > 0 || ammo === MAGAZINE || !alive) return;
      reloading = RELOAD;
      sound.play('flip');
      info();
    }

    function addScore(points, x, y) {
      score = Math.max(0, score + points);
      api.setScore(score);
      popups.push({ x, y, text: points > 0 ? `+${points}` : `${points}`, good: points > 0, life: .7 });
    }

    function burst(x, y, color) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 150;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .45, color });
      }
    }

    function shoot() {
      if (!alive || reloading > 0) return;
      if (ammo === 0) {
        reload();
        return;
      }
      ammo--;
      kick = 1;
      muzzle = 1;
      const hit = targets.slice().reverse().find((t) => (t.x - aim.x) ** 2 + (t.y - aim.y) ** 2 < t.r ** 2);
      if (!hit) {
        streak = 0;
        holes.push({ x: aim.x, y: aim.y });
        if (holes.length > 14) holes.shift();
        sound.play('tap');
      } else {
        targets = targets.filter((t) => t !== hit);
        if (hit.kind === 'bomb') {
          streak = 0;
          addScore(-20, hit.x, hit.y);
          burst(hit.x, hit.y, '#ff6b5e');
          sound.play('crash');
        } else {
          streak++;
          const close = Math.hypot(hit.x - aim.x, hit.y - aim.y) < hit.r * .36;
          const points = hit.kind === 'can' ? 30 : close ? 25 : 10;
          addScore(points + (streak >= 3 ? 5 : 0), hit.x, hit.y);
          burst(hit.x, hit.y, hit.kind === 'can' ? '#c9ccd6' : '#ffd24a');
          sound.play(close || hit.kind === 'can' ? 'score' : 'hit');
        }
      }
      if (ammo === 0) reload();
      info();
    }

    function update(dt) {
      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 300 * dt;
        s.life -= dt;
      });
      sparks = sparks.filter((s) => s.life > 0);
      popups.forEach((p) => {
        p.y -= 42 * dt;
        p.life -= dt;
      });
      popups = popups.filter((p) => p.life > 0);
      kick = Math.max(0, kick - dt * 7);
      muzzle = Math.max(0, muzzle - dt * 14);
      if (!alive) return;

      const ax = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
      const ay = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      aim.x = Math.max(0, Math.min(W, aim.x + ax * 300 * dt));
      aim.y = Math.max(0, Math.min(H, aim.y + ay * 300 * dt));

      left -= dt;
      if (reloading > 0) {
        reloading -= dt;
        if (reloading <= 0) {
          reloading = 0;
          ammo = MAGAZINE;
          sound.play('tap');
          info();
        }
      }
      if (Math.ceil(left) !== shownSecond) {
        shownSecond = Math.ceil(left);
        info();
      }
      if (left <= 0) {
        left = 0;
        alive = false;
        info();
        timer = setTimeout(() => api.end(score), 500);
        return;
      }

      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = Math.max(.42, .95 - (DURATION - left) * .009);
        spawn();
      }
      targets.forEach((t) => { t.x += t.vx * dt; });
      targets = targets.filter((t) => t.x > -t.r - 4 && t.x < W + t.r + 4);
    }

    function drawTarget(t, now) {
      const y = t.y + Math.sin(now / 240 + t.wobble) * 3;
      if (t.kind === 'target') {
        ctx.fillStyle = '#5a4230';
        ctx.fillRect(t.x - 3, y + t.r - 3, 6, 18);
        [['#f4f2ea', 1], ['#d8453c', .72], ['#f4f2ea', .46], ['#d8453c', .22]].forEach(([color, size]) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(t.x, y, t.r * size, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (t.kind === 'can') {
        ctx.fillStyle = '#9fa4b2';
        ctx.fillRect(t.x - t.r * .72, y - t.r, t.r * 1.44, t.r * 2);
        ctx.fillStyle = '#4cc08f';
        ctx.fillRect(t.x - t.r * .72, y - t.r * .5, t.r * 1.44, t.r);
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.fillRect(t.x - t.r * .5, y - t.r, 3, t.r * 2);
      } else {
        ctx.strokeStyle = '#c9a26a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(t.x + 10, y - 14);
        ctx.quadraticCurveTo(t.x + 16, y - 26, t.x + 24, y - 22);
        ctx.stroke();
        ctx.fillStyle = Math.floor(now / 140) % 2 ? '#ffd24a' : '#ff6b5e';
        ctx.beginPath();
        ctx.arc(t.x + 24, y - 22, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1b1c24';
        ctx.beginPath();
        ctx.arc(t.x, y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff6b5e';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.beginPath();
        ctx.arc(t.x - 6, y - 6, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawGun() {
      const gx = W / 2 + (aim.x - W / 2) * .35;
      const gy = H + 10 + kick * 12;
      const angle = Math.atan2(aim.x - gx, gy - aim.y);
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);
      if (muzzle > 0) {
        ctx.fillStyle = `rgba(255,214,90,${muzzle})`;
        ctx.beginPath();
        ctx.moveTo(0, -136 - muzzle * 22);
        ctx.lineTo(11, -110);
        ctx.lineTo(-11, -110);
        ctx.fill();
      }
      ctx.fillStyle = '#7b8090';
      ctx.fillRect(-9, -108, 18, 72);
      ctx.fillStyle = '#b4b8c6';
      ctx.fillRect(-9, -108, 5, 72);
      ctx.fillStyle = '#23252e';
      ctx.fillRect(-3, -114, 6, 8);
      ctx.fillStyle = '#8a5a35';
      ctx.fillRect(-13, -38, 26, 48);
      ctx.fillStyle = '#a8703f';
      ctx.fillRect(-13, -38, 6, 48);
      ctx.restore();
    }

    function drawCrosshair() {
      const spread = 11 + kick * 9;
      ctx.strokeStyle = reloading > 0 ? '#a9abba' : '#6fe39b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(aim.x, aim.y, spread, 0, Math.PI * 2);
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        ctx.moveTo(aim.x + dx * (spread - 4), aim.y + dy * (spread - 4));
        ctx.lineTo(aim.x + dx * (spread + 8), aim.y + dy * (spread + 8));
      });
      ctx.stroke();
    }

    function drawAmmo() {
      ctx.fillStyle = 'rgba(12,13,20,.82)';
      ctx.fillRect(0, BAR_Y, W, H - BAR_Y);
      for (let i = 0; i < MAGAZINE; i++) {
        ctx.fillStyle = i < ammo ? '#e8b64a' : '#3a3c47';
        ctx.fillRect(14 + i * 15, BAR_Y + 12, 8, 21);
      }
      ctx.fillStyle = '#f4f2ea';
      ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(reloading > 0 ? 'Reloading…' : `${Math.ceil(left)}s`, W - 14, BAR_Y + 28);
      if (reloading > 0) {
        ctx.fillStyle = '#e8b64a';
        ctx.fillRect(0, BAR_Y, W * (1 - reloading / RELOAD), 3);
      }
    }

    function draw(now) {
      ctx.fillStyle = '#39302a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2f2722';
      for (let x = 0; x < W; x += 40) ctx.fillRect(x, 0, 2, H);
      RAILS.forEach((y) => {
        ctx.fillStyle = '#1f1a17';
        ctx.fillRect(0, y + 40, W, 6);
        ctx.fillStyle = '#62503f';
        ctx.fillRect(0, y + 39, W, 2);
      });
      ctx.fillStyle = '#14110f';
      holes.forEach((h) => {
        ctx.beginPath();
        ctx.arc(h.x, h.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      targets.forEach((t) => drawTarget(t, now));
      sparks.forEach((s) => {
        ctx.globalAlpha = Math.max(0, s.life / .45);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      popups.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / .7);
        ctx.fillStyle = p.good ? '#ffe680' : '#ff8a80';
        ctx.font = '800 19px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      });
      ctx.globalAlpha = 1;
      drawAmmo();
      drawGun();
      drawCrosshair();
    }

    function frame(now) {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 1 / 30);
      last = now;
      update(dt);
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function toCanvas(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
    }
    function onMove(e) {
      aim = toCanvas(e);
    }
    function onDown(e) {
      e.preventDefault();
      const point = toCanvas(e);
      if (point.y >= BAR_Y) {
        reload();
        return;
      }
      aim = point;
      shoot();
    }
    function onKey(e) {
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        keys[e.key] = e.type === 'keydown';
      } else if (e.type === 'keydown' && !e.repeat) {
        if (e.code === 'Space') {
          e.preventDefault();
          shoot();
        } else if (e.key === 'r' || e.key === 'R') {
          reload();
        }
      }
    }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
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
