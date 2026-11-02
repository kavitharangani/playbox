import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import art from '../art.js';

// The game art is static SVG written in art.js, never user input.
export function Art({ game }) {
  return <span className="art" dangerouslySetInnerHTML={{ __html: art[game.art || game.id] || game.icon }} />;
}

export function Trophy() {
  return (
    <svg className="trophy" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h10v6a5 5 0 0 1-10 0zM7 6H3.500v1.500A3.500 3.500 0 0 0 7 11M17 6h3.500v1.500A3.500 3.500 0 0 1 17 11M12 15v4M8 20h8" />
    </svg>
  );
}

export function Dialog({ open, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Submitting closes the dialog too, and the browser can delay its close event in a background tab.
  return <dialog ref={ref} className="dialog" onClose={onClose} onSubmit={onClose}>{children}</dialog>;
}

export function Missing() {
  return (
    <div className="empty">
      <p>That page doesn't exist.</p>
      <Link className="btn" to="/">Back to games</Link>
    </div>
  );
}
