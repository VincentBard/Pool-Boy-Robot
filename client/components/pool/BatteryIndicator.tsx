import { useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Battery, BatteryCharging } from "lucide-react";
import { cn } from "@/lib/utils";

export function BatteryIndicator() {
  const [level, setLevel] = useState(86);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLevel((prev) => {
        const next = charging ? Math.min(prev + 1, 100) : Math.max(prev - 1, 0);
        return next;
      });
    }, 2500);
    const flip = setInterval(() => setCharging((c) => !c), 20000);
    return () => {
      clearInterval(id);
      clearInterval(flip);
    };
  }, [charging]);

  const color = useMemo(() => {
    if (level <= 15) return "bg-destructive";
    if (level <= 35) return "bg-amber-500";
    return "bg-emerald-500";
  }, [level]);

  return (
    <div
      className="flex items-center gap-2 min-w-[160px]"
      aria-label="Robot battery level"
    >
      {charging ? (
        <BatteryCharging className="h-4 w-4 text-primary" />
      ) : (
        <Battery className="h-4 w-4 text-primary" />
      )}
      <div className="w-[120px]">
        <Progress value={level} className={cn("h-2", color)} />
      </div>
      <span
        className={cn(
          "text-xs tabular-nums",
          level <= 15 && "text-destructive font-semibold",
        )}
      >
        {level}%
      </span>
    </div>
  );
}
