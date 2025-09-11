import { useEffect, useState } from "react";
import { Bell, OctagonAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export type DangerEvent = {
  id: string;
  type: "chemical" | "drowning" | "hardware" | "unknown";
  message: string;
  severity: "low" | "medium" | "high";
  at: Date;
};

export function AlertCenter() {
  const [events, setEvents] = useState<DangerEvent[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.08) {
        const e: DangerEvent = {
          id: `${Date.now()}`,
          type: Math.random() < 0.5 ? "chemical" : "unknown",
          message:
            Math.random() < 0.5
              ? "Abnormal chlorine variance detected near deep end."
              : "Restricted motion detected. Possible obstruction.",
          severity: Math.random() < 0.7 ? "medium" : "high",
          at: new Date(),
        };
        setEvents((prev) => [e, ...prev].slice(0, 5));
        toast.error(e.message, {
          description: `${e.severity.toUpperCase()} • ${e.at.toLocaleTimeString()}`,
        });
      }
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const hasCritical = events.some((e) => e.severity === "high");

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={hasCritical ? "destructive" : "outline"}
        size="icon"
        aria-label="Alerts"
        onClick={() => setVisible((v) => !v)}
      >
        <Bell className="h-4 w-4" />
      </Button>
      {events.length > 0 && (
        <Badge variant={hasCritical ? "destructive" : "secondary"}>
          {events.length}
        </Badge>
      )}
      {visible && events[0] && (
        <div className="fixed left-1/2 top-20 z-50 w-[92vw] max-w-2xl -translate-x-1/2">
          <Alert
            variant={events[0].severity === "high" ? "destructive" : "default"}
          >
            <OctagonAlert className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              Danger detected
              <span className="text-xs font-normal text-muted-foreground">
                {events[0].at.toLocaleTimeString()}
              </span>
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{events[0].message}</span>
              <div className="flex items-center gap-2">
                <Badge
                  className="uppercase"
                  variant={
                    events[0].severity === "high" ? "destructive" : "secondary"
                  }
                >
                  {events[0].severity}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEvents((prev) => prev.slice(1))}
                >
                  Acknowledge
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
