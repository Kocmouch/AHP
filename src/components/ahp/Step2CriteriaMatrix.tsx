import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PairwiseSlider } from "./PairwiseSlider";
import { ConsistencyBadge } from "./ConsistencyBadge";
import type { ConsistencyResult } from "./types";

interface Step2CriteriaMatrixProps {
  criteria: string[];
  sliders: number[][];
  result: ConsistencyResult;
  onSliderChange: (i: number, j: number, value: number) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function Step2CriteriaMatrix({
  criteria,
  sliders,
  result,
  onSliderChange,
  onBack,
  onNext,
}: Step2CriteriaMatrixProps) {
  const pairs: [number, number][] = [];
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push([i, j]);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight font-black uppercase tracking-[0.05em]">Wagi kryteriów</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic">
            Zdecyduj, które kryteria mają dla Ciebie większe znaczenie. Twoje wybory wpłyną na wagę końcową każdej alternatywy.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pairs.map(([i, j]) => (
            <div key={`${i}-${j}`} className="group p-6 rounded-3xl bg-muted/5 border border-border/10 hover:bg-muted/10 transition-all duration-300 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
              <PairwiseSlider
                nameA={criteria[i] ?? ""}
                nameB={criteria[j] ?? ""}
                value={sliders[i]?.[j] ?? 0}
                onChange={(v) => onSliderChange(i, j, v)}
              />
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-border/10">
          <ConsistencyBadge result={result} />
        </div>
      </div>

    </div>
  );
}
