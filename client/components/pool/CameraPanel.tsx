import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { Camera, RotateCcw } from "lucide-react";

const SAMPLE_CAMERAS = [
  {
    id: "cam-1",
    name: "North View",
    url: "/placeholder.svg",
  },
  {
    id: "cam-2",
    name: "Deep End",
    url: "/placeholder.svg",
  },
  {
    id: "cam-3",
    name: "Shallow Deck",
    url: "/placeholder.svg",
  },
];

export function CameraPanel() {
  const [active, setActive] = useState(0);
  const cams = useMemo(() => SAMPLE_CAMERAS, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Live Pool Cameras
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {cams.map((c, i) => (
            <Button
              key={c.id}
              size="sm"
              variant={i === active ? "default" : "outline"}
              onClick={() => setActive(i)}
            >
              {c.name}
            </Button>
          ))}
          <Button size="icon" variant="ghost" aria-label="Refresh feed">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-3 rounded-lg border bg-muted/20 p-2">
            <AspectRatio ratio={16 / 9}>
              <img
                src={cams[active].url}
                alt={cams[active].name}
                className="h-full w-full rounded-md object-cover"
              />
            </AspectRatio>
          </div>
          <div className="space-y-2">
            {cams.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border p-2 text-left transition-colors",
                  i === active
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-accent",
                )}
              >
                <span className="text-sm font-medium">{c.name}</span>
                <Badge variant={i === active ? "default" : "secondary"}>
                  {i === active ? "Active" : "Idle"}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
