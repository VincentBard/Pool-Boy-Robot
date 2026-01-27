
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";

type LiveKitContextType = {
  room: Room | null;
  connected: boolean;
};

const LiveKitContext = createContext<LiveKitContextType>({
  room: null,
  connected: false,
});

export function LiveKitProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const resp = await fetch(
          "https://pbrobot.onrender.com/getToken?identity=viewer&roomName=pool"
        );

        if (!resp.ok) {
          throw new Error("Failed to fetch LiveKit token");
        }

        const data = await resp.json();
        if (!data.token) {
          throw new Error("No token in response");
        }

        const newRoom = new Room();
        roomRef.current = newRoom;

        newRoom.on(RoomEvent.Connected, () => {
          console.log("✅ Connected to LiveKit");
          setConnected(true);
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          setConnected(false);
        });

        await newRoom.connect(
          "wss://pbrobot-ir91vwzj.livekit.cloud",
          data.token
        );

        setRoom(newRoom);
      } catch (err) {
        console.error("Error connecting to LiveKit:", err);
      }
    };

    init();

    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  return (
    <LiveKitContext.Provider value={{ room, connected }}>
      {children}
    </LiveKitContext.Provider>
  );
}

export function useLiveKit() {
  return useContext(LiveKitContext);
}
