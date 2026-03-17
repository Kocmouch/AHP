import * as React from "react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Users, User } from "lucide-react";
import { computeFinalScores } from "./ahpEngine";
import type { ConsistencyResult, Expert } from "./types";
import { useTranslation } from "react-i18next";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface Step4ResultsProps {
  experts: Expert[];
  alternatives: string[];
  criteria: string[];
  aggregatedFinalScores: number[];
  aggregatedCriteriaWeights: number[];
  aggregatedAltWeights: number[][];
  aggregatedCriteriaResult: ConsistencyResult;
  aggregatedAltResults: ConsistencyResult[];
  expertCriteriaResults: ConsistencyResult[];
  expertAltResults: ConsistencyResult[][];
  onBack?: () => void;
  onRestart: () => void;
}

export function Step4Results({
  experts,
  alternatives,
  criteria,
  aggregatedFinalScores,
  aggregatedCriteriaWeights,
  aggregatedAltWeights,
  aggregatedCriteriaResult,
  aggregatedAltResults,
  expertCriteriaResults,
  expertAltResults,
  onBack,
  onRestart,
}: Step4ResultsProps) {
  const { t, i18n } = useTranslation();
  const [activeView, setActiveView] = useState<"aggregated" | string>("aggregated");

  const baseCriteriaWeights = useMemo(() => {
    if (activeView === "aggregated") return aggregatedCriteriaWeights;
    const idx = experts.findIndex((e) => e.id === activeView);
    return expertCriteriaResults[idx]?.weights ?? aggregatedCriteriaWeights;
  }, [activeView, experts, aggregatedCriteriaWeights, expertCriteriaResults]);

  const baseAltWeights = useMemo(() => {
    if (activeView === "aggregated") return aggregatedAltWeights;
    const idx = experts.findIndex((e) => e.id === activeView);
    const expertRes = expertAltResults[idx];
    return expertRes ? expertRes.map((r) => r.weights) : aggregatedAltWeights;
  }, [activeView, experts, aggregatedAltWeights, expertAltResults]);

  const baseCriteriaResult = useMemo(() => {
    if (activeView === "aggregated") return aggregatedCriteriaResult;
    const idx = experts.findIndex((e) => e.id === activeView);
    return expertCriteriaResults[idx] ?? aggregatedCriteriaResult;
  }, [activeView, experts, aggregatedCriteriaResult, expertCriteriaResults]);

  const baseAltResults = useMemo(() => {
    if (activeView === "aggregated") return aggregatedAltResults;
    const idx = experts.findIndex((e) => e.id === activeView);
    return expertAltResults[idx] ?? aggregatedAltResults;
  }, [activeView, experts, aggregatedAltResults, expertAltResults]);

  const baseFinalScores = useMemo(() => {
    if (activeView === "aggregated") return aggregatedFinalScores;
    return computeFinalScores(baseCriteriaWeights, baseAltWeights);
  }, [activeView, aggregatedFinalScores, baseCriteriaWeights, baseAltWeights]);

  const [sensWeights, setSensWeights] = useState<number[]>(() =>
    (aggregatedCriteriaWeights ?? []).map((w) => w * 100)
  );

  React.useEffect(() => {
    setSensWeights(baseCriteriaWeights.map((w) => w * 100));
  }, [baseCriteriaWeights]);

  function onSensChange(index: number, newVal: number) {
    setSensWeights((prev) => {
      const clamped = Math.max(0, Math.min(100, newVal));
      const oldVal = prev[index] ?? 0;
      const delta = clamped - oldVal;
      if (delta === 0) return prev;
      const othersSum = prev.reduce<number>((s, v, i) => i === index ? s : s + v, 0);
      const next = prev.map((v, i) => {
        if (i === index) return clamped;
        if (othersSum === 0) return v;
        return Math.max(0, v - delta * (v / othersSum));
      });
      const total = next.reduce((s, v) => s + v, 0);
      return total > 0 ? next.map((v) => (v / total) * 100) : next;
    });
  }

  const liveScores = useMemo(() => {
    const normalized = sensWeights.map((w) => w / 100);
    return computeFinalScores(normalized, baseAltWeights);
  }, [sensWeights, baseAltWeights]);

  const isModified = sensWeights.some(
    (w, i) => Math.abs(w - (baseCriteriaWeights[i] ?? 0) * 100) > 0.5
  );

  function generatePDF() {
    import("html2pdf.js").then((mod) => {
      const html2pdf = mod.default;
      const el = document.getElementById("ahp-report");
      if (!el) return;
      html2pdf(el, {
        margin: [15, 15],
        filename: "raport-ahp.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      });
    });
  }

  const ranked = alternatives
    .map((name, i) => ({ name, score: liveScores[i] ?? 0, originalIndex: i }))
    .sort((a, b) => b.score - a.score);

  const barData = ranked.map((r) => ({
    name: r.name,
    score: parseFloat((r.score * 100).toFixed(2)),
  }));

  const pieData = criteria.map((name, i) => ({
    name,
    value: parseFloat((sensWeights[i] ?? 0).toFixed(2)),
  }));

  const activeExpertName = activeView === "aggregated"
    ? t("step4.aggregatedResults")
    : experts.find((e) => e.id === activeView)?.name ?? "";

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-xl font-bold tracking-tight text-foreground/90 font-black uppercase tracking-[0.05em]">{t("step4.title")}</h2>
              </div>
              <p className="text-sm text-muted-foreground font-medium italic">
                {t("step4.description")}
              </p>
            </div>
            <div className="relative group/btn">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="shrink-0 rounded-xl border-primary/10 text-muted-foreground/40 cursor-not-allowed font-black uppercase text-[10px] tracking-widest gap-2 bg-muted/5"
              >
                <FileDown className="size-4 opacity-20" />
                {t("step4.generateReport")}
              </Button>
              <div className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-tighter backdrop-blur-md shadow-lg shadow-amber-500/5">
                Coming Soon
              </div>
            </div>
          </div>

          {/* Expert / Aggregated selector — only show when >1 expert */}
          {experts.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveView("aggregated")}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  activeView === "aggregated"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                }`}
              >
                <Users className="size-3" />
                {t("step4.aggregatedResults")}
              </button>
              <div className="w-px h-4 bg-border/20 mx-1 shrink-0" />
              {experts.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setActiveView(e.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                    activeView === e.id
                      ? "bg-accent text-accent-foreground shadow-lg"
                      : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  <User className="size-3" />
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">{t("step4.ranking")}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
            </div>

            <div className="space-y-4">
              {ranked.map((item, rank) => (
                <div
                  key={item.originalIndex}
                  className={`relative overflow-hidden group flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${
                    rank === 0
                      ? "bg-primary/5 border-primary/30 shadow-xl shadow-primary/5"
                      : "bg-muted/5 border-border/10 hover:bg-muted/10"
                  }`}
                >
                  {rank === 0 && (
                    <div className="absolute top-0 right-0 p-1">
                      <div className="bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-xl border-l border-b border-primary/20">
                        {t("step4.winner")}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 ${
                      rank === 0
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 rotate-3"
                        : "bg-muted/40 text-muted-foreground group-hover:bg-muted"
                    }`}>
                      {rank + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold tracking-tight ${rank === 0 ? "text-primary" : "text-foreground/80"}`}>
                        {item.name}
                      </span>
                      {rank === 0 && <span className="text-[10px] text-primary/60 font-bold uppercase tracking-wider">{t("step4.bestChoice")}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-lg font-black tracking-tighter ${rank === 0 ? "text-primary" : "text-foreground/70"}`}>
                      {(item.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-7 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bar chart */}
              <div className="p-8 rounded-[40px] bg-muted/5 border border-border/10 space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("step4.distribution")}</span>
                  <h3 className="text-xs font-black uppercase text-foreground/80">{t("step4.resultDetails")}</h3>
                </div>
                <div className="space-y-6 pt-2">
                  {barData.map((item, i) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-primary">{item.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden border border-border/5">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out rounded-full"
                          style={{ width: `${item.score}%`, transitionDelay: `${i * 100}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donut */}
              <div className="p-8 rounded-[40px] bg-muted/5 border border-border/10 space-y-6 flex flex-col items-center">
                <div className="flex flex-col gap-1 self-start w-full">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("step4.weight")}</span>
                  <h3 className="text-xs font-black uppercase text-foreground/80">{t("step4.selectionCriteria")}</h3>
                </div>
                <div className="relative size-36 mt-4">
                  <svg className="size-full -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/10" />
                    {(() => {
                      let currentOffset = 0;
                      return pieData.map((item, i) => {
                        const strokeDasharray = `${item.value} 100`;
                        const strokeDashoffset = -currentOffset;
                        currentOffset += item.value;
                        return (
                          <circle
                            key={item.name}
                            cx="50" cy="50" r="42"
                            fill="transparent"
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth="10"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-in-out"
                            style={{ transitionDelay: `${i * 150}ms` }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-primary">{criteria.length}</span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">{t("step4.elements")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-background/40 border border-border/5">
                      <div className="size-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[9px] font-bold text-muted-foreground truncate max-w-[60px]">{item.name.toLowerCase()}</span>
                      <span className="text-[9px] font-black text-foreground/60">{Math.round(item.value)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sensitivity */}
            <div className="p-8 rounded-[40px] bg-muted/5 border border-border/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("step4.simulation")}</span>
                  <h3 className="text-xs font-black uppercase text-foreground/80">{t("step4.sensitivityAnalysis")}</h3>
                </div>
                {isModified && (
                  <button
                    type="button"
                    onClick={() => setSensWeights(baseCriteriaWeights.map((w) => w * 100))}
                    className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-xl transition-all"
                  >
                    {t("step4.reset")}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground/60 font-medium">
                {t("step4.simulationDescription")}
              </p>
              <div className="space-y-5">
                {criteria.map((name, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[11px] font-bold text-foreground/80">{name}</span>
                      </div>
                      <span className="text-[11px] font-black text-primary tabular-nums">
                        {(sensWeights[i] ?? 0).toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0} max={100} step={0.5}
                      value={sensWeights[i] ?? 0}
                      onChange={(e) => onSensChange(i, parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted/30 accent-primary"
                      style={{
                        background: `linear-gradient(to right, ${CHART_COLORS[i % CHART_COLORS.length]} 0%, ${CHART_COLORS[i % CHART_COLORS.length]} ${sensWeights[i] ?? 0}%, var(--muted) ${sensWeights[i] ?? 0}%, var(--muted) 100%)`
                      }}
                    />
                  </div>
                ))}
              </div>
              {isModified && (
                <div className="pt-2 border-t border-border/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {t("step4.simulationMode")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden PDF report */}
      <div
        id="ahp-report"
        style={{
          position: "absolute", left: "-9999px", top: 0,
          width: "794px", fontFamily: "Georgia, serif", color: "#111",
          backgroundColor: "#fff", padding: "40px 48px",
          fontSize: "13px", lineHeight: "1.6",
        }}
      >
        <div style={{ borderBottom: "2px solid #111", paddingBottom: "16px", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{t("step4.reportTitle")}</h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: "11px" }}>
            {t("step4.generatedOn", { 
              view: activeExpertName, 
              date: new Date().toLocaleDateString(i18n.language === "pl" ? "pl-PL" : "en-US", { year: "numeric", month: "long", day: "numeric" }) 
            })}
          </p>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "6px" }}>
            {t("step4.criteriaAndWeights")}
          </h2>
          <p style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>
            CR: {(baseCriteriaResult.CR * 100).toFixed(2)}% — {baseCriteriaResult.isConsistent ? t("step4.consistent") : t("step4.inconsistent")}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ textAlign: "left", padding: "6px 10px", border: "1px solid #ddd" }}>{t("steps.criteria")}</th>
                <th style={{ textAlign: "right", padding: "6px 10px", border: "1px solid #ddd" }}>{t("step4.weight")}</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((name, i) => (
                <tr key={i}>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd" }}>{name}</td>
                  <td style={{ textAlign: "right", padding: "6px 10px", border: "1px solid #ddd" }}>{((baseCriteriaWeights[i] ?? 0) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "6px" }}>
            {t("step4.finalRanking")}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ textAlign: "center", padding: "6px 10px", border: "1px solid #ddd" }}>{t("step4.place")}</th>
                <th style={{ textAlign: "left", padding: "6px 10px", border: "1px solid #ddd" }}>{t("step4.alternative")}</th>
                <th style={{ textAlign: "right", padding: "6px 10px", border: "1px solid #ddd" }}>{t("step4.score")}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((item, rank) => (
                <tr key={item.originalIndex} style={{ backgroundColor: rank === 0 ? "#f0fdf4" : "transparent" }}>
                  <td style={{ textAlign: "center", padding: "6px 10px", border: "1px solid #ddd" }}>{rank + 1}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #ddd", fontWeight: rank === 0 ? "bold" : "normal" }}>{item.name}</td>
                  <td style={{ textAlign: "right", padding: "6px 10px", border: "1px solid #ddd" }}>{(item.score * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: "1px solid #ddd", paddingTop: "12px", marginTop: "32px", fontSize: "10px", color: "#888", display: "flex", justifyContent: "space-between" }}>
          <span>{t("footer.tagline")}</span>
          <span>{new Date().toLocaleDateString(i18n.language === "pl" ? "pl-PL" : "en-US")}</span>
        </div>
      </div>
    </div>
  );
}
