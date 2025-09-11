import { toast } from "sonner";

export function sendCommand(cmd: string, payload?: Record<string, unknown>) {
  // Hook this up to your backend/robot endpoint.
  // Intentionally logs for now; replace with fetch('/api/robot', ...) as needed.
  console.info("robot", cmd, payload ?? {});
}

export function deployInflatable(reason?: string) {
  const at = new Date().toISOString();
  sendCommand("deploy_inflatable", { reason: reason ?? "manual", at });
  toast.warning("Inflatable deployed", {
    description: reason ? `${reason} • ${new Date(at).toLocaleTimeString()}` : `Manual deployment • ${new Date(at).toLocaleTimeString()}`,
  });
}
