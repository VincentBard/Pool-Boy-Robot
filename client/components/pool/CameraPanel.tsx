import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  RemoteParticipant,
  RemoteTrackPublication,
  TrackPublication,
  Track,
  RemoteVideoTrack,
  RoomEvent,
} from "livekit-client";
import { useLiveKit } from "@/components/pool/LiveKitProvider";

// Map camera buttons to participant identities published by your Pis
const SAMPLE_CAMERAS = [
  { id: 1, name: "Pi Camera 1", identity: "raspberry" },
  { id: 2, name: "Pi Camera 2", identity: "garage" },
];

export function CameraPanel() {
  const [active, setActive] = useState(0);
  const cams = useMemo(() => SAMPLE_CAMERAS, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideoTrack = useRef<RemoteVideoTrack | null>(null);
  const { room } = useLiveKit();

  // Helper: detach whatever is currently attached
  const detachCurrent = () => {
    if (currentVideoTrack.current && videoRef.current) {
      try {
        currentVideoTrack.current.detach(videoRef.current);
      } catch {}
    }
    currentVideoTrack.current = null;
    if (videoRef.current) {
      // clear element to avoid “stuck” frames after detach
      videoRef.current.srcObject = null;
    }
  };

  // Helper: subscribe & attach all existing video pubs for a participant
  const subscribeAndAttach = async (p: RemoteParticipant, identityWanted: string) => {
    if (!videoRef.current) return;
    if (p.identity !== identityWanted) return;

    // Iterate publications and ensure we’re subscribed to video
    p.trackPublications.forEach(async (pub: RemoteTrackPublication) => {
      if (pub.kind !== Track.Kind.Video) return;

      // If autosubscribe is off, explicitly subscribe
      if (!pub.isSubscribed) {
        try {
          await pub.setSubscribed(true);
        } catch (e) {
          console.warn("Failed to subscribe to video pub:", e);
          return;
        }
      }

      // If we have a track, attach it
      if (pub.videoTrack) {
        detachCurrent();
        currentVideoTrack.current = pub.videoTrack;
        pub.videoTrack.attach(videoRef.current!);
      }
    });
  };

  useEffect(() => {
    if (!room) return;
    const identityWanted = cams[active].identity;

    // 1) Attach from already-connected participants (handles page reload case)
    const rpMap = (room as any).remoteParticipants as Map<string, RemoteParticipant> | undefined;
    if (rpMap) {
      for (const p of rpMap.values()) {
        subscribeAndAttach(p, identityWanted);
      }
    }

    // 2) When a participant connects later, subscribe & attach
    const onParticipantConnected = (p: RemoteParticipant) => {
      subscribeAndAttach(p, identityWanted);
    };

    // 3) When a new publication appears, subscribe (if needed)
    const onTrackPublished = async (pub: TrackPublication, p: RemoteParticipant) => {
      if (p.identity !== identityWanted) return;
      if (pub.kind !== Track.Kind.Video) return;
      try {
        // If autosubscribe is off, explicitly subscribe
        if ("setSubscribed" in pub && !(pub as RemoteTrackPublication).isSubscribed) {
          await (pub as RemoteTrackPublication).setSubscribed(true);
        }
      } catch (e) {
        console.warn("Failed to subscribe on publish:", e);
      }
    };

    // 4) When we actually get a subscribed track, attach it
    const onTrackSubscribed = (
      track: RemoteVideoTrack | any,
      pub: RemoteTrackPublication,
      p: RemoteParticipant
    ) => {
      if (p.identity !== identityWanted) return;
      if (track.kind !== Track.Kind.Video) return;
      if (!videoRef.current) return;

      detachCurrent();
      currentVideoTrack.current = track as RemoteVideoTrack;
      track.attach(videoRef.current);
    };

    // 5) Clean up if the track is unpublished/unsubscribed/participant leaves
    const onTrackUnsubscribed = (
      track: RemoteVideoTrack | any,
      pub: RemoteTrackPublication,
      p: RemoteParticipant
    ) => {
      if (p.identity !== identityWanted) return;
      if (track === currentVideoTrack.current) {
        detachCurrent();
      }
    };

    const onParticipantDisconnected = (p: RemoteParticipant) => {
      if (p.identity === identityWanted) {
        detachCurrent();
      }
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.TrackPublished, onTrackPublished);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    // Also try to attach local state again when `active` changes
    // (re-check all participants for the new identity)
    subscribeAndAttachForAll(room, identityWanted, subscribeAndAttach);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.TrackPublished, onTrackPublished);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      detachCurrent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, active, cams]);

  // Utility to re-scan participants (used when active camera changes)
  const subscribeAndAttachForAll = (
    roomInstance: any,
    identityWanted: string,
    attachFn: (p: RemoteParticipant, identity: string) => void
  ) => {
    const rpMap = roomInstance?.remoteParticipants as Map<string, RemoteParticipant> | undefined;
    if (!rpMap) return;
    for (const p of rpMap.values()) {
      attachFn(p, identityWanted);
    }
  };

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
          <Button
            size="icon"
            variant="ghost"
            aria-label="Refresh feed"
            onClick={() => {
              // force re-scan for the active identity
              if (room) {
                detachCurrent();
                subscribeAndAttachForAll(room, cams[active].identity, subscribeAndAttach);
              }
            }}
          >
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
                muted
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
                  i === active ? "bg-primary/10 border-primary" : "hover:bg-accent"
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
