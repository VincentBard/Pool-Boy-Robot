import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, RotateCcw, Pencil } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RemoteParticipant,
  RemoteTrackPublication,
  TrackPublication,
  Track,
  RemoteVideoTrack,
  RoomEvent,
} from "livekit-client";
import { useLiveKit } from "@/components/pool/LivekitProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { usePiConnection } from "@/hooks/usePiConnection";


const SAMPLE_CAMERAS = [
  { id: 1, name: "Pi Camera 1", identity: "raspberry" },
  { id: 2, name: "Pi Camera 2", identity: "garage" },
];

export function CameraPanel() {
  const { getAccessTokenSilently } = useAuth0();
  const raspberryOnline = usePiConnection("raspberry");

  const [active, setActive] = useState(0);
  const cams = useMemo(() => SAMPLE_CAMERAS, []);

  const deviceId = "68cc90c7ef0763dddf1a5e9d";

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrack = useRef<RemoteVideoTrack | null>(null);
  const { room } = useLiveKit();

  // -------------------------------------
  // Two Perimeters
  // -------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [shallowPoints, setShallowPoints] = useState<{ x: number; y: number }[]>([]);
  const [deepPoints, setDeepPoints] = useState<{ x: number; y: number }[]>([]);

  const [activeLayer, setActiveLayer] = useState<"shallow" | "deep">("shallow");
  const [editMode, setEditMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoveringNode, setHoveringNode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getPoints = () => (activeLayer === "shallow" ? shallowPoints : deepPoints);
  const setPoints = (fn: any) =>
    activeLayer === "shallow" ? setShallowPoints(fn) : setDeepPoints(fn);

  // -------------------------------------
  // Load Perimeters
  // -------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(
          `https://pbrobot.onrender.com/api/perimeter/${deviceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const raw = await res.json();

        setShallowPoints(raw?.shallow ?? []);
        setDeepPoints(raw?.deep ?? []);
      } catch {
        console.error("Error loading perimeters");
      }
    }
    load();
  }, [active, getAccessTokenSilently]);

  useEffect(() => {
    if (!room || !videoRef.current) return;

    // If Pi just went offline → detach
    if (!raspberryOnline) {
      detachCurrent();
      return;
    }

    // If Pi is online, attach the track
    const participant = Array.from(room.remoteParticipants.values())
      .find((p) => p.identity === cams[active].identity);

    if (!participant) return;

    // Subscribe to existing publications
    participant.trackPublications.forEach(async (pub: RemoteTrackPublication) => {
      if (pub.kind !== Track.Kind.Video) return;
      try {
        if (!pub.isSubscribed) await pub.setSubscribed(true);
      } catch {}
      if (pub.videoTrack) {
        detachCurrent();
        currentVideoTrack.current = pub.videoTrack;
        pub.videoTrack.attach(videoRef.current!);
      }
    });

    // When the track becomes available
    const handleTrackSubscribed = (track: RemoteVideoTrack, pub: RemoteTrackPublication, p: RemoteParticipant) => {
      if (p.identity !== cams[active].identity) return;
      detachCurrent();
      currentVideoTrack.current = track;
      track.attach(videoRef.current!);
    };

    const handleTrackUnsubscribed = () => {
      detachCurrent();
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    };
  }, [raspberryOnline, room, active, cams]);


  // -------------------------------------
  // Save Perimeters
  // -------------------------------------
  async function savePerimeterAPI() {
    try {
      const token = await getAccessTokenSilently();
      await fetch(
        `https://pbrobot.onrender.com/api/perimeter/${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shallow: shallowPoints,
            deep: deepPoints,
          }),
        }
      );
    } catch (err) {
      console.error("Failed to save perimeters:", err);
    }
  }

  const handleSave = async () => {
    await savePerimeterAPI();
    setEditMode(false);
    setShowDropdown(false);
  };

  const handleClear = () => {
    if (activeLayer === "shallow") setShallowPoints([]);
    else setDeepPoints([]);
  };

  // -------------------------------------
  // Canvas Interaction
  // -------------------------------------
  function getXY(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!editMode) return;

    const { x, y } = getXY(e);
    const pts = getPoints();

    for (let i = 0; i < pts.length; i++) {
      const dx = pts[i].x - x;
      const dy = pts[i].y - y;
      if (dx * dx + dy * dy < 14 * 14) {
        setDragIndex(i);
        setIsDragging(true);
        return;
      }
    }

    // Add new point
    setPoints((prev: any) => [...prev, { x, y }]);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getXY(e);
    const pts = getPoints();

    // Detect if hovering over a node
    let overNode = false;
    for (let i = 0; i < pts.length; i++) {
      const dx = pts[i].x - x;
      const dy = pts[i].y - y;
      if (dx * dx + dy * dy < 14 * 14) {
        overNode = true;
        break;
      }
    }
    setHoveringNode(overNode);

    // Dragging behavior
    if (dragIndex === null) return;

    setIsDragging(true);
    setPoints((prev: any) =>
      prev.map((p: any, i: number) => (i === dragIndex ? { x, y } : p))
    );
  }

  function handleMouseUp() {
    setIsDragging(false);
    setDragIndex(null);
  }

  // -------------------------------------
  // Drawing
  // -------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const draw = (pts: any[], stroke: string, fill: string, nodeColor: string) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (editMode) {
        pts.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = i === dragIndex ? "white" : nodeColor;
          ctx.fill();
          ctx.strokeStyle = "black";
          ctx.stroke();
        });
      }
    };

    draw(shallowPoints, "yellow", "rgba(255,255,0,0.25)", "yellow");
    draw(deepPoints, "red", "rgba(255,0,0,0.25)", "red");
  }, [shallowPoints, deepPoints, dragIndex, editMode]);

  // -------------------------------------
  // LiveKit Disconnect Safety
  // -------------------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const noFeedTimer = useRef<any>(null);

  useEffect(() => {
    if (!room) return;

    if (isPlaying) {
      if (noFeedTimer.current) {
        clearTimeout(noFeedTimer.current);
        noFeedTimer.current = null;
      }
    } else {
      if (!noFeedTimer.current) {
        noFeedTimer.current = setTimeout(() => {
          room.disconnect();
          detachCurrent();
        }, 3000);
      }
    }
  }, [isPlaying, room]);

  const detachCurrent = () => {
    if (currentVideoTrack.current && videoRef.current) {
      try {
        currentVideoTrack.current.detach(videoRef.current);
      } catch {}
    }
    currentVideoTrack.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <Card className="overflow-hidden h-full">

      {/* HEADER */}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" /> Live Pool Cameras
        </CardTitle>

        <div className="flex items-center gap-2 relative">

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

          {/* ONE EDIT BUTTON */}
          <div className="relative">
            <Button
              size="icon"
              variant={editMode ? "default" : "outline"}
              onClick={() => setShowDropdown((p) => !p)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Floating dropdown */}
            {showDropdown && (
              <div className="
                absolute top-full right-0 mt-2
                bg-white border shadow-xl rounded-md
                w-56 z-50
              ">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-muted"
                  onClick={() => {
                    setActiveLayer("shallow");
                    setEditMode(true);
                    setShowDropdown(false);
                  }}
                >
                  Edit Pool Perimeter (Yellow)
                </button>

                <button
                  className="w-full text-left px-4 py-2 hover:bg-muted"
                  onClick={() => {
                    setActiveLayer("deep");
                    setEditMode(true);
                    setShowDropdown(false);
                  }}
                >
                  Edit Deep Pool Perimeter (Red)
                </button>
              </div>
            )}
          </div>

          <Button size="icon" variant="ghost" onClick={() => room?.reconnect()}>
            <RotateCcw className="h-4 w-4" />
          </Button>

        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent>

        <div className="w-full md:w-3/4 mx-auto">

          <AspectRatio ratio={16 / 9} className="relative">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover rounded-md z-0"
            />

            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className={`
                absolute inset-0 w-full h-full z-20 
                ${editMode ? (isDragging ? "cursor-grabbing" : hoveringNode ? "cursor-grab" : "cursor-crosshair") : "cursor-default"}
              `}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setHoveringNode(false);
                setIsDragging(false);
              }}
            />


            {!isPlaying && (
              <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No camera feed ⚠️
              </span>
            )}

          </AspectRatio>

          {/* Footer Buttons when editing */}
          {editMode && (
            <div className="flex gap-3 mt-3">
              <Button size="sm" onClick={handleSave}>
                Save Perimeters
              </Button>

              <Button size="sm" variant="destructive" onClick={handleClear}>
                Clear {activeLayer === "shallow"
                  ? "Pool Perimeter"
                  : "Deep Pool Perimeter"}
              </Button>

              {/* Exit Edit Mode button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditMode(false)}
              >
                ❌ Exit Edit Mode
              </Button>
            </div>
          )}

        </div>
      </CardContent>

    </Card>
  );
}
