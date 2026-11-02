import { useEffect, useState } from 'react';

// Counts a number up from 0 when it first appears.
export default function useCountUp(target) {
  const [shown, setShown] = useState(() => {
    const animate = target > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    return animate ? 0 : target;
  });

  useEffect(() => {
    if (shown === target) return undefined;
    let step = 0;
    const steps = 20;
    const id = setInterval(() => {
      step++;
      setShown(Math.round((target * step) / steps));
      if (step === steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);

  return shown;
}
