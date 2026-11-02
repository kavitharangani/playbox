import { leaderboard } from '../store.js';
import { num, placeClass } from '../utils.js';

function Row({ row, latestAt }) {
  const latest = row.at && row.at === latestAt;
  return (
    <li className={`row${row.mine ? ' mine' : ''}${latest ? ' latest' : ''}`}>
      <span className={`row-place ${placeClass(row.place)}`}>{row.place}</span>
      <span className="row-name">
        {row.name}
        {row.bot && <span className="tag">BOT</span>}
        {row.mine && <span className="tag you">YOU</span>}
      </span>
      <span className="row-score">{num(row.score)}</span>
    </li>
  );
}

// Top rows, plus the player's best run underneath when it falls outside them.
export default function Board({ id, limit, latestAt }) {
  const rows = leaderboard(id);
  const rest = rows.slice(limit);
  const best = rest.find((r) => r.mine);
  const extras = rest.filter((r) => r === best || (latestAt && r.at === latestAt));

  return (
    <ol className="rows">
      {rows.slice(0, limit).map((row, i) => <Row key={`${row.name}-${row.at}-${i}`} row={row} latestAt={latestAt} />)}
      {extras.length > 0 && <li className="rows-gap" aria-hidden="true">···</li>}
      {extras.map((row) => <Row key={`${row.name}-${row.at}`} row={row} latestAt={latestAt} />)}
    </ol>
  );
}
