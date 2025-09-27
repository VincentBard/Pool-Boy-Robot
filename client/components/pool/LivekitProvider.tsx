
import React, { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const init = async () => {
      try {
        // ✅ fetch token once
        const resp = await fetch(
          "https://pbrobot.onrender.com/getToken?identity=viewer&roomName=pool"
        );
        const { token } = await resp.json();

        const newRoom = new Room();

        newRoom.on(RoomEvent.Connected, () => {
          console.log("✅ Connected to LiveKit");
          setConnected(true);
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          console.log("❌ Disconnected from LiveKit");
          setConnected(false);
        });

        await newRoom.connect(
          "wss://pbrobot-ir91vwzj.livekit.cloud",
          token
        );

        setRoom(newRoom);
      } catch (err) {
        console.error("Error connecting to LiveKit:", err);
      }
    };

    init();

    return () => {
      room?.disconnect();
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
