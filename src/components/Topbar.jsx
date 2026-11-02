import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog } from './Bits.jsx';
import sound from '../sound.js';
import { getPlayer, getPref, hasPlayer, setPlayer, setPref, useStore } from '../store.js';
import { applyTheme, THEMES } from '../theme.js';

const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function NameDialog({ open, onClose }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(hasPlayer() ? getPlayer() : '');
  }, [open]);

  function close() {
    if (!hasPlayer()) setPlayer('Player');
    onClose();
  }

  return (
    <Dialog open={open} onClose={close}>
      <form method="dialog" onSubmit={() => setPlayer(name)}>
        <h2>Who's playing?</h2>
        <p>Your scores and places are saved under this name.</p>
        <label htmlFor="name-input">Player name</label>
        <input
          id="name-input"
          maxLength={16}
          autoComplete="nickname"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Save</button>
      </form>
    </Dialog>
  );
}

function SettingsDialog({ open, onClose }) {
  const theme = getPref('theme', 'indigo');
  const soundOn = getPref('sound', true);

  return (
    <Dialog open={open} onClose={onClose}>
      <form method="dialog">
        <h2>Settings</h2>
        <p className="set-label">Theme colour</p>
        <div className="swatches" role="group" aria-label="Theme colour">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className="swatch"
              type="button"
              style={{ '--s': t.color }}
              aria-label={t.name}
              title={t.name}
              aria-pressed={t.id === theme}
              onClick={() => {
                setPref('theme', t.id);
                applyTheme(t.id);
              }}
            />
          ))}
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={soundOn}
            onChange={(e) => {
              setPref('sound', e.target.checked);
              sound.setEnabled(e.target.checked);
              sound.play('tap');
            }}
          />
          {' '}Sound effects
        </label>
        <button className="btn btn-primary" type="submit">Done</button>
      </form>
    </Dialog>
  );
}

export default function Topbar() {
  useStore();
  const { pathname } = useLocation();
  const onScores = pathname.startsWith('/scores');
  const [nameOpen, setNameOpen] = useState(() => !hasPlayer());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(() => isIos() && !isStandalone());

  useEffect(() => {
    // iPhones have no install prompt, so the button shows the manual steps instead.
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setShowInstall(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setIosOpen(true);
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstall(false);
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="2" y="6.500" width="20" height="12" rx="6" /><path d="M8 9.800v5.400M5.300 12.500h5.400" className="cut" /><circle cx="15.200" cy="14" r="1.300" className="dot" /><circle cx="18" cy="11" r="1.300" className="dot" /></svg>
          </span>
          Playbox
        </Link>
        <nav className="nav" aria-label="Main">
          <Link to="/" className={onScores ? '' : 'active'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="11" rx="5.5" /><path d="M8 10v5M5.500 12.500h5M15.500 11.500h.01M18 14h.01" /></svg>
            <span>Games</span>
          </Link>
          <Link to="/scores" className={onScores ? 'active' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v6a5 5 0 0 1-10 0zM7 6H3.500v1.500A3.500 3.500 0 0 0 7 11M17 6h3.500v1.500A3.500 3.500 0 0 1 17 11M12 15v4M8 20h8" /></svg>
            <span>My scores</span>
          </Link>
          {showInstall && (
            <button className="install-btn" type="button" onClick={install}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
              <span>Install app</span>
            </button>
          )}
        </nav>
        <button className="player-btn" type="button" title="Change player" onClick={() => setNameOpen(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
          <span>{getPlayer()}</span>
        </button>
        <button className="settings-btn" type="button" aria-label="Settings" title="Settings" onClick={() => setSettingsOpen(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M18 7h2M4 17h2M11 17h9" /><circle cx="15.500" cy="7" r="2.500" /><circle cx="8.500" cy="17" r="2.500" /></svg>
        </button>
      </header>

      <NameDialog open={nameOpen} onClose={() => setNameOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Dialog open={iosOpen} onClose={() => setIosOpen(false)}>
        <form method="dialog">
          <h2>Install Playbox</h2>
          <p>In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>.</p>
          <button className="btn btn-primary" type="submit">Got it</button>
        </form>
      </Dialog>
    </>
  );
}
