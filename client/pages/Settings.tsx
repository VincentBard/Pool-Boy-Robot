import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth0 } from "@auth0/auth0-react";

export default function Settings() {
  const { getAccessTokenSilently } = useAuth0();

  // ---------------------------
  // STATE
  // ---------------------------
  const [settings, setSettings] = useState<any>(null);
  const [original, setOriginal] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const toggle = (key: string) => {
    setSettings((prev: any) => {
      const updated = { ...prev, [key]: !prev[key] };
      detectChanges(updated);
      return updated;
    });
  };

  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => {
      const updated = { ...prev, [key]: value };
      detectChanges(updated);
      return updated;
    });
  };

  // Compare with original to detect changes
  const detectChanges = (updated: any) => {
    if (!original) return;
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(original));
  };

  // ---------------------------
  // LOAD SETTINGS
  // ---------------------------
  useEffect(() => {
    async function loadSettings() {
      try {
        const token = await getAccessTokenSilently();

        const res = await fetch(`https://pbrobot.onrender.com/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        setSettings(data);
        setOriginal(data); // baseline for change detection
        setHasChanges(false);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    loadSettings();
  }, []);

  if (!settings) {
    return (
      <AppShell>
        <div className="p-6 text-muted-foreground">Loading settings...</div>
      </AppShell>
    );
  }

  // ---------------------------
  // SAVE SETTINGS
  // ---------------------------
  const save = async () => {
    try {
      const token = await getAccessTokenSilently();

      await fetch(`https://pbrobot.onrender.com/api/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      setOriginal(settings);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <AppShell>

      {/* Sticky Save Bar at Bottom */}
        {hasChanges && (
          <div className="
            fixed bottom-0 left-0 right-0 z-50
            bg-primary/95 backdrop-blur-md shadow-xl
            p-4 flex justify-center border-t border-primary/30
          ">
            <Button
              className="
                bg-white text-primary font-semibold
                px-6 py-2 shadow-lg hover:bg-gray-100
              "
              onClick={save}
            >
              Save Changes
            </Button>
          </div>
        )}

        
        <div className="pb-10"></div>


      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">

          {/* === DETECTION FEATURES === */}
          <SettingsSection title="Detection Features">
            <SwitchItem label="Detect People" value={settings.detectPeople} onChange={() => toggle("detectPeople")} />
            <SwitchItem label="Detect Pets" value={settings.detectPets} onChange={() => toggle("detectPets")} />
            <SwitchItem label="Detect Toddler" value={settings.detectToddler} onChange={() => toggle("detectToddler")} />
            <SwitchItem label="Foreign Animals" value={settings.detectForeignAnimals} onChange={() => toggle("detectForeignAnimals")} />
            <SwitchItem label="Perimeter Breach" value={settings.detectPerimeterBreach} onChange={() => toggle("detectPerimeterBreach")} />
            <SwitchItem label="Deep-Water Perimeter Breach" value={settings.detectDeepWaterBreach} onChange={() => toggle("detectDeepWaterBreach")} />
            <SwitchItem label="Motion Detection" value={settings.detectMotion} onChange={() => toggle("detectMotion")} />
            <SwitchItem label="Drowning Risk" value={settings.detectDrowningRisk} onChange={() => toggle("detectDrowningRisk")} />
            <SwitchItem label="Foreign Objects" value={settings.detectForeignObjects} onChange={() => toggle("detectForeignObjects")} />
            <SwitchItem label="Splash Intensity" value={settings.detectSplashing} onChange={() => toggle("detectSplashing")} />
          </SettingsSection>

          <Separator />

          {/* === WATER QUALITY === */}
          <SettingsSection title="Water Quality Alerts">
            <RangeInput label="Water Temp (°C)" min={settings.waterTempMin} max={settings.waterTempMax}
              onMin={(v) => updateField("waterTempMin", v)} onMax={(v) => updateField("waterTempMax", v)} />

            <RangeInput label="pH" min={settings.phMin} max={settings.phMax}
              onMin={(v) => updateField("phMin", v)} onMax={(v) => updateField("phMax", v)} />

            <RangeInput label="TDS (ppm)" min={settings.tdsMin} max={settings.tdsMax}
              onMin={(v) => updateField("tdsMin", v)} onMax={(v) => updateField("tdsMax", v)} />
          </SettingsSection>

          <Separator />

          {/* === BATTERY === */}
          <SettingsSection title="Battery Alerts">
            <SwitchItem label="Battery Low Alert" value={settings.batteryLowAlert}
              onChange={() => toggle("batteryLowAlert")} />

            <InputRow label="Battery Threshold (%)">
              <Input
                type="number"
                className="w-24"
                value={settings.batteryLowThreshold}
                onChange={(e) => updateField("batteryLowThreshold", Number(e.target.value))}
              />
            </InputRow>
          </SettingsSection>

          <Separator />

          {/* === CLEANING SCHEDULE === */}
          <SettingsSection title="Cleaning Schedule">
            <SwitchItem label="Enable Cleaning Schedule" value={settings.cleaningScheduleEnabled}
              onChange={() => toggle("cleaningScheduleEnabled")} />

            {settings.cleaningScheduleEnabled && (
              <div className="space-y-4 mt-3">
                

                <InputRow label="Cleaning Time">
                  <Input
                    type="time"
                    value={settings.cleaningTime}
                    onChange={(e) => updateField("cleaningTime", e.target.value)}
                    className="w-32"
                  />
                </InputRow>
              </div>
            )}
          </SettingsSection>

          <Separator />

          {/* === ALERT PREFERENCES === */}
          <SettingsSection title="Alert Preferences">
            <SwitchItem label="Push Alerts" value={settings.alertsPush} onChange={() => toggle("alertsPush")} />
            <SwitchItem label="Email Alerts" value={settings.alertsEmail} onChange={() => toggle("alertsEmail")} />
            <SwitchItem label="Critical Alerts Only" value={settings.alertsCriticalOnly} onChange={() => toggle("alertsCriticalOnly")} />
          </SettingsSection>

          <Separator />

          {/* === ROBOT === */}
          <SettingsSection title="Robot Automation">
            <SwitchItem label="Deploy Inflatable Device" value={settings.autoEngageInflatable} onChange={() => toggle("autoEngageInflatable")} />
            <SwitchItem label="Stop Robot On Alert" value={settings.autoStopRobotOnAlert} onChange={() => toggle("autoStopRobotOnAlert")} />
            <SwitchItem label="Auto-Record On Alert" value={settings.autoRecordOnAlert} onChange={() => toggle("autoRecordOnAlert")} />
          </SettingsSection>

        </CardContent>
      </Card>
    </AppShell>
  );
}


// --------------------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------------------
function SettingsSection({ title, children }: any) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SwitchItem({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label>{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function InputRow({ label, children }: any) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function RangeInput({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min: number;
  max: number;
  onMin: (v: number) => void;
  onMax: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          value={min}
          onChange={(e) => onMin(Number(e.target.value))}
          className="w-24"
        />
        <Input
          type="number"
          value={max}
          onChange={(e) => onMax(Number(e.target.value))}
          className="w-24"
        />
      </div>
    </div>
  );
}
