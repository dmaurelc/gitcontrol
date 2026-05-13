type Props = {
  className?: string;
};

// Layered Stack mark — ultra thin (1.0 stroke), top nodes
export function NodeMark({ className }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 4 L20 8 L12 12 L4 8 Z" />
      <path d="M4 12 L12 16 L20 12" />
      <path d="M4 16 L12 20 L20 16" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <circle cx="20" cy="8" r="1" fill="currentColor" />
      <circle cx="4" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
