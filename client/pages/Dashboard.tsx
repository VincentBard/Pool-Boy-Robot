import { AppShell } from "@/components/layout/AppShell";
import { CameraPanel } from "@/components/pool/CameraPanel";
import { PoolMetrics } from "@/components/pool/PoolMetrics";
import { RobotControls } from "@/components/pool/RobotControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Shield, Wifi, LifeBuoy } from "lucide-react";
import { deployInflatable } from "@/components/pool/actions";

export default function Dashboard() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pool Control Board
            </h1>
            <p className="text-muted-foreground">
              Live feed, water quality, alerts, and robot control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase">
              Online
            </Badge>
            <Wifi className="h-4 w-4 text-emerald-500" />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deployInflatable("manual from dashboard")}
            >
              <LifeBuoy className="mr-2 h-4 w-4" /> Deploy Inflatable
            </Button>
          </div>
        </div>
        <PoolMetrics />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-stretch">
          <div className="lg:col-span-2 h-full">
            <CameraPanel />
          </div>
          <div className="lg:col-span-2 h-full">
            <RobotControls />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
