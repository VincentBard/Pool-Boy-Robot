import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Waves, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

function MetricCard({
  title,
  icon: Icon,
  value,
  unit,
  min,
  max,
  fine,
}: {
  title: string;
  icon: any;
  value: number;
  unit: string;
  min: number;
  max: number;
  fine?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const ok = pct > 20 && pct < 80;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-end justify-between">
          <div className="text-2xl font-semibold tabular-nums">
            {fine ? value.toFixed(2) : Math.round(value)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {min}
            {unit} – {max}
            {unit}
          </span>
        </div>
        <Progress
          value={pct}
          className={ok ? "bg-emerald-500" : "bg-amber-500"}
        />
      </CardContent>
    </Card>
  );
}

export function PoolMetrics() {
  const [temp, setTemp] = useState<number | null>(null);
  const [ph, setPh] = useState<number | null>(null);
  const [tds, setTds] = useState<number | null>(null);

  // replace with your real deviceId
  const deviceId = "68cc90c7ef0763dddf1a5e9d";
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    async function fetchLatest() {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://pbrobot.onrender.com/",
          },
        });

        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Token payload:", payload);
        const res = await fetch(
          `https://pbrobot.onrender.com/api/readings/device/${deviceId}/latest`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch readings");
        const data = await res.json();
        setTemp(data.temperature ?? null);
        setPh(data.pH ?? null);
        setTds(data.tds ?? null);
      } catch (err) {
        console.error("Error fetching latest reading:", err);
      }
    }

    fetchLatest();
    const interval = setInterval(fetchLatest, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [deviceId]);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {temp !== null && (
        <MetricCard
          title="Temperature"
          icon={Thermometer}
          value={temp}
          unit="°C"
          min={20}
          max={32}
        />
      )}
      {ph !== null && (
        <MetricCard
          title="pH"
          icon={FlaskConical}
          value={ph}
          unit=""
          min={6.8}
          max={8.2}
          fine
        />
      )}
      {tds !== null && (
        <MetricCard
          title="TDS"
          icon={Waves}
          value={tds}
          unit="ppm"
          min={100}
          max={500}
          fine
        />
      )}
    </div>
  );
}
