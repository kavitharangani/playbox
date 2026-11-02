import { Link, useParams } from 'react-router-dom';
import { Art, Missing, Trophy } from '../components/Bits.jsx';
import Board from '../components/Board.jsx';
import { games, getGame } from '../games/index.js';
import { getPlayer, recent, stats, useStore } from '../store.js';
import useCountUp from '../useCountUp.js';
import { num, placeText } from '../utils.js';

export default function Scores() {
  useStore();
  const { id } = useParams();
  const played = games.map((game) => ({ game, stats: stats(game.id) }));
  const plays = useCountUp(played.reduce((sum, p) => sum + (p.stats ? p.stats.plays : 0), 0));
  const firsts = useCountUp(played.filter((p) => p.stats && p.stats.bestPlace === 1).length);
  const tried = useCountUp(played.filter((p) => p.stats).length);
  if (id && !getGame(id)) return <Missing />;

  const selected = getGame(id) || (played.find((p) => p.stats) || played[0]).game;
  const latest = recent(8);

  return (
    <>
      <h1 className="page-title">{getPlayer()}'s scores</h1>
      <p className="page-sub">Your best score and place in every game.</p>
      <div className="summary">
        <div><strong>{plays}</strong><span>Games played</span></div>
        <div><strong>{tried} / {games.length}</strong><span>Games tried</span></div>
        <div><strong>{firsts}</strong><span>1st places</span></div>
      </div>
      <div className="scores-layout">
        <div>
          <div className="score-list">
            {played.map(({ game, stats: s }, i) => (
              <Link
                key={game.id}
                className="score-item"
                to={`/scores/${game.id}`}
                style={{ '--c': game.color, '--i': i }}
                aria-current={game === selected ? 'true' : undefined}
              >
                <span className="score-icon"><Art game={game} /></span>
                <span className="score-main">
                  <strong>{game.name}</strong>
                  <span>{s ? `${s.plays} ${s.plays === 1 ? 'play' : 'plays'}` : 'Not played yet'}</span>
                </span>
                <span className="score-side">
                  {s ? <>{num(s.best)}<small>{placeText(s.bestPlace)} of {s.total}</small></> : '–'}
                </span>
              </Link>
            ))}
          </div>
          <h2 className="section-title">Recent plays</h2>
          {latest.length > 0 ? (
            <div className="score-list">
              {latest.map((r) => (
                <div key={`${r.game.id}-${r.at}`} className="score-item" style={{ '--c': r.game.color }}>
                  <span className="score-icon"><Art game={r.game} /></span>
                  <span className="score-main">
                    <strong>{r.game.name}</strong>
                    <span>{new Date(r.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </span>
                  <span className="score-side">{num(r.score)}<small>{placeText(r.place)} of {r.total}</small></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Nothing yet. <Link to="/">Pick a game</Link> to get on the board.</p>
          )}
        </div>
        <aside className="board" aria-label={`${selected.name} leaderboard`}>
          <h2><Trophy /> {selected.name}</h2>
          <Board id={selected.id} limit={15} />
          <Link className="board-link" to={`/game/${selected.id}`}>Play {selected.name} →</Link>
        </aside>
      </div>
    </>
  );
}
