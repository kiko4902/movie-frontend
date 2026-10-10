import { useCallback, useEffect, useEffectEvent, useState } from 'react';

// Runs `load(signal)` whenever `key` changes and reports loading / error /
// ready. A request that is superseded (the key changed, or the component went
// away) is aborted and its result ignored, so a slow early response can never
// overwrite a later one.
export function useAsync(load, key) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const run = useEffectEvent(load);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data, error: null });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error });
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const settled = result.key === requestKey;

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  // For changes made on this page (e.g. a new review) without refetching.
  const setData = useCallback((update) => {
    setResult((current) => ({ ...current, data: update(current.data) }));
  }, []);

  return {
    status: !settled ? 'loading' : result.error ? 'error' : 'ready',
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    retry,
    setData,
  };
}
