"use client";

interface Props {
  step: string;
  pct: number;
  message: string;
}

const STEP_COLORS: Record<string, string> = {
  init: "#6ee7b7",
  loading: "#6ee7b7",
  cookies: "#f59e0b",
  delay: "#a78bfa",
  scrolling: "#06b6d4",
  screenshot: "#6ee7b7",
  done: "#6ee7b7",
};

export default function SSProgressBar({ step, pct, message }: Props) {
  const color = STEP_COLORS[step] ?? "#6ee7b7";

  return (
    <div className="px-4 py-2 border-b border-[#252525] bg-[#141414]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#bbb]">{message}</span>
        <span className="text-xs font-mono text-[#6ee7b7]">{pct}%</span>
      </div>
      <div className="h-1 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
