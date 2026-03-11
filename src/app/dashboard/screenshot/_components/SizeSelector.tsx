"use client";

import { Smartphone, Tablet, Laptop, Monitor } from "lucide-react";
import { DeviceSize, DEVICE_SIZES } from "@/hooks/useScreenshot";

interface SizeSelectorProps {
  selected: DeviceSize;
  onChange: (size: DeviceSize) => void;
}

const ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor,
};

export default function SizeSelector({ selected, onChange }: SizeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#555] font-mono mr-1 shrink-0">VIEWPORT</span>
      <div className="flex gap-1.5">
        {(Object.keys(DEVICE_SIZES) as DeviceSize[]).map((size) => {
          const Icon = ICONS[size];
          const config = DEVICE_SIZES[size];
          const isActive = selected === size;

          return (
            <button
              key={size}
              onClick={() => onChange(size)}
              title={`${config.label} — ${config.width}×${config.height}`}
              className={`
                flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/40"
                    : "bg-[#0f0f0f] text-[#666] border border-[#222] hover:border-[#444] hover:text-[#aaa]"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{config.label}</span>
              <span
                className={`hidden lg:block text-[10px] font-mono ${isActive ? "text-[#6ee7b7]/60" : "text-[#444]"}`}
              >
                {config.width}w
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
