import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Droplets, Waves, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [temp, setTemp] = useState(27);
  const [ph, setPh] = useState(7.3);
  const [chl, setChl] = useState(2.1);
  const [turb, setTurb] = useState(1.2);

  useEffect(() => {
    const id = setInterval(() => {
      setTemp((v) => Math.max(20, Math.min(32, v + (Math.random() - 0.5))));
      setPh((v) =>
        Math.max(6.5, Math.min(8.5, v + (Math.random() - 0.5) * 0.05)),
      );
      setChl((v) =>
        Math.max(0.5, Math.min(3.5, v + (Math.random() - 0.5) * 0.05)),
      );
      setTurb((v) =>
        Math.max(0.3, Math.min(3, v + (Math.random() - 0.5) * 0.05)),
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        title="Temperature"
        icon={Thermometer}
        value={temp}
        unit="°C"
        min={20}
        max={32}
      />
      <MetricCard
        title="pH"
        icon={FlaskConical}
        value={ph}
        unit=""
        min={6.8}
        max={8.2}
        fine
      />
      <MetricCard
        title="Chlorine"
        icon={Droplets}
        value={chl}
        unit="ppm"
        min={1}
        max={3}
        fine
      />
      <MetricCard
        title="Turbidity"
        icon={Waves}
        value={turb}
        unit="NTU"
        min={0.5}
        max={2.5}
        fine
      />
    </div>
  );
}
