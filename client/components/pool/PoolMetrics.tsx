import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Waves, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

function PlaneDial({ pitch, roll }: { pitch: number; roll: number }) {
  // Soften the pitch movement dramatically
  const clampedPitch = Math.max(-30, Math.min(30, pitch));
  const pitchOffset = (clampedPitch / 30) * 40; // 🔥 reduced from 40px → 10px

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base h-5 font-medium text-muted-foreground">
          Attitude Indicator
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center">

        {/* Dial Container */}
        <div
          className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-gray-700 shadow-lg bg-black"
          style={{
            transform: `rotate(${roll}deg)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* SKY + GROUND that moves with pitch */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translateY(${pitchOffset}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-blue-400" />
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-orange-500" />
          </div>

          {/* ROLL MARKERS */}
          {[ -45, -30, -20, -10, 0, 10, 20, 30, 45 ].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2 bg-white"
              style={{
                width: "2px",
                height: deg % 30 === 0 ? "14px" : "8px",
                transform: `rotate(${deg}deg) translateY(-58px)`,
                transformOrigin: "center bottom",
              }}
            />
          ))}
        </div>

        {/* FIXED AIRPLANE WINGS */}
        <div className="absolute mt-4 pt-10 flex flex-col items-center pointer-events-none">
          <div className="w-1 h-6 bg-yellow-400" />

          <div className="flex flex-row items-center">
            <div className="w-10 h-1 bg-yellow-400 mr-1" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-10 h-1 bg-yellow-400 ml-1" />
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Roll: <b>{roll.toFixed(1)}°</b> &nbsp; | &nbsp;
          Pitch: <b>{pitch.toFixed(1)}°</b>
        </p>
      </CardContent>
    </Card>
  );
}



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
  const [roll, setRoll] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);

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

        const res = await fetch(
          `https://pbrobot.onrender.com/api/readings/device/${deviceId}/latest`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch readings");
        const data = await res.json();

        setTemp(data.temperature ?? null);
        setPh(data.pH ?? null);
        setTds(data.tds ?? null);
        setRoll(data.roll ?? null);
        setPitch(data.pitch ?? null);

      } catch (err) {
        console.error("Error fetching latest reading:", err);
      }
    }

    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, [deviceId]);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {temp !== null && (
        <MetricCard title="Temperature" icon={Thermometer} value={temp} unit="°C" min={20} max={32} />
      )}
      {ph !== null && (
        <MetricCard title="pH" icon={FlaskConical} value={ph} unit="" min={6.8} max={8.2} fine />
      )}
      {tds !== null && (
        <MetricCard title="TDS" icon={Waves} value={tds} unit="ppm" min={100} max={500} fine />
      )}

     

      {pitch !== null && roll !== null && (
        <PlaneDial pitch={pitch} roll={roll} />
      )}
    </div>
  );
}
