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

const SAMPLE_CAMERAS = [
  { id: 1, name: "Pi Camera 1", identity: "raspberry" },
  { id: 2, name: "Pi Camera 2", identity: "garage" },
];

export function CameraPanel() {
  const { getAccessTokenSilently } = useAuth0();

  const [active, setActive] = useState(0);
  const cams = useMemo(() => SAMPLE_CAMERAS, []);

  const deviceId = "68cc90c7ef0763dddf1a5e9d"; // or real Device ID if different

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrack = useRef<RemoteVideoTrack | null>(null);
  const { room } = useLiveKit();

  // -----------------------------------------------------
  // PERIMETER STATE
  // -----------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  //---------------------------------------------------------------------------
  // 🔥 FRONTEND: LOAD PERIMETER (GET)
  //---------------------------------------------------------------------------
  useEffect(() => {
    async function loadPerimeter() {
      try {
        const token = await getAccessTokenSilently();

        const res = await fetch(
          `https://pbrobot.onrender.com/api/perimeter/${deviceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const raw = await res.json();

        if (raw && Array.isArray(raw.perimeter)) {
          setPoints(raw.perimeter);
        } else {
          setPoints([]);
        }
      } catch (err) {
        console.error("Failed to load perimeter:", err);
        setPoints([]);
      }
    }

    loadPerimeter();
  }, [active, deviceId, getAccessTokenSilently]);

  //---------------------------------------------------------------------------
  // 🔥 FRONTEND: SAVE PERIMETER (PUT)
  //---------------------------------------------------------------------------
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
          body: JSON.stringify({ perimeter: points }),
        }
      );
    } catch (err) {
      console.error("Failed to save perimeter:", err);
    }
  }

  const handleSave = async () => {
    await savePerimeterAPI();
    setEditMode(false);
  };

  const handleClear = () => setPoints([]);

  // -----------------------------------------------------
  // PERIMETER CANVAS INTERACTION
  // -----------------------------------------------------

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // -------------------------------------------------------
    // 🟢 If we were dragging → end drag and DO NOT add a node
    // -------------------------------------------------------
    if (dragIndex !== null) {
      setDragIndex(null);
      return; // stop here
    }

    // -------------------------------------------------------
    // 🟢 Otherwise: see if user clicked near an existing node
    // -------------------------------------------------------
    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - x;
      const dy = points[i].y - y;
      if (dx * dx + dy * dy < 15 * 15) {
        setDragIndex(i); // start drag
        return;
      }
    }

    // -------------------------------------------------------
    // 🟢 No drag, no existing node → add new node
    // -------------------------------------------------------
    setPoints((prev) => [...prev, { x, y }]);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking near an existing node
    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - x;
      const dy = points[i].y - y;
      if (dx * dx + dy * dy < 12 * 12) {
        setDragIndex(i);    // START dragging
        return;
      }
    }

    // Not on node → add a node
    setPoints((prev) => [...prev, { x, y }]);
  }

  

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragIndex === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setPoints((prev) =>
      prev.map((p, i) => (i === dragIndex ? { x, y } : p))
    );
  }

  function handleMouseUp() {
    if (dragIndex !== null) {
      setDragIndex(null); // END dragging
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length < 2) return;

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();

    ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nodes
    if (editMode) {
      for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 6, 0, Math.PI * 2);
        ctx.fillStyle = i === dragIndex ? "yellow" : "#ff3333";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
      }
    }
  }, [points, dragIndex, editMode]);

  // -----------------------------------------------------
  // LIVEKIT AUTO-DISCONNECT
  // -----------------------------------------------------
  const noFeedTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!room) return;

    if (isPlaying) {
      if (noFeedTimer.current) {
        clearTimeout(noFeedTimer.current);
        noFeedTimer.current = null;
      }
      return;
    }

    if (!noFeedTimer.current) {
      noFeedTimer.current = setTimeout(() => {
        console.warn("Camera feed lost — disconnecting.");
        try {
          room.disconnect();
        } catch {}
        detachCurrent();
      }, 3000);
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

  const subscribeAndAttach = async (p: RemoteParticipant, wanted: string) => {
    if (!videoRef.current || p.identity !== wanted) return;

    p.trackPublications.forEach(async (pub: RemoteTrackPublication) => {
      if (pub.kind !== Track.Kind.Video) return;
      if (!pub.isSubscribed) {
        try {
          await pub.setSubscribed(true);
        } catch {}
      }
      if (pub.videoTrack) {
        detachCurrent();
        currentVideoTrack.current = pub.videoTrack;
        pub.videoTrack.attach(videoRef.current!);
      }
    });
  };

  useEffect(() => {
    if (!room) return;
    const wanted = deviceId;

    const rpMap = (room as any).remoteParticipants as Map<string, RemoteParticipant>;
    if (rpMap) rpMap.forEach((p) => subscribeAndAttach(p, wanted));

    const onTrackSubscribed = (track: RemoteVideoTrack, pub: any, p: RemoteParticipant) => {
      if (p.identity !== wanted) return;
      detachCurrent();
      currentVideoTrack.current = track;
      track.attach(videoRef.current);
    };

    const onTrackUnsubscribed = () => {
      detachCurrent();
      room.disconnect();
    };

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

    return () => {
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      detachCurrent();
    };
  }, [room, active, deviceId]);

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" /> Live Pool Cameras
        </CardTitle>

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

          <Button
            size="icon"
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (!room) return;
              room.reconnect();
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full md:w-3/4 mx-auto">
          <AspectRatio ratio={16 / 9} className="relative">

            {/* VIDEO BELOW */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover rounded-md z-0"
            />

            {/* CANVAS ABOVE */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="absolute inset-0 w-full h-full cursor-crosshair z-20"
            />

            {!isPlaying && (
              <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No camera feed ⚠️
              </span>
            )}
          </AspectRatio>

          {editMode && (
            <div className="flex gap-3 mt-3">
              <Button size="sm" onClick={handleSave}>Save Perimeter</Button>
              <Button size="sm" variant="destructive" onClick={handleClear}>Clear</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
