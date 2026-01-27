import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import ProfileSetup from "./pages/ProfileSetup";
import { RequireProfile } from "./components/RequireProfile";
import { LiveKitProvider } from "@/components/pool/LivekitProvider";


const queryClient = new QueryClient();

import { RequireAuth } from "./components/RequireAuth";

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <RequireAuth>
          <RequireProfile>
            <Dashboard />
          </RequireProfile>
        </RequireAuth>
      }
    />
    <Route
      path="/settings"
      element={
        <RequireAuth>
          <Settings />
        </RequireAuth>
      }
    />
    <Route path="/profile-setup" element={
      <RequireAuth><ProfileSetup /></RequireAuth>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <LiveKitProvider>
        <AppRoutes />
      </LiveKitProvider>
        
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://pbrobot.onrender.com/", // optional: your backend API
      scope: "openid profile email",
    }}
    onRedirectCallback={(appState) => {
      window.history.replaceState({}, document.title, appState?.returnTo || "/");
    }}
  >
    <App />
  </Auth0Provider>
);
