import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          This page is ready for configuration controls. Ask to fill it in with
          camera URLs, robot endpoints, and alert thresholds.
        </CardContent>
      </Card>
    </AppShell>
  );
}
