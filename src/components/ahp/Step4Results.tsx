import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";



const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface Step4ResultsProps {
  alternatives: string[];
  criteria: string[];
  finalScores: number[];
  criteriaWeights: number[];
  onBack?: () => void;
  onRestart: () => void;
}

export function Step4Results({
  alternatives,
  criteria,
  finalScores,
  criteriaWeights,
  onBack,
  onRestart,
}: Step4ResultsProps) {
  const ranked = alternatives
    .map((name, i) => ({ name, score: finalScores[i] ?? 0, originalIndex: i }))
    .sort((a, b) => b.score - a.score);

  const barData = ranked.map((r) => ({
    name: r.name,
    score: parseFloat((r.score * 100).toFixed(2)),
  }));

  const pieData = criteria.map((name, i) => ({
    name,
    value: parseFloat(((criteriaWeights[i] ?? 0) * 100).toFixed(2)),
  }));

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-foreground/90 font-black uppercase tracking-[0.05em]">Finalne Wyniki</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic">
            Oto obliczony ranking Twoich alternatyw na podstawie zdefiniowanych kryteriów.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">Ranking</span>
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
                        Zwycięzca
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
                      {rank === 0 && <span className="text-[10px] text-primary/60 font-bold uppercase tracking-wider">Najlepszy wybór</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className={`text-lg font-black tracking-tighter ${rank === 0 ? "text-primary" : "text-foreground/70"}`}>
                      {(item.score * 100).toFixed(1)}%
                    </span>
                    <div className={`h-1 rounded-full bg-primary/20 transition-all duration-1000 w-12 ${rank === 0 ? "opacity-100" : "opacity-0"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-7 space-y-10">
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Alternatives Bars */}
              <div className="p-8 rounded-[40px] bg-muted/5 border border-border/10 space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Distribucja %</span>
                  <h3 className="text-xs font-black uppercase text-foreground/80">Szczegóły wyników</h3>
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
                          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                          style={{ 
                            width: `${item.score}%`,
                            transitionDelay: `${i * 100}ms`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Criteria Weights Donut */}
              <div className="p-8 rounded-[40px] bg-muted/5 border border-border/10 space-y-6 flex flex-col items-center">
                <div className="flex flex-col gap-1 self-start w-full">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Wagi</span>
                  <h3 className="text-xs font-black uppercase text-foreground/80">Kryteria wyboru</h3>
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
                            cx="50"
                            cy="50"
                            r="42"
                            fill="transparent"
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth="10"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-in-out hover:strokeWidth-[12px] cursor-help"
                            style={{ transitionDelay: `${i * 150}ms` }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-primary">{criteria.length}</span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Elementy</span>
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
          </div>
        </div>
      </div>

    </div>
  );
}
