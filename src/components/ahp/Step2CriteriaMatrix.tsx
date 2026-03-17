import * as React from "react";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PairwiseSlider } from "./PairwiseSlider";
import { ConsistencyBadge } from "./ConsistencyBadge";
import { buildMatrix, findInconsistentPairs } from "./ahpEngine";
import type { ConsistencyResult, Expert } from "./types";
import { useTranslation } from "react-i18next";

interface Step2CriteriaMatrixProps {
  criteria: string[];
  experts: Expert[];
  expertSliders: number[][][];           // [expertIdx][i][j]
  aggregatedResult: ConsistencyResult;
  expertResults: ConsistencyResult[];
  onSliderChange: (expertIdx: number, i: number, j: number, value: number) => void;
}

export function Step2CriteriaMatrix({
  criteria,
  experts,
  expertSliders,
  aggregatedResult,
  expertResults,
  onSliderChange,
}: Step2CriteriaMatrixProps) {
  const { t } = useTranslation();
  const [activeExpert, setActiveExpert] = useState(0);

  const pairs: [number, number][] = [];
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push([i, j]);
    }
  }

  const currentSliders = expertSliders[activeExpert] ?? [];
  const currentResult = expertResults[activeExpert] ?? aggregatedResult;

  const matrix = useMemo(
    () => buildMatrix(criteria.length, currentSliders),
    [criteria.length, currentSliders]
  );

  const inconsistentPairs = useMemo(
    () => currentResult.isConsistent ? [] : findInconsistentPairs(matrix, currentResult.weights, currentSliders),
    [matrix, currentResult, currentSliders]
  );

  const highlightSet = useMemo(
    () => new Set(inconsistentPairs.slice(0, 2).map(p => `${p.i}-${p.j}`)),
    [inconsistentPairs]
  );

  const multiExpert = experts.length > 1;

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight font-black uppercase tracking-[0.05em]">{t("step2.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic">
            {t("step2.description")}
          </p>
        </div>
      </header>

      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {multiExpert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">{t("step2.expertLabel")}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
            </div>
            <Tabs value={String(activeExpert)} onValueChange={(v) => setActiveExpert(parseInt(v, 10))}>
              <TabsList className="flex flex-wrap h-auto gap-3 bg-transparent p-0 border-none justify-start">
                {experts.map((expert, ei) => (
                  <TabsTrigger
                    key={expert.id}
                    value={String(ei)}
                    className="h-12 px-6 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-border/10 bg-muted/5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/20 transition-all duration-300 hover:bg-muted/20 hover:translate-y-[-2px]"
                  >
                    {expert.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pairs.map(([i, j]) => (
            <div key={`${i}-${j}`} className="group p-6 rounded-3xl bg-muted/5 border border-border/10 hover:bg-muted/10 transition-all duration-300 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
              <PairwiseSlider
                nameA={criteria[i] ?? ""}
                nameB={criteria[j] ?? ""}
                value={currentSliders[i]?.[j] ?? 0}
                onChange={(v) => onSliderChange(activeExpert, i, j, v)}
                highlight={highlightSet.has(`${i}-${j}`)}
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/10 space-y-3">
          <ConsistencyBadge result={currentResult} inconsistentPairs={inconsistentPairs} itemNames={criteria} />
          {multiExpert && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              <span>{t("step2.aggregatedCR")}</span>
              <span className={aggregatedResult.isConsistent ? "text-emerald-400" : "text-rose-400"}>
                {(aggregatedResult.CR * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
