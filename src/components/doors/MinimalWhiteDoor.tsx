interface MinimalWhiteDoorProps {
  isOpen: boolean;
  height?: number;
}

export default function MinimalWhiteDoor({ isOpen, height = 500 }: MinimalWhiteDoorProps) {
  const aspectRatio = 160 / 260;
  const w = Math.round(height * aspectRatio);

  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 160 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Subtle shadow behind door */}
      <defs>
        <filter id="doorShadow" x="-10" y="-5" width="180" height="275">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Main door group */}
      <g
        filter="url(#doorShadow)"
        style={{
          transformOrigin: '15px 130px',
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'perspective(600px) rotateY(-70deg)' : 'perspective(600px) rotateY(0deg)',
        }}
      >
        {/* Door body - arched top */}
        <path
          d="M15 80 C15 36, 45 10, 80 10 C115 10, 145 36, 145 80 L145 255 L15 255 Z"
          fill="#FFFFFF"
          stroke="#1F2937"
          strokeWidth="2"
        />

        {/* Inner frame detail */}
        <path
          d="M28 88 C28 50, 52 28, 80 28 C108 28, 132 50, 132 88 L132 242 L28 242 Z"
          fill="none"
          stroke="#1F2937"
          strokeWidth="1"
          opacity="0.15"
        />

        {/* Door knob (right side) */}
        <circle
          cx="122"
          cy="145"
          r="4"
          fill="#1F2937"
          opacity="0.4"
        />

        {/* Subtle vertical center line */}
        <line
          x1="80"
          y1="88"
          x2="80"
          y2="242"
          stroke="#1F2937"
          strokeWidth="0.5"
          opacity="0.08"
        />
      </g>
    </svg>
  );
}
