export function EyeLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className={className}>
      <circle cx="256" cy="256" r="248" fill="#0284c7" />
      <path
        d="M256 168c-72 0-132 46-168 88 36 42 96 88 168 88s132-46 168-88c-36-42-96-88-168-88z"
        fill="#ffffff"
      />
      <circle cx="256" cy="256" r="46" fill="#0f172a" />
      <circle cx="272" cy="240" r="13" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}
