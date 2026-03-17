import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ConsistencyResult } from "./types";
import type { InconsistentPair } from "./ahpEngine";
import { useTranslation } from "react-i18next";

interface ConsistencyBadgeProps {
  result: ConsistencyResult;
  inconsistentPairs?: InconsistentPair[];
  itemNames?: string[];
}

export function ConsistencyBadge({ result, inconsistentPairs, itemNames }: ConsistencyBadgeProps) {
  const { t } = useTranslation();
  return (
    <div className="pt-4 border-t border-border/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t("consistency.status")}</span>
          <span className="text-xs font-medium opacity-80">{result.isConsistent ? t("consistency.consistentModel") : t("consistency.tooHighShort")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={result.isConsistent ? "outline" : "destructive"} className="font-mono px-3">
            CR = {(result.CR * 100).toFixed(1)}%
          </Badge>
          {result.isConsistent && (
            <div className="size-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">✓</div>
          )}
        </div>
      </div>
      
      {/* Reserved space for alert to prevent layout shift */}
      <div className="relative">
        {!result.isConsistent ? (
          <div className="animate-in zoom-in-95 fade-in duration-300">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 py-3">
              <AlertDescription className="text-[11px] leading-relaxed space-y-1.5">
                {inconsistentPairs?.length && itemNames ? (
                  <>
                    <span className="font-bold">{t("consistency.found")}</span> {t("consistency.recommendationShort")}
                    {inconsistentPairs.slice(0, 2).map((p) => {
                      const nameA = itemNames[p.i] ?? "";
                      const nameB = itemNames[p.j] ?? "";
                      const currentLabel = p.currentSlider > 0 ? `${p.currentSlider + 1}:1` : p.currentSlider < 0 ? `1:${Math.abs(p.currentSlider) + 1}` : "1:1";
                      const sugLabel = p.suggestedSlider > 0 ? `${p.suggestedSlider + 1}:1` : p.suggestedSlider < 0 ? `1:${Math.abs(p.suggestedSlider) + 1}` : "1:1";
                      return (
                        <div key={`${p.i}-${p.j}`} className="mt-1 pl-2 border-l-2 border-destructive/40">
                          <span className="font-bold">{nameA} vs {nameB}</span>
                          <span className="text-destructive/70"> — {t("consistency.current")}: {currentLabel} → {t("consistency.suggested")}: {sugLabel}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <><span className="font-bold">{t("consistency.found")}</span> {t("consistency.tooHighShort")}</>
                )}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/40 italic text-center pt-4">
            {t("consistency.consistentModel")}
          </p>
        )}
      </div>
    </div>
  );
}

