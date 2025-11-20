import { useEffect, useState, useRef } from "react";
import { RoomEvent, RemoteParticipant } from "livekit-client";
import { useLiveKit } from "@/components/pool/LivekitProvider";

export function usePiConnection(piIdentity: string = "raspberry") {
  const { room } = useLiveKit();
  const [online, setOnline] = useState(false);
  const disconnectedRef = useRef(false); // prevent spamming disconnect

  useEffect(() => {
    if (!room) return;

    const isPiPresent = () => {
      for (const p of room.remoteParticipants.values()) {
        if (p.identity === piIdentity) return true;
      }
      return false;
    };

    // Initial state
    const initial = isPiPresent();
    setOnline(initial);

    if (!initial && !disconnectedRef.current) {
      disconnectedRef.current = true;
      room.disconnect();
      console.log("🔌 Auto-disconnect: Raspberry Pi is offline.");
    }

    const onJoin = (p: RemoteParticipant) => {
      if (p.identity === piIdentity) {
        setOnline(true);
        disconnectedRef.current = false; // allow future disconnects
      }
    };

    const onLeave = (p: RemoteParticipant) => {
      if (p.identity === piIdentity) {
        setOnline(false);

        if (!disconnectedRef.current) {
          disconnectedRef.current = true;
          room.disconnect();
          console.log("🔌 Auto-disconnect: Raspberry Pi disconnected.");
        }
      }
    };

    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [room, piIdentity]);

  return online;
}
