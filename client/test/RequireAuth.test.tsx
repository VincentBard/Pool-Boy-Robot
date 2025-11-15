import { describe, it, vi, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { RequireAuth } from "../components/RequireAuth";// ⬅️ adjust path if needed

// ✅ Mock Auth0
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(),
}));

describe("RequireAuth Login Redirection", () => {
  it("calls loginWithRedirect when user is not authenticated and not loading", () => {
    const loginWithRedirect = vi.fn();

    (useAuth0 as vi.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(loginWithRedirect).toHaveBeenCalledTimes(1);
    expect(loginWithRedirect).toHaveBeenCalledWith({
      appState: { returnTo: "/" },
    });
  });

  it("does NOT redirect while loading", () => {
    const loginWithRedirect = vi.fn();

    (useAuth0 as vi.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      loginWithRedirect,
    });

    render(
      <MemoryRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(loginWithRedirect).not.toHaveBeenCalled();
  });

  it("renders children when authenticated", () => {
    const loginWithRedirect = vi.fn();

    (useAuth0 as vi.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginWithRedirect,
    });

    const { getByText } = render(
      <MemoryRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(getByText("Protected Content")).toBeInTheDocument();
    expect(loginWithRedirect).not.toHaveBeenCalled();
  });
});