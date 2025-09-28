import { useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Battery, BatteryCharging } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth0 } from "@auth0/auth0-react";

export function BatteryIndicator() {
  const { getAccessTokenSilently } = useAuth0();
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);

  // Replace with your real deviceId
  const deviceId = "68cc90c7ef0763dddf1a5e9d";
  const API_URL = "https://pbrobot.onrender.com";

  useEffect(() => {
    async function fetchBattery() {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://pbrobot.onrender.com/",
          },
        });

        const res = await fetch(
          `${API_URL}/api/readings/device/${deviceId}/latest`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch battery level");
        const data = await res.json();

        setLevel(data.batteryPercentage ?? null);
        // Optional: decide charging state from backend if you add a field for it
        setCharging(false);
      } catch (err) {
        console.error("Error fetching battery reading:", err);
      }
    }

    fetchBattery();
    const id = setInterval(fetchBattery, 15000); // refresh every 15s
    return () => clearInterval(id);
  }, [getAccessTokenSilently]);

  const color = useMemo(() => {
    if (level === null) return "bg-gray-400";
    if (level <= 15) return "bg-destructive";
    if (level <= 35) return "bg-amber-500";
    return "bg-emerald-500";
  }, [level]);

  return (
    <div
      className="flex items-center gap-2 min-w-[160px]"
      aria-label="Robot battery level"
    >
      {charging ? (
        <BatteryCharging className="h-4 w-4 text-primary" />
      ) : (
        <Battery className="h-4 w-4 text-primary" />
      )}
      <div className="w-[120px]">
        <Progress value={level ?? 0} className={cn("h-2", color)} />
      </div>
      <span
        className={cn(
          "text-xs tabular-nums",
          level !== null && level <= 15 && "text-destructive font-semibold"
        )}
      >
        {level !== null ? `${level}%` : "—"}
      </span>
    </div>
  );
}