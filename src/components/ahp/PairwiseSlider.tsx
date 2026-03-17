import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { sliderToRatio } from "./ahpEngine";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PairwiseSliderProps {
  nameA: string;
  nameB: string;
  value: number;
  onChange: (v: number) => void;
  highlight?: boolean;
}

export function PairwiseSlider({ nameA, nameB, value, onChange, highlight }: PairwiseSliderProps) {
  const { t } = useTranslation();
  const ratio = sliderToRatio(value);

  let description: string;
  if (value > 0) {
    description = t("slider.isMoreImportant", { itemA: nameA, val: value + 1, itemB: nameB });
  } else if (value === 0) {
    description = t("slider.bothEqual");
  } else {
    description = t("slider.isMoreImportant", { itemA: nameB, val: Math.abs(value) + 1, itemB: nameA });
  }

  const ratioLabel = value > 0 ? `${ratio}:1` : value < 0 ? `1:${Math.abs(value) + 1}` : "1:1";

  return (
    <div className={`space-y-6 transition-all group ${highlight ? "rounded-2xl border border-amber-500/40 bg-amber-500/5 shadow-amber-500/10 p-2 -m-2" : ""}`}>
      {highlight && (
        <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
          ⚠ {t("slider.conflict")}
        </div>
      )}
      <div className="flex items-center justify-between gap-6 relative">
        {/* Left Side */}
        <div className={`flex flex-col flex-1 transition-all duration-300 ${value > 0 ? "translate-x-1" : "opacity-40"}`}>
          <span className={`text-[11px] font-black uppercase tracking-[0.1em] truncate ${value > 0 ? "text-primary" : "text-foreground"}`} title={nameA}>
            {nameA}
          </span>
          <div className={`h-1 w-full mt-1.5 rounded-full transition-all duration-500 ${value > 0 ? "bg-primary/40 w-full" : "bg-border/20 w-8"}`} />
        </div>

        {/* Center Badge */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black tracking-tighter transition-all duration-300 ${
            value === 0 
            ? "bg-muted/20 border-border/50 text-muted-foreground" 
            : "bg-primary/10 border-primary/30 text-primary shadow-sm"
          }`}>
            {ratioLabel}
          </div>
        </div>

        {/* Right Side */}
        <div className={`flex flex-col flex-1 items-end text-right transition-all duration-300 ${value < 0 ? "-translate-x-1" : "opacity-40"}`}>
          <span className={`text-[11px] font-black uppercase tracking-[0.1em] truncate ${value < 0 ? "text-primary" : "text-foreground"}`} title={nameB}>
            {nameB}
          </span>
          <div className={`h-1 w-full mt-1.5 rounded-full transition-all duration-500 ${value < 0 ? "bg-primary/40 w-full" : "bg-border/20 w-8 ml-auto"}`} />
        </div>
      </div>

      <div className="relative px-1 overflow-visible">
        <Slider
          min={-8}
          max={8}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v ?? 0)}
          className="py-2 cursor-pointer"
        />
        {/* Decorative dots for scale */}
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 flex justify-between px-[2px] pointer-events-none opacity-20">
          {[...Array(17)].map((_, i) => (
            <div key={i} className={`size-0.5 rounded-full ${i === 8 ? "bg-primary scale-150" : "bg-foreground"}`} />
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/[0.03] border border-primary/5">
        <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider text-center flex items-center gap-2">
          {value > 0 && <ArrowLeft className="size-3" />}
          {description}
          {value < 0 && <ArrowRight className="size-3" />}
        </p>
      </div>
    </div>
  );
}

