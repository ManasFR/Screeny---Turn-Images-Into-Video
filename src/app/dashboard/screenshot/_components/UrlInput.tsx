"use client";

import { KeyboardEvent } from "react";
import { Search, X, Globe } from "lucide-react";

interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onLoad: () => void;
  isLoading: boolean;
}

export default function UrlInput({ value, onChange, onLoad, isLoading }: UrlInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onLoad();
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {/* URL Bar */}
      <div className="flex-1 flex items-center gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 h-12 focus-within:border-[#6ee7b7] transition-colors group">
        <Globe className="w-4 h-4 text-[#555] group-focus-within:text-[#6ee7b7] transition-colors shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL — e.g. github.com"
          className="flex-1 bg-transparent text-sm text-[#e0e0e0] placeholder-[#444] outline-none font-mono"
          spellCheck={false}
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-[#555] hover:text-[#aaa] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Load Button */}
      <button
        onClick={onLoad}
        disabled={!value.trim() || isLoading}
        className="flex items-center gap-2 h-12 px-5 rounded-xl bg-[#6ee7b7] text-[#0a0a0a] text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5dd4a4] active:scale-95 transition-all duration-150 shrink-0"
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
            Loading
          </>
        ) : (
          <>
            <Search className="w-3.5 h-3.5" />
            Preview
          </>
        )}
      </button>
    </div>
  );
}
