import { useState } from 'react';

export const PLACEHOLDER_POSTER = '/poster-placeholder.svg';

// Fixed 2:3 box so the page does not jump as images arrive; falls back to a
// local placeholder when a movie has no poster or the remote image fails.
export default function Poster({ src, title, eager = false, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const usable = src && failedSrc !== src;

  return (
    <img
      className={`poster ${className}`}
      src={usable ? src : PLACEHOLDER_POSTER}
      alt={usable ? `Poster for ${title}` : ''}
      width="300"
      height="450"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}
