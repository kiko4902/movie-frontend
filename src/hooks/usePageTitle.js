import { useEffect } from 'react';

const SITE = 'MovieDB';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
