// A small set of hand-drawn-style leaf shapes, reused consistently as the
// app's signature decorative motif. Kept simple + monochrome-tintable so
// they read as texture, not clutter.

export function LeafSprig({ className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 58C22 40 40 20 70 10C90 3 108 2 118 4C110 14 96 26 78 32C56 39 30 44 2 58Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M6 55C34 42 58 28 90 12"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LeafMark({ className = '' }) {
  // Single leaf used as the app's logo mark.
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 3C9.5 3 4.5 9 4.5 16.5C4.5 24.5 10 30 16 30.5C22 30 27.5 24.5 27.5 16.5C27.5 9 22.5 3 16 3Z"
        fill="currentColor"
      />
      <path
        d="M16 7C15 13 15 20 16 28.5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CornerLeaves({ className = '' }) {
  // Two small overlapping leaves for a card/page corner accent.
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4 76C4 50 20 24 48 12C60 7 70 6 76 7C72 18 64 32 50 42C34 54 16 64 4 76Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M0 60C10 44 26 30 44 24"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
