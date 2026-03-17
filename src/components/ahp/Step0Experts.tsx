import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2 } from "lucide-react";
import type { Expert } from "./types";
import { useTranslation } from "react-i18next";

interface Step0ExpertsProps {
  experts: Expert[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onRename: (index: number, name: string) => void;
}

export function Step0Experts({ experts, onAdd, onRemove, onRename }: Step0ExpertsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/10 px-6 md:px-10 lg:px-14 py-6 md:py-8 lg:py-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight font-black uppercase tracking-[0.05em]">{t("step0.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic">
            {t("step0.description")}
          </p>
        </div>
      </header>

      <div className="flex-1 px-6 md:px-10 lg:px-14 py-11 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-3">
          {experts.map((expert, i) => (
            <div
              key={expert.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/5 border border-border/10 hover:bg-muted/10 transition-all duration-300 hover:border-primary/20 group"
            >
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="size-4 text-primary/70" />
              </div>
              <Input
                value={expert.name}
                onChange={(e) => onRename(i, e.target.value)}
                className="h-10 bg-background/50 border-border/20 focus:border-primary/40 rounded-xl text-sm font-medium flex-1"
                placeholder={t("step0.expertPlaceholder", { n: i + 1 })}
              />
              <Button
                variant="ghost"
                size="icon"
                disabled={experts.length === 1}
                onClick={() => onRemove(i)}
                className="size-9 rounded-xl text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 disabled:opacity-20"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={onAdd}
          disabled={experts.length >= 8}
          className="w-full h-12 rounded-2xl border-dashed border-border/30 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all font-black uppercase text-[10px] tracking-widest gap-2"
        >
          <Plus className="size-4" />
          {t("step0.addExpert")}
        </Button>
      </div>
    </div>
  );
}
