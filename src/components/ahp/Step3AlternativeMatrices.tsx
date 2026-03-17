import * as React from "react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PairwiseSlider } from "./PairwiseSlider";
import { ConsistencyBadge } from "./ConsistencyBadge";
import { TrendingDown, TrendingUp, SlidersHorizontal, Hash } from "lucide-react";
import { buildMatrix, findInconsistentPairs } from "./ahpEngine";
import type { ConsistencyResult, CriterionDirection, Expert } from "./types";
import { useTranslation } from "react-i18next";

interface Step3AlternativeMatricesProps {
  criteria: string[];
  alternatives: string[];
  criteriaDirections: CriterionDirection[];
  experts: Expert[];
  expertAltSliders: number[][][][];          // [expertIdx][criterionIdx][i][j]
  aggregatedAltResults: ConsistencyResult[]; // per kryterium
  expertAltResults: ConsistencyResult[][];   // [expertIdx][criterionIdx]
  criteriaRawValues: (number | null)[][];
  onSliderChange: (expertIdx: number, ci: number, i: number, j: number, value: number) => void;
  onRawValueChange: (ci: number, altIdx: number, value: number | null) => void;
}

export function Step3AlternativeMatrices({
  criteria,
  alternatives,
  criteriaDirections,
  experts,
  expertAltSliders,
  aggregatedAltResults,
  expertAltResults,
  criteriaRawValues,
  onSliderChange,
  onRawValueChange,
}: Step3AlternativeMatricesProps) {
  const { t } = useTranslation();
  const pairs: [number, number][] = [];
  for (let i = 0; i < alternatives.length; i++) {
    for (let j = i + 1; j < alternatives.length; j++) {
      pairs.push([i, j]);
    }
  }

  const [globalMode, setGlobalMode] = useState<"slider" | "values">("slider");
  const [activeTab, setActiveTab] = useState("0");
  const [activeExpert, setActiveExpert] = useState(0);
  const activeCi = parseInt(activeTab, 10);

  const multiExpert = experts.length > 1;

  const currentAltSliders = expertAltSliders[activeExpert] ?? [];
  const currentAltResults = expertAltResults[activeExpert] ?? [];

  const altMatrix = useMemo(
    () => buildMatrix(alternatives.length, currentAltSliders[activeCi] ?? []),
    [alternatives.length, currentAltSliders, activeCi]
  );

  const altInconsistentPairs = useMemo(
    () => currentAltResults[activeCi]?.isConsistent
      ? []
      : findInconsistentPairs(altMatrix, currentAltResults[activeCi]?.weights ?? [], currentAltSliders[activeCi] ?? []),
    [altMatrix, currentAltResults, currentAltSliders, activeCi]
  );

  const altHighlightSet = useMemo(
    () => new Set(altInconsistentPairs.slice(0, 2).map(p => `${p.i}-${p.j}`)),
    [altInconsistentPairs]
  );

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight text-foreground/90 font-black uppercase tracking-[0.05em]">{t("step3.title")}</h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium italic">
              {t("step3.description")}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/30 border border-border/10 shrink-0">
            <button
              type="button"
              onClick={() => setGlobalMode("slider")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                globalMode === "slider"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <SlidersHorizontal className="size-4" /> {t("step3.sliders")}
            </button>
            <button
              type="button"
              onClick={() => setGlobalMode("values")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                globalMode === "values"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Hash className="size-4" /> {t("step3.values")}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {multiExpert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">{t("step3.expertLabel")}</span>
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

        <Tabs defaultValue="0" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">{t("step3.criterionSelection")}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
              </div>

              <TabsList className="flex flex-wrap h-auto gap-3 bg-transparent p-0 border-none justify-start">
                {criteria.map((c, ci) => (
                  <TabsTrigger
                    key={ci}
                    value={String(ci)}
                    className="h-12 px-6 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-border/10 bg-muted/5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/20 transition-all duration-300 hover:bg-muted/20 hover:translate-y-[-2px]"
                  >
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="pt-2">
              {criteria.map((_, ci) => {
                const dir = criteriaDirections[ci] ?? "max";

                return (
                  <TabsContent key={ci} value={String(ci)} className="space-y-8 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                        dir === "min"
                          ? "bg-blue-500/5 text-blue-400 border-blue-500/20"
                          : "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {dir === "min" ? (
                          <><TrendingDown className="size-3.5" /> {t("step3.lessIsBetter")}</>
                        ) : (
                          <><TrendingUp className="size-3.5" /> {t("step3.moreIsBetter")}</>
                        )}
                      </div>
                    </div>

                    {globalMode === "slider" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pairs.map(([i, j]) => (
                          <div key={`${i}-${j}`} className="group p-6 rounded-3xl bg-muted/5 border border-border/10 hover:bg-muted/10 transition-all duration-300 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
                            <PairwiseSlider
                              nameA={alternatives[i] ?? ""}
                              nameB={alternatives[j] ?? ""}
                              value={currentAltSliders[ci]?.[i]?.[j] ?? 0}
                              onChange={(v) => onSliderChange(activeExpert, ci, i, j, v)}
                              highlight={ci === activeCi && altHighlightSet.has(`${i}-${j}`)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {alternatives.map((alt, ai) => (
                          <div key={ai} className="flex flex-col gap-3 p-6 rounded-3xl bg-muted/5 border border-border/10 hover:bg-muted/10 transition-all duration-300 group">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 group-hover:text-primary/70 transition-colors">
                              {alt}
                            </label>
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              placeholder={t("step3.inputValue")}
                              value={criteriaRawValues[ci]?.[ai] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value === "" ? null : parseFloat(e.target.value);
                                onRawValueChange(ci, ai, v === null || isNaN(v) ? null : v);
                              }}
                              className="h-12 bg-background/50 border-border/20 focus:border-primary/40 focus:bg-background transition-all rounded-xl text-sm font-medium"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-border/10 space-y-3">
                      <ConsistencyBadge
                        result={currentAltResults[ci] ?? { weights: [], lambdaMax: 0, CI: 0, CR: 0, isConsistent: true }}
                        inconsistentPairs={ci === activeCi ? altInconsistentPairs : []}
                        itemNames={alternatives}
                      />
                      {multiExpert && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                          <span>{t("step3.aggregatedCR")}</span>
                          <span className={(aggregatedAltResults[ci]?.isConsistent ?? true) ? "text-emerald-400" : "text-rose-400"}>
                            {((aggregatedAltResults[ci]?.CR ?? 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
