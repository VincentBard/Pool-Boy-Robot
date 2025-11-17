import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Compass, Play, Pause, RotateCcw, Navigation, Joystick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveKit } from "@/components/pool/LivekitProvider";
import { Room } from "livekit-client";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square } from "lucide-react";

function sendCommand(room: Room | null, cmd: string, payload?: Record<string, unknown>) {
  if (!room) {
    console.warn("⚠️ No LiveKit room available to send command");
    return;
  }
  const message = JSON.stringify({ cmd, ...payload });
  room.localParticipant.publishData(new TextEncoder().encode(message), {
    reliable: true,
  });
  console.log("➡️ Sent command:", message);
}

// Throttle joystick updates (Hz)
const JOYSTICK_RATE = 5; // 30 updates/sec

let lastSend = 0;
function throttleJoystickSend(callback: () => void) {
  const now = performance.now();
  if (now - lastSend > 1000 / JOYSTICK_RATE) {
    lastSend = now;
    callback();
  }
}

function Joystick({
  onMove,
  onEnd,
  disabled,
}: {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
  disabled?: boolean;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isActive = useRef(false);

  const maxDist = 50;

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isActive.current || !baseRef.current || !knobRef.current) return;

      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;   // center X
      const cy = rect.top + rect.height / 2;   // center Y

      // current pointer
      const px = e.clientX;
      const py = e.clientY;

      // vector from center to pointer
      let dx = px - cx;
      let dy = py - cy;

      // distance to clamp
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist > maxDist ? maxDist / dist : 1;

      dx *= scale;
      dy *= scale;

      // position knob immediately (no lag)
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

      // normalized direction (-1 to +1)
      const nx = dx / maxDist;
      const ny = dy / maxDist;

      // Throttled send to parent
      throttleJoystickSend(() => {
        onMove(nx, ny);
      });
    };

    const end = () => {
      if (!isActive.current || !knobRef.current) return;
      isActive.current = false;

      // recenter only when fully released
      knobRef.current.style.transition = "transform 100ms ease-out";
      knobRef.current.style.transform = "translate(0px, 0px)";
      setTimeout(() => {
        if (knobRef.current) knobRef.current.style.transition = "";
      }, 120);

      onEnd();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", end);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", end);
    };
  }, [onMove, onEnd]);

  return (
    <div
      ref={baseRef}
      className={cn(
        "relative w-40 h-40 rounded-full bg-muted flex items-center justify-center select-none touch-none",
        disabled && "opacity-50"
      )}
      onPointerDown={(e) => {
        if (disabled) return;
        isActive.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
    >
      <div
        ref={knobRef}
        className="absolute w-16 h-16 bg-primary rounded-full shadow-lg"
        style={{
          transform: "translate(0px, 0px)",
        }}
      />
    </div>
  );
}


export function RobotControls() {
  const { room } = useLiveKit();
  const [autoMode, setAutoMode] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [direction, setDirection] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const holdRef = useRef<number | null>(null);

  const disabled = autoMode;

  const startHold = useCallback(
    (cmd: string, payload?: Record<string, unknown>) => {
      if (!room) return;
      if (holdRef.current) return;
      sendCommand(room, cmd, payload);
      holdRef.current = window.setInterval(() => sendCommand(room, cmd, payload), 250);
    },
    [room]
  );

  const endHold = useCallback(() => {
    if (!room) return;
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
      sendCommand(room, "stop");
    }
  }, [room]);

  const dirButtons = useMemo(
    () => [
      { label: "Forward", x: 0, y: -1 },
      { label: "Left", x: -1, y: 0 },
      { label: "Right", x: 1, y: 0 },
      { label: "Reverse", x: 0, y: 1 },
    ],
    []
  );

  const setDir = (x: number, y: number) => {
    setDirection({ x, y });
    sendCommand(room, "set_direction", { x, y });
  };

  return (
    <Card className="h-full flex flex-col">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <Navigation className="h-5 w-5 text-primary" /> Robot Control
    </CardTitle>
    <div className="flex items-center gap-3">
      <Badge variant={autoMode ? "secondary" : "default"} className="uppercase">
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

  <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 flex-1">
    {/* Joystick Control */}
<div className="flex items-center justify-center w-full">
  <Joystick
    disabled={disabled}
    onMove={(x, y) => {
      setDir(x, y);
    }}
    onEnd={() => {
      endHold();
      setDir(0, 0);
    }}
  />
</div>

    {/* Speed + Other Controls */}
    <div className="space-y-4 flex flex-col justify-between">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Speed</span>
          <span className="tabular-nums">{speed}%</span>
        </div>
        <Slider
          value={[speed]}
          onValueChange={([v]) => {
            setSpeed(v);
            sendCommand(room, "set_speed", { value: v });
          }}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        {autoMode ? (
          <Button className="flex-1" onClick={() => setAutoMode(false)}>
            <Pause className="mr-2 h-4 w-4" /> Pause Auto
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setAutoMode(true)}
          >
            <Play className="mr-2 h-4 w-4" /> Start Auto Roam
          </Button>
        )}
      </div>
    </div>
  </CardContent>
</Card>
  );
}
