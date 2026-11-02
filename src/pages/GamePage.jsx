import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Art, Missing, Trophy } from '../components/Bits.jsx';
import Board from '../components/Board.jsx';
import { ageName, getGame } from '../games/index.js';
import sound from '../sound.js';
import { addScore, nextPlace, stats, useStore } from '../store.js';
import useCountUp from '../useCountUp.js';
import { num, placeClass, placeText } from '../utils.js';

function Countdown({ onDone }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    sound.note(count > 0 ? 440 : 880, .12);
    const timer = setTimeout(() => (count > 0 ? setCount(count - 1) : onDone()), count > 0 ? 600 : 350);
    return () => clearTimeout(timer);
  }, [count]);

  return <div className="countdown" key={count} role="status">{count || 'GO!'}</div>;
}

function Intro({ game, onStart }) {
  return (
    <div className="panel">
      <div className="intro-art" style={{ '--c': game.color }}><Art game={game} /></div>
      <h2>How to play</h2>
      <ul>{game.howTo.map((line) => <li key={line}>{line}</li>)}</ul>
      <button className="btn btn-primary" type="button" onClick={onStart}>▶ Play</button>
    </div>
  );
}

function Result({ game, result, onAgain }) {
  const shown = useCountUp(result.score);
  const title = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    title.current.focus({ preventScroll: true });
    // A short delay so a last frantic tap or key press does not restart the game by accident.
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="panel">
      {result.isBest && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => <i key={i} />)}
        </div>
      )}
      <h2 tabIndex={-1} ref={title}>Game over</h2>
      <div className={`medal ${placeClass(result.place)}`}>
        <strong>{placeText(result.place)}</strong>
        <span>of {result.total}</span>
      </div>
      <p className="result-score">{num(shown)}</p>
      <p className="result-label">points</p>
      {result.isBest && <p className="result-note best">★ New personal best!</p>}
      {!result.isBest && result.best > result.score && <p className="result-note">Your best is {num(result.best)}</p>}
      <p className="result-note">
        {result.next
          ? `${num(result.next.points)} more ${result.next.points === 1 ? 'point' : 'points'} for ${placeText(result.next.place)} place`
          : 'You are at the top of the board!'}
      </p>
      <div className="panel-actions">
        <button className="btn btn-primary" type="button" disabled={!ready} onClick={onAgain}>↻ Play again</button>
        <Link className="btn" to={`/scores/${game.id}`}>See scores</Link>
        <Link className="btn" to="/">All games</Link>
      </div>
    </div>
  );
}

export default function GamePage() {
  useStore();
  const { id } = useParams();
  const game = getGame(id);

  const [phase, setPhase] = useState('intro');
  const [run, setRun] = useState(0);
  const [score, setScore] = useState(0);
  const [bump, setBump] = useState(0);
  const [info, setInfo] = useState('');
  const [result, setResult] = useState(null);

  const stageRef = useRef(null);
  const rootRef = useRef(null);
  const liveRun = useRef(0);
  const current = useRef(0);

  function start() {
    liveRun.current += 1;
    current.current = 0;
    setRun(liveRun.current);
    setScore(0);
    setInfo('');
    setResult(null);
    setPhase('countdown');
    window.scrollTo(0, 0);
  }

  function stopToIntro() {
    liveRun.current += 1;
    setScore(0);
    setPhase('intro');
  }

  function finish(finalScore) {
    liveRun.current += 1;
    const saved = addScore(id, finalScore);
    sound.play(saved.isBest ? 'best' : 'over');
    setScore(finalScore);
    setResult({
      score: finalScore,
      place: saved.place,
      total: saved.total,
      isBest: saved.isBest,
      best: stats(id).best,
      next: nextPlace(id, finalScore),
      at: saved.entry.at,
    });
    setPhase('result');
  }

  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'running') return undefined;
    document.body.classList.add('playing');
    return () => document.body.classList.remove('playing');
  }, [phase === 'countdown' || phase === 'running']);

  // Games draw into a plain element and manage their own canvas, timers and key listeners.
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const root = rootRef.current;
    const isLive = () => run === liveRun.current;
    stageRef.current.focus({ preventScroll: true });
    const destroy = game.mount(root, {
      setScore(n) {
        if (!isLive()) return;
        if (n > current.current) setBump((b) => b + 1);
        current.current = n;
        setScore(n);
      },
      setInfo(text) {
        if (isLive()) setInfo(text);
      },
      end(finalScore) {
        if (isLive()) finish(finalScore);
      },
    });
    return () => {
      if (destroy) destroy();
      root.innerHTML = '';
    };
  }, [phase, run]);

  if (!game) return <Missing />;
  const s = stats(id);

  return (
    <>
      <Link className="back" to="/">← All games</Link>
      <header className="game-head" style={{ '--c': game.color }}>
        <div className="game-icon"><Art game={game} /></div>
        <div>
          <h1>{game.name}</h1>
          <p><span className={`age-tag ${game.age}`}>{ageName(game.age)}</span> {game.category} · {game.description}</p>
        </div>
      </header>
      <div className="game-layout">
        <div>
          <div className="hud">
            <div className="hud-item">
              <span>Score</span>
              <strong key={bump} className={bump ? 'bump' : ''}>{num(score)}</strong>
            </div>
            <div className="hud-item"><span>Your best</span><strong>{s ? num(s.best) : '–'}</strong></div>
            <div className="hud-item"><span>Best place</span><strong>{s ? placeText(s.bestPlace) : '–'}</strong></div>
          </div>
          <div className="stage" ref={stageRef} tabIndex={-1}>
            {phase === 'intro' && <Intro game={game} onStart={start} />}
            {phase === 'countdown' && <Countdown key={run} onDone={() => setPhase('running')} />}
            {phase === 'running' && <div className="game-root" key={run} ref={rootRef} />}
            {phase === 'result' && <Result game={game} result={result} onAgain={start} />}
          </div>
          {phase === 'running' && (
            <div className="run-bar">
              <span className="run-info">{info}</span>
              <button
                className="btn btn-small"
                type="button"
                onClick={() => (current.current > 0 ? finish(current.current) : stopToIntro())}
              >
                End &amp; save
              </button>
              <button className="btn btn-small" type="button" onClick={stopToIntro}>Quit</button>
            </div>
          )}
        </div>
        <aside className="board" aria-label="Leaderboard">
          <h2><Trophy /> Leaderboard</h2>
          <Board id={id} limit={8} latestAt={result && result.at} />
          <Link className="board-link" to={`/scores/${id}`}>Full leaderboard →</Link>
        </aside>
      </div>
    </>
  );
}
