import { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Compass, Play, Pause, RotateCcw, Navigation } from "lucide-react";
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
    {/* Directional Buttons */}
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
      <div />
      <Button
        disabled={disabled}
        variant="outline"
        className="aspect-square flex items-center justify-center"
        onMouseDown={() => startHold("forward")}
        onMouseUp={endHold}
        onMouseLeave={endHold}
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
      <div />

      <Button
        disabled={disabled}
        variant="outline"
        className="aspect-square flex items-center justify-center"
        onMouseDown={() => startHold("left")}
        onMouseUp={endHold}
        onMouseLeave={endHold}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <Button
        disabled={disabled}
        variant="destructive"
        className="aspect-square flex items-center justify-center"
        onMouseDown={() => startHold("stop")}
        onMouseUp={endHold}
        onMouseLeave={endHold}
      >
        <Square className="h-6 w-6" />
      </Button>
      <Button
        disabled={disabled}
        variant="outline"
        className="aspect-square flex items-center justify-center"
        onMouseDown={() => startHold("right")}
        onMouseUp={endHold}
        onMouseLeave={endHold}
      >
        <ArrowRight className="h-6 w-6" />
      </Button>

      <div />
      <Button
        disabled={disabled}
        variant="outline"
        className="aspect-square flex items-center justify-center"
        onMouseDown={() => startHold("reverse")}
        onMouseUp={endHold}
        onMouseLeave={endHold}
      >
        <ArrowDown className="h-6 w-6" />
      </Button>
      <div />
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
