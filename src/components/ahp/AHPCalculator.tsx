import * as React from "react";
import { useState, useMemo } from "react";
import type { AHPState } from "./types";
import { buildMatrix, computeWeights, computeFinalScores, rawValuesToSliders } from "./ahpEngine";
import { Step1DefineStructure } from "./Step1DefineStructure";
import { Step2CriteriaMatrix } from "./Step2CriteriaMatrix";
import { Step3AlternativeMatrices } from "./Step3AlternativeMatrices";
import { Step4Results } from "./Step4Results";
import { Button } from "@/components/ui/button";
import { Settings2, Scale, Layers, Trophy, Check } from "lucide-react";


const STEP_LABELS = [
  "1. Struktura",
  "2. Kryteria",
  "3. Alternatywy",
  "4. Wyniki",
];

function makeSliders(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0) as number[]);
}

function makeAltSliders(numCriteria: number, numAlts: number): number[][][] {
  return Array.from({ length: numCriteria }, () => makeSliders(numAlts, numAlts));
}

function makeRawValues(numCriteria: number, numAlts: number): (number | null)[][] {
  return Array.from({ length: numCriteria }, () => Array(numAlts).fill(null));
}

const INITIAL_STATE: AHPState = {
  criteria: ["Cena", "Jakość", "Marka"],
  alternatives: ["Opcja A", "Opcja B", "Opcja C"],
  criteriaDirections: ["min", "max", "max"],
  criteriaSliders: makeSliders(3, 3),
  altSliders: makeAltSliders(3, 3),
  criteriaRawValues: makeRawValues(3, 3),
  activeStep: 0,
};

export function AHPCalculator() {
  const [state, setState] = useState<AHPState>(INITIAL_STATE);

  // ── helpers for resizing slider arrays ──────────────────────────────────

  function resizeCriteriaSliders(newN: number, old: number[][]): number[][] {
    return Array.from({ length: newN }, (_, i) =>
      Array.from({ length: newN }, (_, j) => old[i]?.[j] ?? 0)
    );
  }

  function resizeAltSliders(newNumCriteria: number, newNumAlts: number, old: number[][][]): number[][][] {
    return Array.from({ length: newNumCriteria }, (_, c) =>
      Array.from({ length: newNumAlts }, (_, i) =>
        Array.from({ length: newNumAlts }, (_, j) => old[c]?.[i]?.[j] ?? 0)
      )
    );
  }

  function resizeRawValues(newNumCriteria: number, newNumAlts: number, old: (number | null)[][]): (number | null)[][] {
    return Array.from({ length: newNumCriteria }, (_, c) =>
      Array.from({ length: newNumAlts }, (_, a) => old[c]?.[a] ?? null)
    );
  }

  // ── criteria handlers ────────────────────────────────────────────────────

  function onAddCriterion() {
    setState((s) => {
      const n = s.criteria.length + 1;
      return {
        ...s,
        criteria: [...s.criteria, `Kryterium ${n}`],
        criteriaDirections: [...s.criteriaDirections, "max"],
        criteriaSliders: resizeCriteriaSliders(n, s.criteriaSliders),
        altSliders: resizeAltSliders(n, s.alternatives.length, s.altSliders),
        criteriaRawValues: resizeRawValues(n, s.alternatives.length, s.criteriaRawValues),
      };
    });
  }

  function onRemoveCriterion(index: number) {
    setState((s) => {
      const criteria = s.criteria.filter((_, i) => i !== index);
      const n = criteria.length;
      const criteriaSliders = resizeCriteriaSliders(n, s.criteriaSliders.filter((_, i) => i !== index).map(row => row.filter((_, j) => j !== index)));
      const altSliders = s.altSliders.filter((_, i) => i !== index);
      const criteriaRawValues = s.criteriaRawValues.filter((_, i) => i !== index);
      return {
        ...s,
        criteria,
        criteriaDirections: s.criteriaDirections.filter((_, i) => i !== index),
        criteriaSliders,
        altSliders: resizeAltSliders(n, s.alternatives.length, altSliders),
        criteriaRawValues: resizeRawValues(n, s.alternatives.length, criteriaRawValues),
      };
    });
  }

  function onRenameCriterion(index: number, name: string) {
    setState((s) => {
      const criteria = [...s.criteria];
      criteria[index] = name;
      return { ...s, criteria };
    });
  }

  function onSetCriterionDirection(index: number, direction: "min" | "max") {
    setState((s) => {
      const criteriaDirections = [...s.criteriaDirections];
      criteriaDirections[index] = direction;
      return { ...s, criteriaDirections };
    });
  }

  // ── alternatives handlers ────────────────────────────────────────────────

  function onAddAlternative() {
    setState((s) => {
      const n = s.alternatives.length + 1;
      return {
        ...s,
        alternatives: [...s.alternatives, `Opcja ${String.fromCharCode(64 + n)}`],
        altSliders: resizeAltSliders(s.criteria.length, n, s.altSliders),
        criteriaRawValues: resizeRawValues(s.criteria.length, n, s.criteriaRawValues),
      };
    });
  }

  function onRemoveAlternative(index: number) {
    setState((s) => {
      const alternatives = s.alternatives.filter((_, i) => i !== index);
      return {
        ...s,
        alternatives,
        altSliders: resizeAltSliders(s.criteria.length, alternatives.length, s.altSliders),
        criteriaRawValues: resizeRawValues(s.criteria.length, alternatives.length, s.criteriaRawValues),
      };
    });
  }

  function onRenameAlternative(index: number, name: string) {
    setState((s) => {
      const alternatives = [...s.alternatives];
      alternatives[index] = name;
      return { ...s, alternatives };
    });
  }

  // ── slider handlers ──────────────────────────────────────────────────────

  function onCriteriaSliderChange(i: number, j: number, value: number) {
    setState((s) => {
      const criteriaSliders = s.criteriaSliders.map((row) => [...row]);
      if (!criteriaSliders[i]) criteriaSliders[i] = [];
      criteriaSliders[i]![j] = value;
      return { ...s, criteriaSliders };
    });
  }

  function onAltSliderChange(c: number, i: number, j: number, value: number) {
    setState((s) => {
      const altSliders = s.altSliders.map((crit) => crit.map((row) => [...row]));
      if (!altSliders[c]) altSliders[c] = [];
      if (!altSliders[c]![i]) altSliders[c]![i] = [];
      altSliders[c]![i]![j] = value;
      return { ...s, altSliders };
    });
  }

  function onRawValueChange(criterionIndex: number, altIndex: number, value: number | null) {
    setState((s) => {
      const criteriaRawValues = s.criteriaRawValues.map((row) => [...row]);
      if (!criteriaRawValues[criterionIndex]) criteriaRawValues[criterionIndex] = [];
      criteriaRawValues[criterionIndex]![altIndex] = value;
      // auto-compute sliders from raw values
      const newSliders = rawValuesToSliders(
        criteriaRawValues[criterionIndex]!,
        s.criteriaDirections[criterionIndex] ?? "max"
      );
      const altSliders = s.altSliders.map((crit) => crit.map((row) => [...row]));
      altSliders[criterionIndex] = newSliders;
      return { ...s, criteriaRawValues, altSliders };
    });
  }

  function onSetStep(n: number) {
    setState((s) => ({ ...s, activeStep: n }));
  }

  function onRestart() {
    setState({
      ...INITIAL_STATE,
      criteriaDirections: ["min", "max", "max"],
      criteriaRawValues: makeRawValues(3, 3),
    });
  }

  // ── computed values ──────────────────────────────────────────────────────

  const criteriaResult = useMemo(() => {
    const matrix = buildMatrix(state.criteria.length, state.criteriaSliders);
    return computeWeights(matrix);
  }, [state.criteria.length, state.criteriaSliders]);

  const altResults = useMemo(() => {
    return state.criteria.map((_, ci) => {
      const matrix = buildMatrix(state.alternatives.length, state.altSliders[ci] ?? []);
      return computeWeights(matrix);
    });
  }, [state.criteria.length, state.alternatives.length, state.altSliders]);

  const finalScores = useMemo(() => {
    const altWeights = altResults.map((r) => r.weights);
    return computeFinalScores(criteriaResult.weights, altWeights);
  }, [criteriaResult.weights, altResults]);

  const projectStatus = useMemo(() => {
    switch (state.activeStep) {
      case 0: {
        const canProceed = state.criteria.length >= 2 && state.alternatives.length >= 2;
        return {
          label: "Struktura projektu",
          value: canProceed ? "Gotowy do oceny" : "Wymaga definicji",
          color: canProceed ? "bg-emerald-500" : "bg-amber-500",
          shadow: canProceed ? "shadow-emerald-500/40" : "shadow-amber-500/40",
          description: `${state.criteria.length} kryteriów • ${state.alternatives.length} opcji`
        };
      }
      case 1: {
        const consistent = criteriaResult.isConsistent;
        return {
          label: "Relacje kryteriów",
          value: consistent ? "Spójność zachowana" : "Wymagana korekta",
          color: consistent ? "bg-emerald-500" : "bg-rose-500",
          shadow: consistent ? "shadow-emerald-500/40" : "shadow-rose-500/40",
          description: `Współczynnik CR: ${(criteriaResult.CR * 100).toFixed(1)}%`
        };
      }
      case 2: {
        const inconsistentCount = altResults.filter(r => !r.isConsistent).length;
        const allConsistent = inconsistentCount === 0;
        return {
          label: "Relacje alternatyw",
          value: allConsistent ? "Wszystkie poprawne" : `Niespójność (${inconsistentCount})`,
          color: allConsistent ? "bg-emerald-500" : "bg-rose-500",
          shadow: allConsistent ? "shadow-emerald-500/40" : "shadow-rose-500/40",
          description: allConsistent 
            ? "Porównania są logicznie spójne" 
            : "Popraw porównania w czerwonych polach"
        };
      }
      case 3: {
        return {
          label: "Finał analizy",
          value: "Wyniki obliczone",
          color: "bg-emerald-500",
          shadow: "shadow-emerald-500/40",
          description: "Możesz teraz przeanalizować ranking"
        };
      }
      default:
        return {
          label: "Status projektu",
          value: "Inicjalizacja...",
          color: "bg-muted",
          shadow: "shadow-none",
          description: "Przygotowywanie sesji"
        };
    }
  }, [state.activeStep, state.criteria.length, state.alternatives.length, criteriaResult, altResults]);

  const onNextStep = () => {
    if (state.activeStep < 3) onSetStep(state.activeStep + 1);
  };

  const onPrevStep = () => {
    if (state.activeStep > 0) onSetStep(state.activeStep - 1);
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 lg:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 items-start h-full">
        
        {/* Sidebar / Navigation Section - Fixed Width */}
        <aside className="w-full space-y-12 lg:sticky lg:top-12">
          {/* Brand/Header Section */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              Decision Intelligence
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">
                AHP <span className="text-primary/80">Engine</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[240px]">
                Profesjonalne wsparcie decyzji oparte na procesie analitycznej hierarchii.
              </p>
            </div>
          </div>

          {/* Vertical Step Indicator */}
          <nav className="relative">
            {/* Vertical Line Connector */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-muted/20 z-0 hidden lg:block" />
            
            <div className="flex flex-row lg:flex-col justify-between lg:justify-start gap-4 lg:gap-8 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
              {STEP_LABELS.map((label, i) => {
                const isActive = i === state.activeStep;
                const isCompleted = i < state.activeStep;
                const Icon = [Settings2, Scale, Layers, Trophy][i] ?? Settings2;
                
                return (
                  <div key={i} className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 group shrink-0">
                    <button
                      onClick={() => i < state.activeStep && onSetStep(i)}
                      disabled={!isCompleted && !isActive}
                      className={`
                        relative z-10 size-12 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0
                        ${isActive 
                          ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/40 rotate-12 scale-110 ring-4 ring-primary/10" 
                          : isCompleted
                          ? "bg-primary/90 text-primary-foreground cursor-pointer hover:rotate-[-6deg] hover:scale-105"
                          : "bg-muted/30 text-muted-foreground/30 cursor-default border border-border/10"
                        }
                      `}
                    >
                      {isCompleted ? <Check className="size-5 stroke-[4]" /> : <Icon className="size-5" />}
                      
                      {isActive && (
                        <span className="absolute -inset-1 rounded-2xl border border-primary/20 animate-pulse" />
                      )}
                    </button>
                    
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                        isActive ? "text-primary translate-x-1" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/20"
                      }`}>
                        {label.split(". ")[1]}
                      </span>
                      <div className={`h-0.5 rounded-full bg-primary/40 transition-all duration-700 hidden lg:block ${isActive ? "w-8 mt-1" : "w-0 opacity-0"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Subtle info card in sidebar */}
          <div className="hidden lg:block p-6 rounded-[32px] bg-muted/5 border border-border/10 space-y-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{projectStatus.label}</h4>
                <div className={`size-1.5 rounded-full ${projectStatus.color} shadow-lg ${projectStatus.shadow} shadow-[0_0_8px_currentColor] transition-all duration-500`} />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-black text-foreground">{projectStatus.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground/60 leading-tight">
                  {projectStatus.description}
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${(state.activeStep + 1) * 25}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area - Absolutely Fixed and Stable */}
        <main className="w-full min-w-0 lg:min-w-[800px] xl:min-w-[950px] lg:h-[calc(100vh-80px)]">
          <div className="glass-card w-full h-full rounded-[40px] md:rounded-[56px] shadow-[0_32px_80px_-20px_rgba(var(--primary),0.1)] flex flex-col transition-all duration-700 relative overflow-hidden border border-white/5 bg-background/40 backdrop-blur-3xl">
            {/* Ambient background glows */}
            <div className="absolute -top-40 -right-40 size-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute -bottom-40 -left-40 size-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            
            {/* Scrollable Container with Custom Scrollbar */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 transition-all duration-500">
              <div className="min-h-full flex flex-col">
                {state.activeStep === 0 && (
                  <Step1DefineStructure
                    criteria={state.criteria}
                    alternatives={state.alternatives}
                    criteriaDirections={state.criteriaDirections}
                    onAddCriterion={onAddCriterion}
                    onRemoveCriterion={onRemoveCriterion}
                    onRenameCriterion={onRenameCriterion}
                    onSetCriterionDirection={onSetCriterionDirection}
                    onAddAlternative={onAddAlternative}
                    onRemoveAlternative={onRemoveAlternative}
                    onRenameAlternative={onRenameAlternative}
                  />
                )}

                {state.activeStep === 1 && (
                  <Step2CriteriaMatrix
                    criteria={state.criteria}
                    sliders={state.criteriaSliders}
                    result={criteriaResult}
                    onSliderChange={onCriteriaSliderChange}
                  />
                )}

                {state.activeStep === 2 && (
                  <Step3AlternativeMatrices
                    criteria={state.criteria}
                    alternatives={state.alternatives}
                    criteriaDirections={state.criteriaDirections}
                    altSliders={state.altSliders}
                    altResults={altResults}
                    criteriaRawValues={state.criteriaRawValues}
                    onSliderChange={onAltSliderChange}
                    onRawValueChange={onRawValueChange}
                  />
                )}

                {state.activeStep === 3 && (
                  <Step4Results
                    alternatives={state.alternatives}
                    criteria={state.criteria}
                    finalScores={finalScores}
                    criteriaWeights={criteriaResult.weights}
                    onBack={() => onSetStep(2)}
                    onRestart={onRestart}
                  />
                )}
              </div>
            </div>

            {/* Navigation Footer - Fixed at the bottom of the glass-card */}
            <footer className="shrink-0 z-30 bg-background/60 backdrop-blur-xl border-t border-border/10 px-6 md:px-10 lg:px-14 py-8 flex justify-between items-center">
              {state.activeStep === 0 ? (
                <div /> // Spacer
              ) : (
                <Button variant="ghost" onClick={onPrevStep} size="lg" className="rounded-xl px-8 hover:bg-muted/50 font-bold uppercase text-[10px] tracking-widest transition-all">
                  ← Powrót
                </Button>
              )}

              {state.activeStep === 3 ? (
                <Button onClick={onRestart} size="lg" variant="outline" className="rounded-2xl px-12 border-primary/20 text-primary hover:bg-primary/5 transition-all font-black uppercase text-[10px] tracking-widest">
                  Zacznij od nowa
                </Button>
              ) : (
                <Button 
                  onClick={onNextStep} 
                  disabled={state.activeStep === 0 && (state.criteria.length < 2 || state.alternatives.length < 2)} 
                  size="lg" 
                  className="rounded-xl px-12 shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                >
                  {state.activeStep === 2 ? "Zobacz wyniki →" : "Dalej →"}
                </Button>
              )}
            </footer>
          </div>
          
          <footer className="mt-8 flex justify-between items-center px-6">
            <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em] font-black">Analytical Hierarchy Process</span>
            <div className="flex gap-4">
              <div className="size-1 rounded-full bg-border" />
              <div className="size-1 rounded-full bg-border" />
              <div className="size-1 rounded-full bg-border" />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

