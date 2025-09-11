import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  MoveUpRight,
  Play,
  Pause,
  RotateCcw,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

function sendCommand(cmd: string, payload?: Record<string, unknown>) {
  // Replace with API call to your robot controller if available.
  console.info("robot", cmd, payload ?? {});
}

export function RobotControls() {
  const [autoMode, setAutoMode] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [direction, setDirection] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const holdRef = useRef<number | null>(null);

  const disabled = autoMode;

  useEffect(() => {
    const id = setInterval(() => {
      if (!autoMode) {
        sendCommand("teleop", { direction, speed });
      } else {
        sendCommand("auto_roam", { speed });
      }
    }, 500);
    return () => clearInterval(id);
  }, [autoMode, direction, speed]);

  const setDir = useCallback((x: number, y: number) => {
    setDirection({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  }, []);

  const startHold = useCallback(
    (cmd: string, payload?: Record<string, unknown>) => {
      if (holdRef.current) return;
      sendCommand(cmd, payload);
      holdRef.current = window.setInterval(
        () => sendCommand(cmd, payload),
        250,
      );
    },
    [],
  );
  const endHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
      sendCommand("stop");
    }
  }, []);

  const dirButtons = useMemo(
    () => [
      { label: "Forward", x: 0, y: -1 },
      { label: "Left", x: -1, y: 0 },
      { label: "Right", x: 1, y: 0 },
      { label: "Reverse", x: 0, y: 1 },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" /> Robot Control
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge
            variant={autoMode ? "secondary" : "default"}
            className="uppercase"
          >
            {autoMode ? "Auto" : "Manual"}
          </Badge>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Manual</span>
            <Switch
              checked={autoMode}
              onCheckedChange={setAutoMode}
              aria-label="Toggle auto roam"
            />
            <span className="text-muted-foreground">Auto</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <Button
            disabled={disabled}
            variant="outline"
            onMouseDown={() => startHold("forward")}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            Forward
          </Button>
          <div />

          <Button
            disabled={disabled}
            variant="outline"
            onMouseDown={() => startHold("left")}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            Left
          </Button>
          <Button
            disabled={disabled}
            variant="destructive"
            onMouseDown={() => startHold("stop")}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            Stop
          </Button>
          <Button
            disabled={disabled}
            variant="outline"
            onMouseDown={() => startHold("right")}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            Right
          </Button>

          <div />
          <Button
            disabled={disabled}
            variant="outline"
            onMouseDown={() => startHold("reverse")}
            onMouseUp={endHold}
            onMouseLeave={endHold}
          >
            Reverse
          </Button>
          <div />
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Speed</span>
              <span className="tabular-nums">{speed}%</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              min={0}
              max={100}
              step={1}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {dirButtons.map((b) => (
              <Button
                key={b.label}
                variant="ghost"
                disabled={disabled}
                onClick={() => setDir(b.x, b.y)}
                className={cn(
                  "justify-start",
                  direction.x === b.x && direction.y === b.y && "bg-primary/10",
                )}
              >
                {b.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendCommand("calibrate")}
            >
              Calibrate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendCommand("home")}
            >
              Return Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendCommand("reset_sensors")}
            >
              Reset Sensors
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Compass className="h-4 w-4" />
            <span>
              Direction: x {direction.x.toFixed(1)}, y {direction.y.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {autoMode ? (
              <Button onClick={() => setAutoMode(false)}>
                <Pause className="mr-2 h-4 w-4" /> Pause Auto
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setAutoMode(true)}>
                <Play className="mr-2 h-4 w-4" /> Start Auto Roam
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setAutoMode(false);
                setSpeed(50);
                setDirection({ x: 0, y: 0 });
                sendCommand("reset_state");
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
