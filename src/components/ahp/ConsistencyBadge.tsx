import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ConsistencyResult } from "./types";

interface ConsistencyBadgeProps {
  result: ConsistencyResult;
}

export function ConsistencyBadge({ result }: ConsistencyBadgeProps) {
  return (
    <div className="pt-4 border-t border-border/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Współczynnik spójności</span>
          <span className="text-xs font-medium opacity-80">Czy Twoje oceny logicznie się uzupełniają?</span>
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
      <div className="h-[70px] relative">
        {!result.isConsistent ? (
          <div className="absolute inset-0 animate-in zoom-in-95 fade-in duration-300">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 py-3">
              <AlertDescription className="text-[11px] leading-relaxed">
                <span className="font-bold">Niespójność wykryta!</span> Twoje oceny są sprzeczne (powyżej 10%). Spróbuj zweryfikować czy np. jeśli A &gt; B i B &gt; C, to czy na pewno A &gt;&gt; C.

              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/40 italic text-center pt-4">
            Twój model decyzyjny jest spójny i gotowy do obliczeń.
          </p>
        )}
      </div>
    </div>
  );
}

