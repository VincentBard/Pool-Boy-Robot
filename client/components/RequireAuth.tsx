import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-4 animate-pulse">
          <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
          <span className="text-lg font-medium text-muted-foreground">
            Checking your session...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
