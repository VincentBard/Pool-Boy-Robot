import { useEffect, useState, useRef } from "react";
import { Bell, OctagonAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { useAuth0 } from "@auth0/auth0-react";

export type DangerEvent = {
  id: string;
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  at: Date;
};

export function AlertCenter() {
  const { getAccessTokenSilently } = useAuth0();
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);

  const [events, setEvents] = useState<DangerEvent[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // NEW FLAG: user clicked X → toast must NEVER reappear
  const [toastManuallyDismissed, setToastManuallyDismissed] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const deviceId = "68cc90c7ef0763dddf1a5e9d";

  async function handleDelete(alertId: string) {
  try {
    const token = await getAccessTokenSilently();
    const res = await fetch(
      `https://pbrobot.onrender.com/api/alerts/${alertId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Failed to delete alert");
      return;
    }

    // Remove from UI instantly
    setEvents((prev) => prev.filter((a) => a.id !== alertId));
  } catch (err) {
    console.error("Error deleting alert:", err);
  }
}

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch alerts (10s polling)
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(
          `https://pbrobot.onrender.com/api/alerts/${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const raw = await res.json();
        const arr = Array.isArray(raw) ? raw : [];

        const mapped = arr.map((a: any) => ({
          id: a._id,
          type: a.alertType || "unknown",
          message: a.message,
          severity: a.severity,
          at: new Date(a.createdAt),
        }));

        setEvents(mapped);
      } catch (err) {
        console.error("Failed to load alerts:", err);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10_000);
    return () => clearInterval(interval);
  }, []);

  // NEW TOAST LOGIC — ONLY toast for <60 seconds old
  // Toast visibility effect
  useEffect(() => {
    if (!events.length) return;

    const latest = events[0];

    // If this alert was dismissed, do not show toast again
    if (dismissedAlertId === latest.id) {
      setToastVisible(false);
      return;
    }

    const ageMs = Date.now() - latest.at.getTime();

    if (ageMs < 60_000) {
      setToastVisible(true);

      // Auto-close after remaining time
      const timeout = setTimeout(
        () => setToastVisible(false),
        60_000 - ageMs
      );

      return () => clearTimeout(timeout);
    }

    setToastVisible(false);
  }, [events, dismissedAlertId]);

  const hasCritical = events.some((e) => e.severity === "critical");
  const mostRecent = events[0];

  return (
    <div className="relative flex items-center gap-2">

      {/* 🔥 Top Toast — fixed + animated */}
      {toastVisible && mostRecent && (
        <div className="
          fixed left-1/2 top-4 z-[9999]
          w-[92vw] max-w-xl
          -translate-x-1/2
          animate-in fade-in slide-in-from-top-4
          duration-300
        ">
          <Alert
            variant={mostRecent.severity === "critical" ? "destructive" : "default"}
            className="
              shadow-lg border relative pr-10
              bg-background 
              dark:bg-neutral-900
              data-[variant=destructive]:bg-destructive/20 
            "
          >
            <AlertTitle className="flex items-center justify-between">
              {mostRecent.type}
              <span className="text-xs text-muted-foreground ml-2">
                {mostRecent.at.toLocaleTimeString()}
              </span>
            </AlertTitle>

            <AlertDescription>
              {mostRecent.message}
            </AlertDescription>

            {/* Dismiss button */}
            <button
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
              onClick={() => {
                setToastVisible(false);
                setDismissedAlertId(events[0].id); // ← remember dismissed alert
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      {/* Bell */}
      <Button
        variant={hasCritical ? "destructive" : "outline"}
        size="icon"
        aria-label="Alerts"
        onClick={() => setDropdownOpen((o) => !o)}
      >
        <Bell className="h-4 w-4" />
      </Button>

      {events.length > 0 && (
        <Badge variant={hasCritical ? "destructive" : "secondary"}>
          {events.length}
        </Badge>
      )}

      {/* Dropdown List */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-10 z-40 w-80 rounded-lg border bg-white shadow-xl dark:bg-neutral-900"
        >
          <Card className="max-h-96 overflow-y-auto p-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No alerts
              </p>
            ) : (
              events.map((e) => (
              <div key={e.id} className="mb-3 rounded-md border p-2 last:mb-0">
                <div className="flex justify-between items-start">
                  <strong>{e.type}</strong>
                  <span className="text-xs opacity-70">
                    {e.at.toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-sm">{e.message}</p>

                <div className="flex justify-between items-center mt-2">
                  <Badge
                    className="uppercase"
                    variant={e.severity === "critical" ? "destructive" : "secondary"}
                  >
                    {e.severity}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(e.id)}
                    className="text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
