import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar.jsx';
import { Missing } from './components/Bits.jsx';
import Home from './pages/Home.jsx';
import GamePage from './pages/GamePage.jsx';
import Scores from './pages/Scores.jsx';

// Remounted for each page, so the page's entrance animation plays once and then gets out of the way.
function Page() {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setEntering(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className={`view${entering ? ' enter' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<GamePage />} />
        <Route path="/scores" element={<Scores />} />
        <Route path="/scores/:id" element={<Scores />} />
        <Route path="*" element={<Missing />} />
      </Routes>
    </main>
  );
}

const BG_SHAPES = ['＋', '○', '△', '×', '□', '○', '＋', '△', '×', '□'];

// Ripple from the press point on any button-style control.
function addRipple(e) {
  const el = e.target.closest('.btn, .chip');
  if (!el || el.disabled) return;
  const box = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${e.clientX - box.left}px`;
  ripple.style.top = `${e.clientY - box.top}px`;
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 550);
}

function Shell() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.addEventListener('pointerdown', addRipple);
    return () => document.removeEventListener('pointerdown', addRipple);
  }, []);

  return (
    <>
      <div className="bg-shapes" aria-hidden="true">
        {BG_SHAPES.map((shape, i) => <i key={i}>{shape}</i>)}
      </div>
      <Topbar />
      <Page key={pathname} />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
