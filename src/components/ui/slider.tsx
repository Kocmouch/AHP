import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]),
    [value, defaultValue, min]
  )

  const isBiDirectional = min < 0 && max > 0 && values.length === 1
  const percentage = values[0] !== undefined ? ((values[0] - min) / (max - min)) * 100 : 50

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted/50 border border-border/50 h-2.5 w-full dark:bg-muted/20"
      >
        {isBiDirectional ? (
          <>
            {/* Center tick */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/20 z-10" />
            {/* Bi-directional range */}
            <div
              className="absolute bg-primary h-full transition-all duration-200"
              style={{
                left: `${Math.min(50, percentage)}%`,
                right: `${100 - Math.max(50, percentage)}%`,
              }}
            />
          </>
        ) : (
          <SliderPrimitive.Range
            data-slot="slider-range"
            className="absolute bg-primary h-full"
          />
        )}
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          className="block size-5 shrink-0 rounded-full border-2 border-primary bg-background shadow-lg ring-ring/50 transition-all hover:scale-110 focus-visible:ring-4 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  )
}


export { Slider }
