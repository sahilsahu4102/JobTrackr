import { useEffect, useState } from 'react';

/** True once `active` has stayed true for `ms`. Used to explain a slow first request:
 *  the demo API runs on a free host that sleeps when idle. */
export const useSlowNote = (active: boolean, ms = 4000): boolean => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return slow;
};

export const WAKING_NOTE =
  'The demo server runs on a free host that sleeps when idle. The first request after a pause can take about a minute. Please wait; nothing is wrong.';
