import { useEffect, useRef, useState, useCallback } from "react";

export interface SensorData {
  temperature?: number;
  pH?: number;
  tds?: number;
  roll?: number;
  pitch?: number;
}

const WS_URL = "ws://localhost:3001";
const RECONNECT_DELAY = 2000;

export function useArduino() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [history, setHistory] = useState<(SensorData & { time: number })[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("Arduino WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: SensorData = JSON.parse(event.data);
        setSensorData(data);
        setHistory((prev) => {
          const entry = { ...data, time: Date.now() };
          const next = [...prev, entry];
          // Keep last 100 readings
          return next.length > 100 ? next.slice(-100) : next;
        });
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendCommand = useCallback(
    (cmd: string, payload?: Record<string, unknown>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const msg = JSON.stringify({ cmd, ...payload });
        wsRef.current.send(msg);
      } else {
        console.warn("Arduino not connected, cannot send:", cmd);
      }
    },
    []
  );

  return { connected, sensorData, history, sendCommand };
}
