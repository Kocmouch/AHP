import * as React from "react";
import { useState, useMemo } from "react";
import type { AHPState } from "./types";
import { buildMatrix, computeWeights, computeFinalScores, rawValuesToSliders, aggregateByGeometricMean } from "./ahpEngine";
import { Step0Experts } from "./Step0Experts";
import { Step1DefineStructure } from "./Step1DefineStructure";
import { Step2CriteriaMatrix } from "./Step2CriteriaMatrix";
import { Step3AlternativeMatrices } from "./Step3AlternativeMatrices";
import { Step4Results } from "./Step4Results";
import { Button } from "@/components/ui/button";
import { Users, Settings2, Scale, Layers, Trophy, Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

// Removed hardcoded STEP_LABELS as they depend on translation hook
const STEP_KEYS = [
  "steps.numExperts",
  "steps.numStructure",
  "steps.numCriteria",
  "steps.numAlternatives",
  "steps.numResults",
];

const STEP_ICONS = [Users, Settings2, Scale, Layers, Trophy];

function makeSliders(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0) as number[]);
}

function makeAltSliders(numCriteria: number, numAlts: number): number[][][] {
  return Array.from({ length: numCriteria }, () => makeSliders(numAlts, numAlts));
}

function makeRawValues(numCriteria: number, numAlts: number): (number | null)[][] {
  return Array.from({ length: numCriteria }, () => Array(numAlts).fill(null));
}

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

function resizeExpertCriteriaSliders(numExperts: number, newN: number, old: number[][][]): number[][][] {
  return Array.from({ length: numExperts }, (_, e) => resizeCriteriaSliders(newN, old[e] ?? []));
}

function resizeExpertAltSliders(numExperts: number, newNumCriteria: number, newNumAlts: number, old: number[][][][]): number[][][][] {
  return Array.from({ length: numExperts }, (_, e) => resizeAltSliders(newNumCriteria, newNumAlts, old[e] ?? []));
}

export function AHPCalculator() {
  const { t, i18n } = useTranslation();

  const [state, setState] = useState<AHPState>(() => ({
    experts: [{ id: "e1", name: "step0.expertPlaceholder|1" }],
    expertCriteriaSliders: [makeSliders(3, 3)],
    expertAltSliders: [makeAltSliders(3, 3)],
    criteria: [
      "defaults.price",
      "defaults.quality",
      "defaults.brand"
    ],
    alternatives: [
      "defaults.optionA",
      "defaults.optionB",
      "defaults.optionC"
    ],
    criteriaDirections: ["min", "max", "max"],
    criteriaRawValues: makeRawValues(3, 3),
    activeStep: 0,
  }));

  // State repair logic: Handles translations of default values (Cena -> Price, etc.)
  React.useEffect(() => {
    setState((s) => {
      let changed = false;

      // We define a map of all known default values in both languages to their keys
      // This ensures we can ALWAYS catch them even during language transitions
      const defaultToKey: Record<string, string> = {
        "Cena": "defaults.price", "Price": "defaults.price",
        "Jakość": "defaults.quality", "Quality": "defaults.quality",
        "Marka": "defaults.brand", "Brand": "defaults.brand",
        "Opcja A": "defaults.optionA", "Option A": "defaults.optionA",
        "Opcja B": "defaults.optionB", "Option B": "defaults.optionB",
        "Opcja C": "defaults.optionC", "Option C": "defaults.optionC",
        "defaults.price": "defaults.price", "defaults.quality": "defaults.quality", "defaults.brand": "defaults.brand",
        "defaults.optionA": "defaults.optionA", "defaults.optionB": "defaults.optionB", "defaults.optionC": "defaults.optionC"
      };

      const newCriteria = s.criteria.map((c) => {
        const key = defaultToKey[c];
        if (key) {
          const trans = t(key);
          if (trans !== c) {
            changed = true;
            return trans;
          }
        }
        return c;
      });

      const newAlternatives = s.alternatives.map((a) => {
        const key = defaultToKey[a];
        if (key) {
          const trans = t(key);
          if (trans !== a) {
            changed = true;
            return trans;
          }
        }
        return a;
      });

      const newExperts = s.experts.map((e) => {
        // Handle placeholders: "Ekspert 1", "Expert 1", "step0.expertPlaceholder|1"
        if (e.name.includes("|") || e.name.startsWith("Ekspert ") || e.name.startsWith("Expert ")) {
          const n = parseInt(e.name.split(" ").pop() ?? "1") || 1;
          const trans = t("step0.expertPlaceholder", { n });
          if (trans !== e.name) {
            changed = true;
            return { ...e, name: trans };
          }
        }
        return e;
      });

      if (!changed) return s;
      return { ...s, criteria: newCriteria, alternatives: newAlternatives, experts: newExperts };
    });
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // ── expert handlers ──────────────────────────────────────────────────────

  function onAddExpert() {
    setState((s) => {
      const n = s.experts.length + 1;
      return {
        ...s,
        experts: [...s.experts, { id: crypto.randomUUID(), name: t("step0.expertPlaceholder", { n: n, defaultValue: `Expert ${n}` }) }],
        expertCriteriaSliders: [...s.expertCriteriaSliders, makeSliders(s.criteria.length, s.criteria.length)],
        expertAltSliders: [...s.expertAltSliders, makeAltSliders(s.criteria.length, s.alternatives.length)],
      };
    });
  }

  function onRemoveExpert(index: number) {
    setState((s) => ({
      ...s,
      experts: s.experts.filter((_, i) => i !== index),
      expertCriteriaSliders: s.expertCriteriaSliders.filter((_, i) => i !== index),
      expertAltSliders: s.expertAltSliders.filter((_, i) => i !== index),
    }));
  }

  function onRenameExpert(index: number, name: string) {
    setState((s) => {
      const experts = [...s.experts];
      experts[index] = { ...experts[index]!, name };
      return { ...s, experts };
    });
  }

  // ── criteria handlers ────────────────────────────────────────────────────

  function onAddCriterion() {
    setState((s) => {
      const n = s.criteria.length + 1;
      return {
        ...s,
        criteria: [...s.criteria, t("defaults.criterion", { n: n, defaultValue: `Criterion ${n}` })],
        criteriaDirections: [...s.criteriaDirections, "max"],
        expertCriteriaSliders: resizeExpertCriteriaSliders(s.experts.length, n, s.expertCriteriaSliders),
        expertAltSliders: resizeExpertAltSliders(s.experts.length, n, s.alternatives.length, s.expertAltSliders),
        criteriaRawValues: resizeRawValues(n, s.alternatives.length, s.criteriaRawValues),
      };
    });
  }

  function onRemoveCriterion(index: number) {
    setState((s) => {
      const criteria = s.criteria.filter((_, i) => i !== index);
      const n = criteria.length;
      const newExpertCriteria = s.expertCriteriaSliders.map((sliders) =>
        resizeCriteriaSliders(n, sliders.filter((_, i) => i !== index).map(row => row.filter((_, j) => j !== index)))
      );
      const newExpertAlt = s.expertAltSliders.map((sliders) =>
        resizeAltSliders(n, s.alternatives.length, sliders.filter((_, i) => i !== index))
      );
      return {
        ...s,
        criteria,
        criteriaDirections: s.criteriaDirections.filter((_, i) => i !== index),
        expertCriteriaSliders: newExpertCriteria,
        expertAltSliders: newExpertAlt,
        criteriaRawValues: resizeRawValues(n, s.alternatives.length, s.criteriaRawValues.filter((_, i) => i !== index)),
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
        alternatives: [...s.alternatives, t("defaults.option", { n: String.fromCharCode(64 + n), defaultValue: `Option ${String.fromCharCode(64 + n)}` })],
        expertAltSliders: resizeExpertAltSliders(s.experts.length, s.criteria.length, n, s.expertAltSliders),
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
        expertAltSliders: resizeExpertAltSliders(s.experts.length, s.criteria.length, alternatives.length, s.expertAltSliders),
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

  function onCriteriaSliderChange(expertIndex: number, i: number, j: number, value: number) {
    setState((s) => {
      const expertCriteriaSliders = s.expertCriteriaSliders.map((sliders, e) => {
        if (e !== expertIndex) return sliders;
        const updated = sliders.map((row) => [...row]);
        if (!updated[i]) updated[i] = [];
        updated[i]![j] = value;
        return updated;
      });
      return { ...s, expertCriteriaSliders };
    });
  }

  function onAltSliderChange(expertIndex: number, c: number, i: number, j: number, value: number) {
    setState((s) => {
      const expertAltSliders = s.expertAltSliders.map((sliders, e) => {
        if (e !== expertIndex) return sliders;
        const updated = sliders.map((crit) => crit.map((row) => [...row]));
        if (!updated[c]) updated[c] = [];
        if (!updated[c]![i]) updated[c]![i] = [];
        updated[c]![i]![j] = value;
        return updated;
      });
      return { ...s, expertAltSliders };
    });
  }

  function onRawValueChange(criterionIndex: number, altIndex: number, value: number | null) {
    setState((s) => {
      const criteriaRawValues = s.criteriaRawValues.map((row) => [...row]);
      if (!criteriaRawValues[criterionIndex]) criteriaRawValues[criterionIndex] = [];
      criteriaRawValues[criterionIndex]![altIndex] = value;
      const newSliders = rawValuesToSliders(
        criteriaRawValues[criterionIndex]!,
        s.criteriaDirections[criterionIndex] ?? "max"
      );
      // broadcast to all experts
      const expertAltSliders = s.expertAltSliders.map((sliders) => {
        const updated = sliders.map((crit) => crit.map((row) => [...row]));
        updated[criterionIndex] = newSliders;
        return updated;
      });
      return { ...s, criteriaRawValues, expertAltSliders };
    });
  }

  function onSetStep(n: number) {
    setState((s) => ({ ...s, activeStep: n }));
  }

  function onRestart() {
    setState({
      experts: [{ id: "e1", name: "step0.expertPlaceholder|1" }],
      expertCriteriaSliders: [makeSliders(3, 3)],
      expertAltSliders: [makeAltSliders(3, 3)],
      criteria: [
        "defaults.price",
        "defaults.quality",
        "defaults.brand"
      ],
      alternatives: [
        "defaults.optionA",
        "defaults.optionB",
        "defaults.optionC"
      ],
      criteriaDirections: ["min", "max", "max"],
      criteriaRawValues: makeRawValues(3, 3),
      activeStep: 0,
    });
  }

  // ── computed values ──────────────────────────────────────────────────────

  const aggregatedCriteriaSliders = useMemo(
    () => aggregateByGeometricMean(state.expertCriteriaSliders, state.criteria.length),
    [state.expertCriteriaSliders, state.criteria.length]
  );

  const criteriaResult = useMemo(
    () => computeWeights(buildMatrix(state.criteria.length, aggregatedCriteriaSliders)),
    [state.criteria.length, aggregatedCriteriaSliders]
  );

  const expertCriteriaResults = useMemo(
    () => state.expertCriteriaSliders.map((s) => computeWeights(buildMatrix(state.criteria.length, s))),
    [state.expertCriteriaSliders, state.criteria.length]
  );

  const aggregatedAltSliders = useMemo(
    () => state.criteria.map((_, ci) =>
      aggregateByGeometricMean(state.expertAltSliders.map((e) => e[ci] ?? []), state.alternatives.length)
    ),
    [state.criteria.length, state.expertAltSliders, state.alternatives.length]
  );

  const altResults = useMemo(
    () => aggregatedAltSliders.map((s) => computeWeights(buildMatrix(state.alternatives.length, s))),
    [aggregatedAltSliders, state.alternatives.length]
  );

  const expertAltResults = useMemo(
    () => state.expertAltSliders.map((expertSliders) =>
      state.criteria.map((_, ci) =>
        computeWeights(buildMatrix(state.alternatives.length, expertSliders[ci] ?? []))
      )
    ),
    [state.expertAltSliders, state.criteria.length, state.alternatives.length]
  );

  const finalScores = useMemo(() => {
    const altWeights = altResults.map((r) => r.weights);
    return computeFinalScores(criteriaResult.weights, altWeights);
  }, [criteriaResult.weights, altResults]);

  const projectStatus = useMemo(() => {
    switch (state.activeStep) {
      case 0: {
        return {
          label: t("steps.experts"),
          value: `${state.experts.length} ekspertów`,
          color: "bg-emerald-500",
          shadow: "shadow-emerald-500/40",
          description: "Zarządzaj listą ekspertów"
        };
      }
      case 1: {
        const canProceed = state.criteria.length >= 2 && state.alternatives.length >= 2;
        return {
          label: t("sidebar.status.structureLabel"),
          value: canProceed ? t("sidebar.status.readyToEvaluate") : t("sidebar.status.requiresDefinition"),
          color: canProceed ? "bg-emerald-500" : "bg-amber-500",
          shadow: canProceed ? "shadow-emerald-500/40" : "shadow-amber-500/40",
          description: t("sidebar.status.structureDescription", { criteriaCount: state.criteria.length, alternativesCount: state.alternatives.length })
        };
      }
      case 2: {
        const consistent = criteriaResult.isConsistent;
        return {
          label: t("sidebar.status.criteriaLabel"),
          value: consistent ? t("sidebar.status.consistencyMaintained") : t("sidebar.status.correctionRequired"),
          color: consistent ? "bg-emerald-500" : "bg-rose-500",
          shadow: consistent ? "shadow-emerald-500/40" : "shadow-rose-500/40",
          description: t("sidebar.status.criteriaDescription", { cr: (criteriaResult.CR * 100).toFixed(1) })
        };
      }
      case 3: {
        const inconsistentCount = altResults.filter(r => !r.isConsistent).length;
        const allConsistent = inconsistentCount === 0;
        return {
          label: t("sidebar.status.alternativesLabel"),
          value: allConsistent ? t("sidebar.status.allCorrect") : t("sidebar.status.inconsistency", { count: inconsistentCount }),
          color: allConsistent ? "bg-emerald-500" : "bg-rose-500",
          shadow: allConsistent ? "shadow-emerald-500/40" : "shadow-rose-500/40",
          description: allConsistent
            ? t("sidebar.status.alternativesDescriptionCorrect")
            : t("sidebar.status.alternativesDescriptionError")
        };
      }
      case 4: {
        return {
          label: t("sidebar.status.finalLabel"),
          value: t("sidebar.status.finalScores"),
          color: "bg-emerald-500",
          shadow: "shadow-emerald-500/40",
          description: t("sidebar.status.finalDescription")
        };
      }
      default:
        return {
          label: t("sidebar.status.label"),
          value: t("sidebar.status.initializing"),
          color: "bg-muted",
          shadow: "shadow-none",
          description: t("sidebar.status.preparing")
        };
    }
  }, [state.activeStep, state.experts.length, state.criteria.length, state.alternatives.length, criteriaResult, altResults]);

  const onNextStep = () => {
    if (state.activeStep < 4) onSetStep(state.activeStep + 1);
  };

  const onPrevStep = () => {
    if (state.activeStep > 0) onSetStep(state.activeStep - 1);
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 lg:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 items-start h-full">

        {/* Sidebar */}
        <aside className="w-full space-y-12 lg:sticky lg:top-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              Decision Intelligence
            </div>
            {/* Language Switcher */}
            <div className="flex items-center gap-2 p-1 w-fit rounded-xl bg-muted/20 border border-border/5">
              <button 
                onClick={() => changeLanguage('pl')}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all ${i18n.language === 'pl' ? 'bg-background text-primary shadow-sm shadow-primary/10' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
              >
                PL
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all ${i18n.language === 'en' ? 'bg-background text-primary shadow-sm shadow-primary/10' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
              >
                EN
              </button>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">
                {t("sidebar.title")} <span className="text-primary/80">{t("sidebar.engine")}</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[240px]">
                {t("sidebar.subTitle")}
              </p>
            </div>
          </div>

          <nav className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-px bg-muted/20 z-0 hidden lg:block" />

            <div className="flex flex-row lg:flex-col justify-between lg:justify-start gap-4 lg:gap-8 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
              {STEP_KEYS.map((key, i) => {
                const isActive = i === state.activeStep;
                const isCompleted = i < state.activeStep;
                const Icon = STEP_ICONS[i] ?? Settings2;
                const label = t(key);

                return (
                  <div key={i} className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 group shrink-0">
                    <button
                      onClick={() => isCompleted && onSetStep(i)}
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
                        {label.includes(". ") ? label.split(". ")[1] : label}
                      </span>
                      <div className={`h-0.5 rounded-full bg-primary/40 transition-all duration-700 hidden lg:block ${isActive ? "w-8 mt-1" : "w-0 opacity-0"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

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

              <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${(state.activeStep + 1) * 20}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full min-w-0 lg:min-w-[800px] xl:min-w-[950px] lg:h-[calc(100vh-80px)]">
          <div className="glass-card w-full h-full rounded-[40px] md:rounded-[56px] shadow-[0_32px_80px_-20px_rgba(var(--primary),0.1)] flex flex-col transition-all duration-700 relative overflow-hidden border border-white/5 bg-background/40 backdrop-blur-3xl">
            <div className="absolute -top-40 -right-40 size-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute -bottom-40 -left-40 size-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />

            <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 transition-all duration-500">
              <div className="min-h-full flex flex-col">
                {state.activeStep === 0 && (
                  <Step0Experts
                    experts={state.experts}
                    onAdd={onAddExpert}
                    onRemove={onRemoveExpert}
                    onRename={onRenameExpert}
                  />
                )}

                {state.activeStep === 1 && (
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

                {state.activeStep === 2 && (
                  <Step2CriteriaMatrix
                    criteria={state.criteria}
                    experts={state.experts}
                    expertSliders={state.expertCriteriaSliders}
                    aggregatedResult={criteriaResult}
                    expertResults={expertCriteriaResults}
                    onSliderChange={onCriteriaSliderChange}
                  />
                )}

                {state.activeStep === 3 && (
                  <Step3AlternativeMatrices
                    criteria={state.criteria}
                    alternatives={state.alternatives}
                    criteriaDirections={state.criteriaDirections}
                    experts={state.experts}
                    expertAltSliders={state.expertAltSliders}
                    aggregatedAltResults={altResults}
                    expertAltResults={expertAltResults}
                    criteriaRawValues={state.criteriaRawValues}
                    onSliderChange={onAltSliderChange}
                    onRawValueChange={onRawValueChange}
                  />
                )}

                {state.activeStep === 4 && (
                  <Step4Results
                    experts={state.experts}
                    alternatives={state.alternatives}
                    criteria={state.criteria}
                    aggregatedFinalScores={finalScores}
                    aggregatedCriteriaWeights={criteriaResult.weights}
                    aggregatedAltWeights={altResults.map((r) => r.weights)}
                    aggregatedCriteriaResult={criteriaResult}
                    aggregatedAltResults={altResults}
                    expertCriteriaResults={expertCriteriaResults}
                    expertAltResults={expertAltResults}
                    onBack={() => onSetStep(3)}
                    onRestart={onRestart}
                  />
                )}
              </div>
            </div>

            <footer className="shrink-0 z-30 bg-background/60 backdrop-blur-xl border-t border-border/10 px-6 md:px-10 lg:px-14 py-8 flex justify-between items-center">
              {state.activeStep === 0 ? (
                <div />
              ) : (
                <Button variant="ghost" onClick={onPrevStep} size="lg" className="rounded-xl px-8 hover:bg-muted/50 font-bold uppercase text-[10px] tracking-widest transition-all">
                  ← {t("navigation.back")}
                </Button>
              )}

              {state.activeStep === 4 ? (
                <Button onClick={onRestart} size="lg" variant="outline" className="rounded-2xl px-12 border-primary/20 text-primary hover:bg-primary/5 transition-all font-black uppercase text-[10px] tracking-widest">
                  {t("navigation.restart")}
                </Button>
              ) : (
                <Button
                  onClick={onNextStep}
                  disabled={state.activeStep === 1 && (state.criteria.length < 2 || state.alternatives.length < 2)}
                  size="lg"
                  className="rounded-xl px-12 shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                >
                  {state.activeStep === 3 ? t("navigation.seeResults") + " →" : t("navigation.next") + " →"}
                </Button>
              )}
            </footer>
          </div>

          <footer className="mt-8 flex justify-between items-center px-6">
            <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em] font-black">{t("footer.tagline")}</span>
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
