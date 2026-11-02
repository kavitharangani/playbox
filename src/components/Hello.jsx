// Splits on whole characters, so names in scripts like Sinhala keep their joined letters.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const lettersOf = (text) => (segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text));

// Each letter runs the same looping animation, started a little later than the one before.
// Words stay in one piece so a line can only wrap between them.
function Letters({ text, from }) {
  let index = from;
  return text.split(/( )/).filter(Boolean).map((part, p) => (part === ' ' ? ' ' : (
    <span className="hello-word" key={p}>
      {lettersOf(part).map((letter, i) => (
        <span className="hello-letter" key={i} style={{ '--i': index++ }}>{letter}</span>
      ))}
    </span>
  )));
}

export default function Hello({ name }) {
  const hi = 'Hi';
  const rest = 'ready to play?';
  const nameStart = lettersOf(hi).length + 1;
  const heartAt = nameStart + lettersOf(name).length;

  return (
    <h1 className="hello" aria-label={`Hi ${name}, ready to play?`}>
      <span aria-hidden="true">
        <Letters text={hi} from={0} />
        {' '}
        <span className="hello-word">
          <span className="hello-name"><Letters text={name} from={nameStart} /></span>
          <span className="hello-letter hello-heart" style={{ '--i': heartAt }}>
            <svg viewBox="0 0 24 24"><path d="M12 21s-8.500-5.300-8.500-11.500A4.800 4.800 0 0 1 12 6.700a4.800 4.800 0 0 1 8.500 2.800C20.500 15.700 12 21 12 21z" /></svg>
          </span>
          <span className="hello-letter" style={{ '--i': heartAt + 1 }}>,</span>
        </span>
        {' '}
        <Letters text={rest} from={heartAt + 3} />
      </span>
    </h1>
  );
}
