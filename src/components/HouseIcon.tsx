export default function HouseIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12L16 4L28 12V26C28 27.1 27.1 28 26 28H6C4.9 28 4 27.1 4 26V12Z"
        stroke="url(#houseGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 28V16H20V28"
        stroke="url(#houseGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="houseGradient" x1="4" y1="4" x2="28" y2="28">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
