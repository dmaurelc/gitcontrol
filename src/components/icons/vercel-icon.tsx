import { type SVGProps } from "react";

// Official Vercel mark — sourced from simple-icons.
export function VercelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 1.608 12 20.784H0Z" />
    </svg>
  );
}
