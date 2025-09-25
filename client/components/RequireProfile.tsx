import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function RequireProfile({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessTokenSilently, isLoading, user } = useAuth0();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (!isAuthenticated || !user) {
        setChecking(false);
        return;
      }

      try {
        const token = await getAccessTokenSilently();

        // 👇 log what’s happening for debugging
        console.log("Auth0 user object:", user);

        const url = `https://pbrobot.onrender.com/api/users/me?email=${encodeURIComponent(user.email ?? "")}`;
        console.log("Fetching URL:", url);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Response status:", res.status);

        if (res.status === 404) {
          // user missing in DB → go to setup page
          navigate("/profile-setup", { replace: true });
        }
      } catch (err) {
        console.error("Error checking user profile:", err);
      } finally {
        setChecking(false);
      }
    };

    checkProfile();
  }, [isAuthenticated, user, getAccessTokenSilently, navigate]);

  if (isLoading || checking) return <p>Loading...</p>;

  return <>{children}</>;
}