// Drawn game art, so cards look the same on every device instead of depending on emoji fonts.
export default (function () {
  const INK = '#12131a';
  const PAPER = '#fff8e7';
  const svg = (body) => `<svg viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
  const tile = (x, y, fill, color, text, size) => `
    <rect x="${x}" y="${y}" width="34" height="34" rx="7" fill="${fill}"/>
    <text x="${x + 17}" y="${y + 18}" text-anchor="middle" dominant-baseline="central"
      font-family="Segoe UI, Roboto, Arial, sans-serif" font-weight="800" font-size="${size}" fill="${color}">${text}</text>`;

  return {
    snake: svg(`
      <path d="M18 74H58V46H30V24H78" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="80" cy="24" r="10" fill="${INK}"/>
      <circle cx="83" cy="21" r="2.6" fill="${PAPER}"/>
      <circle cx="80" cy="66" r="9" fill="${PAPER}"/>
      <path d="M80 58q1-6 6-7" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`),
    2048: svg(`
      ${tile(13, 13, INK, PAPER, '2', 19)}
      ${tile(53, 13, PAPER, INK, '4', 19)}
      ${tile(13, 53, PAPER, INK, '8', 19)}
      ${tile(53, 53, INK, PAPER, '16', 17)}`),
    memory: svg(`
      <g transform="rotate(-12 38 52)">
        <rect x="16" y="22" width="44" height="60" rx="8" fill="${INK}"/>
        <rect x="23" y="29" width="30" height="46" rx="4" fill="none" stroke="${PAPER}" stroke-width="2.5" stroke-dasharray="4 4"/>
      </g>
      <g transform="rotate(10 62 50)">
        <rect x="40" y="20" width="44" height="60" rx="8" fill="${PAPER}"/>
        <path d="M62 34l4.7 9.6 10.6 1.5-7.7 7.5 1.8 10.5-9.4-5-9.4 5 1.8-10.5-7.7-7.5 10.6-1.5z" fill="${INK}"/>
      </g>`),
    whack: svg(`
      <path d="M26 72V46a24 24 0 0 1 48 0v26z" fill="${PAPER}"/>
      <circle cx="41" cy="44" r="3.6" fill="${INK}"/>
      <circle cx="59" cy="44" r="3.6" fill="${INK}"/>
      <ellipse cx="50" cy="54" rx="6" ry="4.4" fill="${INK}"/>
      <rect x="45.5" y="58" width="9" height="7" rx="1.5" fill="${INK}"/>
      <ellipse cx="50" cy="76" rx="40" ry="12" fill="${INK}"/>`),
    math: svg(`
      ${tile(13, 13, INK, PAPER, '+', 25)}
      ${tile(53, 13, PAPER, INK, '−', 25)}
      ${tile(13, 53, PAPER, INK, '×', 25)}
      ${tile(53, 53, INK, PAPER, '÷', 25)}`),
    hopper: svg(`
      <rect x="66" y="0" width="22" height="30" fill="${INK}"/>
      <rect x="62" y="24" width="30" height="9" rx="2" fill="${INK}"/>
      <rect x="66" y="70" width="22" height="30" fill="${INK}"/>
      <rect x="62" y="67" width="30" height="9" rx="2" fill="${INK}"/>
      <circle cx="36" cy="50" r="19" fill="${PAPER}"/>
      <circle cx="43" cy="44" r="3.8" fill="${INK}"/>
      <path d="M53 47l11 5-11 5z" fill="${INK}"/>
      <path d="M18 52q10-4 16 5-9 7-16-5z" fill="${INK}"/>`),
    tictactoe: svg(`
      <path d="M38 14v72M64 14v72M14 38h72M14 64h72" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M18 18l13 13M31 18l-13 13" stroke="${PAPER}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="51" cy="51" r="8" fill="none" stroke="${PAPER}" stroke-width="6"/>
      <path d="M70 70l12 12M82 70l-12 12" stroke="${PAPER}" stroke-width="6" stroke-linecap="round"/>`),
    bricks: svg(`
      <rect x="12" y="16" width="23" height="11" rx="3" fill="${INK}"/>
      <rect x="39" y="16" width="23" height="11" rx="3" fill="${PAPER}"/>
      <rect x="66" y="16" width="23" height="11" rx="3" fill="${INK}"/>
      <rect x="12" y="31" width="23" height="11" rx="3" fill="${PAPER}"/>
      <rect x="66" y="31" width="23" height="11" rx="3" fill="${PAPER}"/>
      <circle cx="51" cy="56" r="7" fill="${PAPER}"/>
      <rect x="30" y="78" width="40" height="9" rx="4.500" fill="${INK}"/>`),
    sequence: svg(`
      <path d="M47 47H15a32 32 0 0 1 32-32z" fill="${INK}"/>
      <path d="M53 47V15a32 32 0 0 1 32 32z" fill="${PAPER}"/>
      <path d="M47 53v32a32 32 0 0 1-32-32z" fill="${PAPER}"/>
      <path d="M53 53h32a32 32 0 0 1-32 32z" fill="${INK}"/>`),
    mines: svg(`
      <path d="M50 16v68M16 50h68M26 26l48 48M74 26L26 74" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="24" fill="${INK}"/>
      <circle cx="41" cy="41" r="6" fill="${PAPER}"/>`),
    wordguess: svg(`
      ${tile(10, 18, INK, PAPER, 'A', 21)}
      ${tile(56, 18, PAPER, INK, '?', 21)}
      <rect x="10" y="66" width="34" height="7" rx="3.500" fill="${INK}"/>
      <rect x="56" y="66" width="34" height="7" rx="3.500" fill="${INK}"/>`),
    shooter: svg(`
      <path d="M50 42l15 40-15-8-15 8z" fill="${PAPER}"/>
      <circle cx="50" cy="60" r="4.500" fill="${INK}"/>
      <rect x="47.500" y="24" width="5" height="12" rx="2.500" fill="${PAPER}"/>
      <path d="M32 22a18 15 0 0 1 36 0v8l-6-4-6 4-6-4-6 4-6-4-6 4z" fill="${INK}"/>
      <circle cx="43" cy="19" r="3" fill="${PAPER}"/>
      <circle cx="57" cy="19" r="3" fill="${PAPER}"/>`),
    stack: svg(`
      <rect x="18" y="72" width="64" height="13" rx="3" fill="${INK}"/>
      <rect x="24" y="56" width="52" height="13" rx="3" fill="${PAPER}"/>
      <rect x="28" y="40" width="40" height="13" rx="3" fill="${INK}"/>
      <rect x="36" y="24" width="34" height="13" rx="3" fill="${PAPER}"/>`),
    carrace: svg(`
      <rect x="31" y="12" width="38" height="76" rx="11" fill="${INK}"/>
      <rect x="25" y="24" width="7" height="17" rx="2" fill="${INK}"/>
      <rect x="68" y="24" width="7" height="17" rx="2" fill="${INK}"/>
      <rect x="25" y="62" width="7" height="17" rx="2" fill="${INK}"/>
      <rect x="68" y="62" width="7" height="17" rx="2" fill="${INK}"/>
      <rect x="37" y="28" width="26" height="15" rx="4" fill="${PAPER}"/>
      <rect x="39" y="66" width="22" height="11" rx="3" fill="${PAPER}"/>
      <rect x="35" y="14" width="8" height="4" rx="1" fill="${PAPER}"/>
      <rect x="57" y="14" width="8" height="4" rx="1" fill="${PAPER}"/>`),
    bikerace: svg(`
      <circle cx="26" cy="68" r="15" fill="${INK}"/>
      <circle cx="26" cy="68" r="6" fill="${PAPER}"/>
      <circle cx="76" cy="68" r="15" fill="${INK}"/>
      <circle cx="76" cy="68" r="6" fill="${PAPER}"/>
      <path d="M26 66l12-22h26l10 22-10-8H44z" fill="${INK}"/>
      <path d="M62 44l-5-13h13" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="38" y="35" width="22" height="7" rx="3" fill="${PAPER}"/>`),
    targets: svg(`
      <circle cx="50" cy="50" r="36" fill="${PAPER}"/>
      <circle cx="50" cy="50" r="25" fill="${INK}"/>
      <circle cx="50" cy="50" r="14" fill="${PAPER}"/>
      <circle cx="50" cy="50" r="5" fill="${INK}"/>
      <path d="M50 4v18M50 78v18M4 50h18M78 50h18" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),
    balloons: svg(`
      <path d="M36 62q5 14 0 28M66 56q-5 16 2 34" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="36" cy="40" rx="19" ry="23" fill="${PAPER}"/>
      <ellipse cx="66" cy="34" rx="19" ry="23" fill="${INK}"/>
      <path d="M31 63h10l-5-5zM61 57h10l-5-5z" fill="${INK}"/>
      <ellipse cx="29" cy="32" rx="4" ry="7" fill="${INK}" opacity=".18"/>`),
    shapes: svg(`
      <circle cx="31" cy="31" r="18" fill="${INK}"/>
      <rect x="55" y="14" width="32" height="32" rx="6" fill="${PAPER}"/>
      <path d="M31 56l19 32H12z" fill="${PAPER}"/>
      <path d="M71 54l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="${INK}"/>`),
    counting: svg(`
      <circle cx="26" cy="27" r="13" fill="${INK}"/>
      <circle cx="74" cy="27" r="13" fill="${INK}"/>
      <circle cx="50" cy="27" r="13" fill="${PAPER}"/>
      <text x="50" y="72" text-anchor="middle" dominant-baseline="central"
        font-family="Segoe UI, Roboto, Arial, sans-serif" font-weight="800" font-size="40" fill="${INK}">3</text>`),
    sudoku: svg(`
      <rect x="12" y="12" width="76" height="76" rx="8" fill="${PAPER}"/>
      <path d="M37.300 12v76M62.600 12v76M12 37.300h76M12 62.600h76" stroke="${INK}" stroke-width="3"/>
      <g font-family="Segoe UI, Roboto, Arial, sans-serif" font-weight="800" font-size="17" fill="${INK}" text-anchor="middle" dominant-baseline="central">
        <text x="24.700" y="25">5</text><text x="50" y="50">9</text><text x="75.300" y="25">2</text><text x="24.700" y="75.300">7</text><text x="75.300" y="75.300">1</text>
      </g>`),
    connect4: svg(`
      <rect x="10" y="16" width="80" height="68" rx="9" fill="${INK}"/>
      ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => {
    const lit = r + c === 3 || (r === 2 && c === 1);
    return `<circle cx="${23 + c * 18}" cy="${32 + r * 18}" r="7" fill="${PAPER}" opacity="${lit ? 1 : .22}"/>`;
  }).join('')).join('')}`),
    typing: svg(`
      <rect x="9" y="28" width="82" height="50" rx="8" fill="${INK}"/>
      ${[0, 1, 2, 3, 4].map((c) => `<rect x="${16 + c * 14}" y="36" width="11" height="10" rx="2" fill="${PAPER}"/>`).join('')}
      ${[0, 1, 2, 3].map((c) => `<rect x="${23 + c * 14}" y="49" width="11" height="10" rx="2" fill="${PAPER}"/>`).join('')}
      <rect x="29" y="63" width="42" height="8" rx="2" fill="${PAPER}"/>`),
    reversi: svg(`
      <rect x="12" y="12" width="76" height="76" rx="7" fill="${INK}"/>
      <circle cx="35" cy="35" r="15" fill="${PAPER}"/>
      <circle cx="65" cy="65" r="15" fill="${PAPER}"/>
      <circle cx="65" cy="35" r="15" fill="${INK}" stroke="${PAPER}" stroke-width="3"/>
      <circle cx="35" cy="65" r="15" fill="${INK}" stroke="${PAPER}" stroke-width="3"/>`),
    codebreaker: svg(`
      <rect x="20" y="42" width="60" height="44" rx="8" fill="${INK}"/>
      <path d="M33 42V30a17 17 0 0 1 34 0v12" fill="none" stroke="${INK}" stroke-width="8"/>
      <circle cx="34" cy="64" r="5.500" fill="${PAPER}"/>
      <circle cx="50" cy="64" r="5.500" fill="${PAPER}"/>
      <circle cx="66" cy="64" r="5.500" fill="${PAPER}"/>`),
    slider: svg(`
      ${tile(12, 12, INK, PAPER, '1', 19)}
      ${tile(54, 12, PAPER, INK, '2', 19)}
      ${tile(12, 54, PAPER, INK, '3', 19)}
      <path d="M58 71h24M74 62l9 9-9 9" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
    reaction: svg(`
      <path d="M58 10L24 56h22l-6 34 36-48H52z" fill="${INK}" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>`),
  };
})();
