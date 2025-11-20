import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Navigation, Play, Pause, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveKit } from "@/components/pool/LivekitProvider";
import { Room } from "livekit-client";

// ---------------------------------------------------------
// LiveKit Command Sender
// ---------------------------------------------------------
function sendCommand(room: Room | null, cmd: string, payload?: Record<string, unknown>) {
  if (!room) {
    console.warn("⚠️ No LiveKit room available to send command");
    return;
  }
  const message = JSON.stringify({ cmd, ...payload });
  room.localParticipant.publishData(new TextEncoder().encode(message), { reliable: true });
  console.log("➡️ Sent command:", message);
}

// ---------------------------------------------------------
// Joystick Component (unchanged)
// ---------------------------------------------------------
const JOYSTICK_RATE = 5;
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
  disabled
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
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const scale = dist > maxDist ? maxDist / dist : 1;
      dx *= scale;
      dy *= scale;

      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

      throttleJoystickSend(() => {
        onMove(dx / maxDist, dy / maxDist);
      });
    };

    const end = () => {
      if (!isActive.current || !knobRef.current) return;
      isActive.current = false;

      knobRef.current.style.transition = "transform 100ms ease-out";
      knobRef.current.style.transform = "translate(0,0)";
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
        "relative w-48 h-48 rounded-full bg-muted border flex items-center justify-center",
        "shadow-inner select-none touch-none cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      onPointerDown={(e) => {
        if (disabled) return;
        isActive.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
    >
      <div
        ref={knobRef}
        className="absolute w-16 h-16 bg-primary rounded-full shadow-2xl"
      />
    </div>
  );
}

// ---------------------------------------------------------
// MAIN ROBOT CONTROLS UI
// ---------------------------------------------------------
export function RobotControls() {
  const { room } = useLiveKit();
  const [autoMode, setAutoMode] = useState(false);

  const endMotion = () => sendCommand(room, "stop");

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" /> Robot Control
        </CardTitle>

        <div className="flex items-center gap-3">
          <Badge variant={autoMode ? "secondary" : "default"} className="uppercase">
            {autoMode ? "Auto" : "Manual"}
          </Badge>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Manual</span>
            <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            <span className="text-muted-foreground">Auto</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col md:flex-row items-center justify-center gap-10 pt-6">

        {/* JOYSTICK ONLY */}
        <div className="flex flex-col items-center gap-4">
          <Joystick
            disabled={autoMode}
            onMove={(x, y) => sendCommand(room, "set_direction", { x, y })}
            onEnd={endMotion}
          />
          <p className="text-sm text-muted-foreground">Drag to move the robot</p>
        </div>

        {/* AUTO / STOP CONTROLS */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {!autoMode ? (
            <Button size="lg" className="w-full" onClick={() => setAutoMode(true)}>
              <Play className="h-4 w-4 mr-2" /> Start Auto Roam
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="w-full" onClick={() => setAutoMode(false)}>
              <Pause className="h-4 w-4 mr-2" /> Pause Auto
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            onClick={() => sendCommand(room, "stop")}
            className="w-full"
          >
            <Square className="h-4 w-4 mr-2" /> Stop
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
