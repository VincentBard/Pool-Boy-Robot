import { SerialPort, ReadlineParser } from "serialport";
import { WebSocketServer } from "ws";

const BAUD_RATE = 9600;
const WS_PORT = 3001;

// --- Auto-detect Arduino (CH340 / CH341 / ATmega) ---
async function findArduinoPort() {
  const ports = await SerialPort.list();
  const arduino = ports.find(
    (p) =>
      /ch340|ch341|arduino|1a86|2341/i.test(
        `${p.manufacturer ?? ""} ${p.vendorId ?? ""} ${p.friendlyName ?? ""}`
      )
  );
  if (!arduino) {
    console.error("No Arduino found. Available ports:");
    ports.forEach((p) => console.error(`  ${p.path} - ${p.friendlyName ?? p.manufacturer ?? "unknown"}`));
    process.exit(1);
  }
  return arduino.path;
}

async function main() {
  const comPort = process.env.ARDUINO_PORT || (await findArduinoPort());
  console.log(`Opening serial on ${comPort} @ ${BAUD_RATE} baud`);

  const serial = new SerialPort({ path: comPort, baudRate: BAUD_RATE });
  const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

  serial.on("open", () => console.log(`Serial connected: ${comPort}`));
  serial.on("error", (err) => console.error("Serial error:", err.message));

  // --- WebSocket server ---
  const wss = new WebSocketServer({ port: WS_PORT });
  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);

  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`Client connected (${clients.size} total)`);

    ws.on("message", (data) => {
      const msg = data.toString().trim();
      console.log("WS -> Serial:", msg);
      serial.write(msg + "\n");
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`Client disconnected (${clients.size} total)`);
    });
  });

  // --- Parse Arduino DATA: format into JSON ---
  // Format: DATA:T1=-127.00,T2=-127.00,TDS=-1130,pH=6.72,Pitch=-33.70,Roll=43.92,Orient=Tilted
  function parseArduinoData(line) {
    if (!line.startsWith("DATA:")) return null;

    const payload = line.slice(5); // remove "DATA:"
    const pairs = payload.split(",");
    const obj = {};

    for (const pair of pairs) {
      const [key, val] = pair.split("=");
      if (!key || val === undefined) continue;
      obj[key.trim()] = val.trim();
    }

    // Map Arduino keys to the format the UI expects
    const t1 = parseFloat(obj["T1"]);
    const t2 = parseFloat(obj["T2"]);
    // Use T1 if valid, otherwise T2
    const temperature = (t1 > -100) ? t1 : (t2 > -100) ? t2 : null;

    return {
      temperature,
      pH: parseFloat(obj["pH"]) || null,
      tds: parseFloat(obj["TDS"]) || null,
      pitch: parseFloat(obj["Pitch"]) || null,
      roll: parseFloat(obj["Roll"]) || null,
      orient: obj["Orient"] || null,
    };
  }

  // --- Forward serial data to all WebSocket clients ---
  parser.on("data", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Try JSON first
    let json = null;
    try {
      json = JSON.parse(trimmed);
    } catch {
      // Try Arduino DATA: format
      json = parseArduinoData(trimmed);
    }

    if (!json) {
      console.log("Serial:", trimmed);
      return;
    }

    const msg = JSON.stringify(json);
    console.log("-> Clients:", msg);
    for (const ws of clients) {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
    }
  });
}

main();
