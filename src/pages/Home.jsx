import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Art } from '../components/Bits.jsx';
import Hello from '../components/Hello.jsx';
import { ageName, AGES, games } from '../games/index.js';
import { getPlayer, nextPlace, recent, stats, useStore } from '../store.js';
import { num, placeClass, placeText } from '../utils.js';

const SEARCH_WORDS = {
  child: 'child kids children',
  junior: 'junior teen teens adult adults',
  senior: 'senior expert hard difficult advanced adult adults',
};

function matches(game, query, category) {
  if (category !== 'All' && game.category !== category) return false;
  const text = [game.name, game.category, game.description, SEARCH_WORDS[game.age], ...game.tags].join(' ').toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}

// The last game played, or a first game to try.
function Featured() {
  const last = recent(1)[0];
  const game = last ? last.game : games[0];
  const s = stats(game.id);
  let line = game.description;
  if (s) {
    const next = nextPlace(game.id, s.best);
    line = next
      ? `Best ${num(s.best)}. ${num(next.points)} more for ${placeText(next.place)} place.`
      : `Best ${num(s.best)}. You hold 1st place!`;
  }
  return (
    <Link className="featured" to={`/game/${game.id}`} style={{ '--c': game.color }}>
      <div className="featured-text">
        <span className="featured-label">{s ? 'Keep climbing' : 'Start here'}</span>
        <h2>{game.name}</h2>
        <p>{line}</p>
        <span className="btn featured-btn">▶ Play now</span>
      </div>
      <div className="featured-art"><Art game={game} /></div>
    </Link>
  );
}

// Tilts the card towards the mouse. Touch screens skip this.
function tilt(e) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const box = el.getBoundingClientRect();
  const x = (e.clientX - box.left) / box.width;
  const y = (e.clientY - box.top) / box.height;
  el.style.setProperty('--ry', `${(x - .5) * 12}deg`);
  el.style.setProperty('--rx', `${(.5 - y) * 12}deg`);
  el.style.setProperty('--mx', `${x * 100}%`);
  el.style.setProperty('--my', `${y * 100}%`);
}

function untilt(e) {
  ['--rx', '--ry'].forEach((name) => e.currentTarget.style.removeProperty(name));
}

// Becomes true the first time the element scrolls into view, so its entrance is actually seen.
function useSeen() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (seen) return undefined;
    let answered = false;
    const observer = new IntersectionObserver(([entry]) => {
      answered = true;
      if (entry.isIntersecting) setSeen(true);
    }, { rootMargin: '0px 0px -5% 0px' });
    observer.observe(ref.current);
    // Observers always answer once straight away. If this one stays silent, show the card anyway.
    const timer = setTimeout(() => {
      if (!answered) setSeen(true);
    }, 1500);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [seen]);

  return [ref, seen];
}

function Card({ game, index }) {
  const s = stats(game.id);
  const [ref, seen] = useSeen();
  return (
    <Link
      ref={ref}
      className={`card ${game.age}${seen ? ' show' : ''}`}
      to={`/game/${game.id}`}
      style={{ '--c': game.color, '--i': index % 4 }}
      onPointerMove={tilt}
      onPointerLeave={untilt}
    >
      <div className="card-art">
        <Art game={game} />
        <span className={`age-tag ${game.age}`}>{ageName(game.age)}</span>
        {s && <span className={`card-place ${placeClass(s.bestPlace)}`}>{placeText(s.bestPlace)}</span>}
      </div>
      <div className="card-body">
        <div className="card-title">
          <h2>{game.name}</h2>
          <span className="card-cat">{game.category}</span>
        </div>
        <p className="card-desc">{game.description}</p>
        {s
          ? <p className="card-stats">Best {num(s.best)} · {s.plays} {s.plays === 1 ? 'play' : 'plays'}</p>
          : <p className="card-stats none">Not played yet</p>}
      </div>
    </Link>
  );
}

export default function Home() {
  useStore();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const age = params.get('age') || 'all';
  const inAge = games.filter((g) => age === 'all' || g.age === age);
  const categories = ['All', ...new Set(inAge.map((g) => g.category))];
  const category = categories.includes(params.get('cat')) ? params.get('cat') : 'All';
  const found = inAge.filter((g) => matches(g, query, category));
  const filtering = query.trim() !== '' || category !== 'All' || age !== 'all';
  const sections = AGES
    .filter((a) => age === 'all' || a.id === age)
    .map((a) => ({ ...a, games: found.filter((g) => g.age === a.id) }))
    .filter((a) => a.games.length > 0);

  function update(key, value, fallback) {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  return (
    <>
      <section className="hero">
        <Hello name={getPlayer()} />
        <div className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16.500 16.500L21 21" /></svg>
          <input
            type="search"
            placeholder="Search games, like “puzzle” or “snake”"
            aria-label="Search games"
            value={query}
            onChange={(e) => update('q', e.target.value, '')}
          />
        </div>
        <div className="age-tabs" role="group" aria-label="Filter by age">
          {[{ id: 'all', title: 'All games' }, ...AGES].map((a) => (
            <button
              key={a.id}
              className={`age-tab ${a.id}`}
              type="button"
              aria-pressed={a.id === age}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('cat');
                if (a.id === 'all') next.delete('age');
                else next.set('age', a.id);
                setParams(next, { replace: true });
              }}
            >
              {a.title}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              className="chip"
              type="button"
              aria-pressed={c === category}
              onClick={() => update('cat', c, 'All')}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {!filtering && <Featured />}
      <p className="count" aria-live="polite">{found.length} {found.length === 1 ? 'game' : 'games'}</p>

      {found.length > 0 ? (
        sections.map((section) => (
          <section className="age-section" key={section.id}>
            <header className="age-head">
              <h2><span className={`age-dot ${section.id}`} aria-hidden="true" />{section.title}</h2>
              <p>{section.note}</p>
            </header>
            <div className="grid" key={section.games.map((g) => g.id).join()}>
              {section.games.map((g, i) => <Card key={g.id} game={g} index={i} />)}
            </div>
          </section>
        ))
      ) : (
        <div className="empty">
          <p>No games match “{query}”{category === 'All' ? '' : ` in ${category}`}{age === 'all' ? '' : ` for ${ageName(age)}`}.</p>
          <button className="btn" type="button" onClick={() => setParams({}, { replace: true })}>Show all games</button>
        </div>
      )}
    </>
  );
}
