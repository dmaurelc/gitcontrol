type Props = {
  className?: string;
};

export function NodeMark({ className }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M7.8 7.8 L11.2 16.2" />
      <path d="M16.2 7.8 L12.8 16.2" />
      <path d="M8 6 L16 6" />
    </svg>
  );
}
