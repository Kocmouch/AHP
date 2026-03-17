import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, TrendingDown, TrendingUp } from "lucide-react";
import type { CriterionDirection } from "./types";

interface Step1DefineStructureProps {
  criteria: string[];
  alternatives: string[];
  criteriaDirections: CriterionDirection[];
  onAddCriterion: () => void;
  onRemoveCriterion: (index: number) => void;
  onRenameCriterion: (index: number, name: string) => void;
  onSetCriterionDirection: (index: number, direction: CriterionDirection) => void;
  onAddAlternative: () => void;
  onRemoveAlternative: (index: number) => void;
  onRenameAlternative: (index: number, name: string) => void;
  onNext?: () => void;
}

export function Step1DefineStructure({
  criteria,
  alternatives,
  criteriaDirections,
  onAddCriterion,
  onRemoveCriterion,
  onRenameCriterion,
  onSetCriterionDirection,
  onAddAlternative,
  onRemoveAlternative,
  onRenameAlternative,
  onNext,
}: Step1DefineStructureProps) {
  const canProceed = criteria.length >= 2 && alternatives.length >= 2;

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-foreground/90 font-black uppercase tracking-[0.05em]">Definicja problemu</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic">
            Zdefiniuj kryteria, którymi będziesz się kierować, oraz alternatywy, które oceniasz.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 whitespace-nowrap">Kryteria wyboru</span>
            <div className="h-px w-full bg-gradient-to-r from-border/50 to-transparent" />
            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter px-2 py-0 border-none bg-muted/20">
              {criteria.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-muted/5 border border-border/10 hover:border-primary/20 transition-all group">
                <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center text-xs font-black shrink-0 border border-primary/10">
                  {i + 1}
                </div>
                <Input
                  value={c}
                  onChange={(e) => onRenameCriterion(i, e.target.value)}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30 h-8"
                  placeholder="Nazwa kryterium..."
                />
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => onSetCriterionDirection(i, criteriaDirections[i] === "min" ? "max" : "min")}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.05em] border transition-all ${
                      criteriaDirections[i] === "min"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    }`}
                  >
                    {criteriaDirections[i] === "min" ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                    {criteriaDirections[i]}
                  </button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveCriterion(i)}
                    disabled={criteria.length <= 1}
                    className="size-8 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={onAddCriterion} 
              className="flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-dashed border-border/20 text-muted-foreground/40 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition-all text-xs font-black uppercase tracking-widest group"
            >
              <Plus className="size-4 group-hover:rotate-90 transition-transform" />
              Dodaj kryterium
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 whitespace-nowrap">Alternatywy</span>
            <div className="h-px w-full bg-gradient-to-r from-border/50 to-transparent" />
            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter px-2 py-0 border-none bg-muted/20">
              {alternatives.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alternatives.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-muted/5 border border-border/10 hover:border-primary/20 transition-all group">
                <div className="size-10 rounded-xl bg-muted/10 text-muted-foreground flex items-center justify-center text-xs font-black shrink-0 border border-border/5">
                  {String.fromCharCode(65 + i)}
                </div>
                <Input
                  value={a}
                  onChange={(e) => onRenameAlternative(i, e.target.value)}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30 h-8"
                  placeholder="Nazwa alternatywy..."
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveAlternative(i)}
                  disabled={alternatives.length <= 1}
                  className="size-8 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            
            <button 
              onClick={onAddAlternative} 
              className="flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-dashed border-border/20 text-muted-foreground/40 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition-all text-xs font-black uppercase tracking-widest group"
            >
              <Plus className="size-4 group-hover:rotate-90 transition-transform" />
              Dodaj alternatywę
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}
