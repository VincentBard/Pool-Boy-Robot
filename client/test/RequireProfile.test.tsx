import { describe, it, vi, expect, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { RequireProfile } from "../components//RequireProfile"; // adjust path as needed
import { useAuth0 } from "@auth0/auth0-react";

// ✅ Mock Auth0
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(),
}));

// ✅ Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RequireProfile", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    global.fetch = vi.fn();
  });

  it("redirects to /profile-setup if backend says user does not exist (404)", async () => {
    (useAuth0 as vi.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { email: "test@example.com" },
      getAccessTokenSilently: vi.fn().mockResolvedValue("fake-token"),
    });

    (global.fetch as vi.Mock).mockResolvedValue({ status: 404 });

    render(
      <MemoryRouter>
        <RequireProfile>
          <div>Protected Content</div>
        </RequireProfile>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile-setup", { replace: true });
    });
  });

  it("renders children when profile exists (200)", async () => {
    (useAuth0 as vi.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { email: "test@example.com" },
      getAccessTokenSilently: vi.fn().mockResolvedValue("fake-token"),
    });

    (global.fetch as vi.Mock).mockResolvedValue({ status: 200 });

    render(
      <MemoryRouter>
        <RequireProfile>
          <div>Protected Content</div>
        </RequireProfile>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows loading while checking", () => {
    (useAuth0 as vi.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
      user: null,
      getAccessTokenSilently: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RequireProfile>
          <div>Protected Content</div>
        </RequireProfile>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});