import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Waves, FlaskConical } from "lucide-react";
import { useArduino } from "@/hooks/useArduino";


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Sparkline({ data, dataKey, color }: {
  data: any[];
  dataKey: string;
  color: string;
}) {
  return (
    <div className="h-12 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />   {/* 👈 This is the missing piece */}

          <Tooltip
            labelFormatter={(t) => {
              if (!t || isNaN(t)) return "No timestamp";
              return new Date(t).toLocaleString();
            }}
            formatter={(value: any, name: string) => [`${value}`, name]}
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              fontSize: "0.75rem",
            }}
          />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}



function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-4 w-24 bg-gray-300/50 rounded" />
        <div className="h-4 w-6 bg-gray-300/50 rounded" />
      </CardHeader>

      <CardContent>
        <div className="h-8 w-20 bg-gray-300/50 rounded mb-4" />
        <div className="h-3 w-full bg-gray-300/50 rounded mb-4" />

        <div className="h-12 w-full bg-gray-300/50 rounded" />
      </CardContent>
    </Card>
  );
}



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
  history,
  dataKey,
  color,
}: {
  title: string;
  icon: any;
  value: number;
  unit: string;
  min: number;
  max: number;
  fine?: boolean;
  history: any[];
  dataKey: string;
  color: string;
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
        {/* Value Display */}
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

        {/* Progress Bar */}
        <Progress
          value={pct}
          className={ok ? "bg-emerald-500" : "bg-amber-500"}
        />

        {/* NEW: Sparkline Graph */}
        <Sparkline data={history} dataKey={dataKey} color={color} />
      </CardContent>
    </Card>
  );
}


export function PoolMetrics() {
  const { sensorData, history, connected } = useArduino();

  const temp = sensorData.temperature ?? null;
  const ph = sensorData.pH ?? null;
  const tds = sensorData.tds ?? null;
  const roll = sensorData.roll ?? null;
  const pitch = sensorData.pitch ?? null;

  const readings = history.map((r) => ({
    time: r.time,
    temperature: r.temperature ?? null,
    pH: r.pH ?? null,
    tds: r.tds ?? null,
  }));

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* Show skeletons if still loading */}
      {readings.length === 0 && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Real metric cards once data loads */}
      {readings.length > 0 && temp !== null && (
        <MetricCard
          title="Temperature"
          icon={Thermometer}
          value={temp}
          unit="°C"
          min={20}
          max={32}
          fine={false}
          history={readings}
          dataKey="temperature"
          color="#3b82f6"
        />
      )}

      {readings.length > 0 && ph !== null && (
        <MetricCard
          title="pH"
          icon={FlaskConical}
          value={ph}
          unit=""
          min={6.8}
          max={8.2}
          fine
          history={readings}
          dataKey="pH"
          color="#10b981"
        />
      )}

      {readings.length > 0 && tds !== null && (
        <MetricCard
          title="TDS"
          icon={Waves}
          value={tds}
          unit="ppm"
          min={100}
          max={500}
          fine
          history={readings}
          dataKey="tds"
          color="#f59e0b"
        />
      )}

      {readings.length > 0 && pitch !== null && roll !== null && (
        <PlaneDial pitch={pitch} roll={roll} />
      )}
    </div>
  );


}

