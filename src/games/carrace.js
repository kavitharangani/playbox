import sound from '../sound.js';

export default {
  id: 'carrace',
  name: 'Highway Racer',
  icon: '🏎️',
  color: '#d9534a',
  age: 'junior',
  category: 'Racing',
  tags: ['car', 'cars', 'race', 'racing', 'driving', 'road', 'traffic', 'speed'],
  description: 'Weave through traffic at rising speed and grab every coin.',
  howTo: ['Arrow keys or A / D to change lane', 'On a phone, tap the left or right side of the road', '+10 for each car you pass, +25 for a coin. One crash ends the race'],
  bots: [200, 500, 1000, 1800],
  mount(root, api) {
    const W = 360, H = 540, ROAD_X = 40, LANES = 4, LANE_W = 70, CAR_W = 38, CAR_H = 70, PLAYER_Y = H - 110;
    const COLORS = ['#5b8def', '#f2b84b', '#9a7bea', '#4cc08f', '#e8e4d8', '#ec7aa8'];
    root.innerHTML = `<canvas class="game-canvas" style="--r:${W / H}" aria-label="Highway Racer game area"></canvas>`;
    const canvas = root.firstElementChild;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const laneX = (lane) => ROAD_X + LANE_W * (lane + .5);
    const trees = Array.from({ length: 10 }, (_, i) => ({ side: i % 2, y: i * 60, r: 11 + Math.random() * 6 }));

    let lane = 1, x = laneX(1), tilt = 0;
    let cars = [], coins = [], sparks = [];
    let speed = 260, distance = 0, nextRow = 240, bonus = 0, score = 0, passed = 0;
    let alive = true, stopped = false, last = null, raf = 0, timer = 0, shake = 0;

    function info() {
      api.setInfo(`${Math.round(speed / 3)} km/h · ${passed} passed`);
    }

    function updateScore() {
      const next = Math.floor(distance / 200) * 5 + bonus;
      if (next !== score) {
        score = next;
        api.setScore(score);
      }
    }

    function spawnRow() {
      const open = [0, 1, 2, 3].sort(() => Math.random() - .5);
      const count = Math.random() < Math.min(.55, .15 + distance / 40000) ? 2 : 1;
      open.slice(0, count).forEach((l) => {
        cars.push({
          lane: l,
          y: -CAR_H,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          counted: false,
        });
      });
      if (Math.random() < .45) coins.push({ lane: open[count], y: -CAR_H / 2 });
    }

    function crash() {
      alive = false;
      shake = 1;
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 60 + Math.random() * 200;
        sparks.push({
          x, y: PLAYER_Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .6,
          color: Math.random() < .5 ? '#ffd24a' : '#ff8a3d',
        });
      }
      sound.play('crash');
      timer = setTimeout(() => api.end(score), 1000);
    }

    function move(dir) {
      if (!alive) return;
      const target = Math.max(0, Math.min(LANES - 1, lane + dir));
      if (target !== lane) {
        lane = target;
        sound.play('tap');
      }
    }

    function update(dt) {
      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
      });
      sparks = sparks.filter((s) => s.life > 0);
      shake = Math.max(0, shake - dt * 2);
      if (!alive) return;

      speed = Math.min(640, 260 + distance / 90);
      const step = speed * dt;
      distance += step;
      const target = laneX(lane);
      const before = x;
      x += (target - x) * Math.min(1, dt * 12);
      tilt = Math.max(-.2, Math.min(.2, (x - before) / Math.max(dt, .001) / 900));

      trees.forEach((t) => {
        t.y += step;
        if (t.y > H + 30) t.y -= 600;
      });
      nextRow -= step;
      if (nextRow <= 0) {
        spawnRow();
        // Spacing grows with speed, so there is always time to change lane between rows.
        nextRow = 172 + speed * .32 + Math.random() * 90;
      }

      cars.forEach((c) => {
        c.y += step * .72;
        if (!c.counted && c.y - CAR_H / 2 > PLAYER_Y + CAR_H / 2) {
          c.counted = true;
          passed++;
          bonus += 10;
          info();
        }
      });
      cars = cars.filter((c) => c.y < H + CAR_H);
      coins.forEach((c) => { c.y += step * .72; });
      coins = coins.filter((c) => {
        const got = Math.abs(laneX(c.lane) - x) < 34 && Math.abs(c.y - PLAYER_Y) < 44;
        if (got) {
          bonus += 25;
          sound.play('score');
        }
        return !got && c.y < H + 20;
      });
      updateScore();

      const hit = cars.some((c) => Math.abs(laneX(c.lane) - x) < CAR_W - 6 && Math.abs(c.y - PLAYER_Y) < CAR_H - 8);
      if (hit) crash();
    }

    function rounded(px, py, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + w, py, px + w, py + h, r);
      ctx.arcTo(px + w, py + h, px, py + h, r);
      ctx.arcTo(px, py + h, px, py, r);
      ctx.arcTo(px, py, px + w, py, r);
      ctx.fill();
    }

    function drawCar(cx, cy, color, angle, isPlayer) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      rounded(-CAR_W / 2 + 3, -CAR_H / 2 + 5, CAR_W, CAR_H, 9);
      ctx.fillStyle = '#17181f';
      [[-CAR_W / 2 - 2, -CAR_H / 2 + 10], [CAR_W / 2 - 3, -CAR_H / 2 + 10], [-CAR_W / 2 - 2, CAR_H / 2 - 24], [CAR_W / 2 - 3, CAR_H / 2 - 24]]
        .forEach(([wx, wy]) => ctx.fillRect(wx, wy, 5, 14));
      ctx.fillStyle = color;
      rounded(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 9);
      ctx.fillStyle = 'rgba(14,22,40,.82)';
      rounded(-CAR_W / 2 + 5, -CAR_H / 2 + 14, CAR_W - 10, 15, 4);
      rounded(-CAR_W / 2 + 6, CAR_H / 2 - 22, CAR_W - 12, 12, 3);
      ctx.fillStyle = 'rgba(255,255,255,.2)';
      ctx.fillRect(-CAR_W / 2 + 5, -CAR_H / 2 + 31, CAR_W - 10, 15);
      if (isPlayer) {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.fillRect(-4, -CAR_H / 2, 8, CAR_H);
        ctx.fillStyle = 'rgba(14,22,40,.82)';
        rounded(-CAR_W / 2 + 5, -CAR_H / 2 + 14, CAR_W - 10, 15, 4);
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(-CAR_W / 2 + 4, -CAR_H / 2, 7, 4);
        ctx.fillRect(CAR_W / 2 - 11, -CAR_H / 2, 7, 4);
      } else {
        ctx.fillStyle = '#ff5a50';
        ctx.fillRect(-CAR_W / 2 + 4, CAR_H / 2 - 4, 7, 4);
        ctx.fillRect(CAR_W / 2 - 11, CAR_H / 2 - 4, 7, 4);
      }
      ctx.restore();
    }

    function draw(now) {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - .5) * 14 * shake, (Math.random() - .5) * 14 * shake);

      ctx.fillStyle = '#2f6a43';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.fillStyle = '#285c3a';
      const band = distance % 80;
      for (let y = band - 80; y < H; y += 80) {
        ctx.fillRect(-10, y, ROAD_X + 10, 40);
        ctx.fillRect(ROAD_X + LANE_W * LANES, y, 60, 40);
      }
      trees.forEach((t) => {
        const tx = t.side ? W - 18 : 18;
        ctx.fillStyle = '#1c4a2c';
        ctx.beginPath();
        ctx.arc(tx, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3e9159';
        ctx.beginPath();
        ctx.arc(tx - 2, t.y - 2, t.r * .62, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#34363f';
      ctx.fillRect(ROAD_X, -10, LANE_W * LANES, H + 20);
      for (let y = (distance % 40) - 40; y < H; y += 40) {
        ctx.fillStyle = Math.floor((y - distance) / 40) % 2 ? '#e4574c' : '#f4f2ea';
        ctx.fillRect(ROAD_X - 6, y, 6, 40);
        ctx.fillRect(ROAD_X + LANE_W * LANES, y, 6, 40);
      }
      ctx.fillStyle = 'rgba(244,242,234,.75)';
      for (let i = 1; i < LANES; i++) {
        for (let y = (distance % 70) - 70; y < H; y += 70) ctx.fillRect(ROAD_X + LANE_W * i - 2, y, 4, 36);
      }

      coins.forEach((c) => {
        const spin = Math.abs(Math.sin(now / 160 + c.y / 40));
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.ellipse(laneX(c.lane), c.y, 3 + 8 * spin, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8a11f';
        ctx.beginPath();
        ctx.ellipse(laneX(c.lane), c.y, 1 + 4 * spin, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      cars.forEach((c) => drawCar(laneX(c.lane), c.y, c.color, 0, false));
      drawCar(x, PLAYER_Y, '#e4574c', tilt, true);

      sparks.forEach((s) => {
        ctx.globalAlpha = Math.max(0, s.life / .6);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      ctx.restore();
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
      const dir = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      if (!e.repeat) move(dir);
    }
    function onPointer(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      move(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
    }
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);

    info();
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
