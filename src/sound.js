// Small synthesised sound effects, so the app needs no audio files and works offline.
const SOUNDS = {
  tap: [[440, .05]],
  flip: [[520, .06]],
  flap: [[560, .05]],
  score: [[660, .07], [880, .09]],
  hit: [[320, .05], [640, .07]],
  bad: [[196, .18]],
  crash: [[180, .12], [110, .22]],
  over: [[392, .12], [330, .12], [262, .22]],
  best: [[523, .1], [659, .1], [784, .1], [1047, .22]],
};
let ctx = null;
let enabled = true;

function tone(freq, at, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(.12, at);
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration);
}

function ready() {
  if (!enabled) return false;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  } catch (e) {
    return false;
  }
}

function play(name) {
  if (!ready()) return;
  let at = ctx.currentTime;
  SOUNDS[name].forEach(([freq, duration]) => {
    tone(freq, at, duration);
    at += duration * .8;
  });
}

function note(freq, duration) {
  if (ready()) tone(freq, ctx.currentTime, duration);
}

function setEnabled(value) {
  enabled = value;
}

export default { play, note, setEnabled };
