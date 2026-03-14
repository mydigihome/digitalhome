interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="fixed top-6 right-6 flex items-center gap-1.5 z-50">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-6 h-2 bg-foreground'
              : i + 1 < current
              ? 'w-2 h-2 bg-foreground/40'
              : 'w-2 h-2 bg-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}
