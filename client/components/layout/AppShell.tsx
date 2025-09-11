import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BatteryIndicator } from "@/components/pool/BatteryIndicator";
import { AlertCenter } from "@/components/pool/AlertCenter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ShieldAlert, Waves } from "lucide-react";

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground",
        className,
      )}
    >
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-primary"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow">
              <Waves className="h-5 w-5" />
            </div>
            <span className="tracking-tight">AquaGuard Control</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Separator orientation="vertical" className="mx-2 h-6" />
            <Link
              to="/settings"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <AlertCenter />
            <BatteryIndicator />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <a href="mailto:vbard041@uottawa.ca" aria-label="Contact support">
                <ShieldAlert className="mr-2 h-4 w-4" /> Support
              </a>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AquaGuard. All rights reserved.
      </footer>
    </div>
  );
}
