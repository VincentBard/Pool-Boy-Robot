import { useEffect, useRef, useState, useMemo } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {Room, RemoteTrackPublication } from "livekit-client";

// Example camera list (mapped to LiveKit rooms or stream IDs)
const SAMPLE_CAMERAS = [
  { id: 1, name: "Pi Camera 1", roomName: "pool" },
  { id: 2, name: "Pi Camera 2", roomName: "garage" },
];

export function CameraPanel() {
  const [active, setActive] = useState(0);
  const cams = useMemo(() => SAMPLE_CAMERAS, []);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let room: Room | null = null;

    const startStream = async () => {
      const cam = cams[active];
      if (!cam) return;

      // 1. Get token from your backend (Render)
      const resp = await fetch(
        `https://pbrobot.onrender.com/getToken?identity=viewer&roomName=${cam.roomName}`
      );
      const { token } = await resp.json();

      // 2. Connect to LiveKit Cloud
      const room = new Room();
      await room.connect("wss://pbrobot-ir91vwzj.livekit.cloud", token);

      // 3. Subscribe to remote tracks
      room.on("trackSubscribed", (track, publication: RemoteTrackPublication) => {
        if (track.kind === "video" && videoRef.current) {
          const el = track.attach();
          videoRef.current.srcObject = el.srcObject;
        }
      });
    };

    startStream();

    // Cleanup on unmount or when switching cams
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [active, cams]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Live Pool Cameras
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {cams.map((c, i) => (
            <Button
              key={c.id}
              size="sm"
              variant={i === active ? "default" : "outline"}
              onClick={() => setActive(i)}
            >
              {c.name}
            </Button>
          ))}
          <Button size="icon" variant="ghost" aria-label="Refresh feed">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-3 rounded-lg border bg-muted/20 p-2">
            <AspectRatio ratio={16 / 9}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls
                className="h-full w-full rounded-md object-cover"
              />
            </AspectRatio>
          </div>
          <div className="space-y-2">
            {cams.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border p-2 text-left transition-colors",
                  i === active
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-accent"
                )}
              >
                <span className="text-sm font-medium">{c.name}</span>
                <Badge variant={i === active ? "default" : "secondary"}>
                  {i === active ? "Active" : "Idle"}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
