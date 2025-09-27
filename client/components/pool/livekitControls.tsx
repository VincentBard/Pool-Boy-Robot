import { Room, RoomEvent, DataPacket_Kind } from "livekit-client";

let room: Room | null = null;

/**
 * Connect to LiveKit room.
 */
export async function setupLiveKitControls(serverUrl: string, token: string) {
  if (room) return room; // already connected

  room = new Room();

  // Listen for data messages from Raspberry Pi
  room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
    try {
      const msg = new TextDecoder().decode(payload);
      console.log(`📩 Message from ${participant.identity}:`, msg);
    } catch (err) {
      console.error("Error decoding DataChannel message:", err);
    }
  });

  room.on(RoomEvent.Connected, () => {
    console.log("✅ Connected to LiveKit for robot control");
  });

  room.on(RoomEvent.Disconnected, () => {
    console.log("❌ Disconnected from LiveKit");
    room = null;
  });

  await room.connect(serverUrl, token);

  return room;
}

/**
 * Send a robot control command over WebRTC DataChannel.
 */
export function sendCommand(cmd: string, payload?: Record<string, unknown>) {
  if (!room) {
    console.warn("⚠️ No LiveKit room connection yet");
    return;
  }
  const message = JSON.stringify({ cmd, ...payload });
  room.localParticipant.publishData(
    new TextEncoder().encode(message),
    { reliable: true }   // 👈 this is the proper way
    );
  console.log("➡️ Sent command:", message);
}

/**
 * Disconnect gracefully when leaving the page.
 */
/*export async function disconnectControls() {
  if (room) {
    await room.disconnect();
    room = null;
    console.log("🔌 Disconnected from LiveKit");
  }
}*/