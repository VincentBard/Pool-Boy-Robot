import { describe, it, vi, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { AppShell } from "../components/layout/AppShell"; // adjust path

// ✅ Mock Auth0
const mockLogout = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    user: { email: "test@example.com" },
    logout: mockLogout,
  })),
}));

// ✅ Mock components that aren't relevant to test behavior
vi.mock("@/components/pool/AlertCenter", () => ({
  AlertCenter: () => <div data-testid="alert-center" />,
}));

vi.mock("@/components/pool/BatteryIndicator", () => ({
  BatteryIndicator: () => <div data-testid="battery-indicator" />,
}));

// ✅ Let dropdown UI behave normally (no need for complex shadcn mocks)
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div role="menuitem" onClick={onClick}>
      {children}
    </div>
  ),
}));

describe("AppShell Logout Behavior", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("shows the logout option and calls logout when clicked", () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // ✅ Ensure the user dropdown trigger appears
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    // ✅ Click the dropdown trigger (simulates opening the menu)
    fireEvent.click(screen.getByText("test@example.com"));

    // ✅ Now the logout button should be visible
    const logoutButton = screen.getByRole("menuitem", { name: /log out/i });
    expect(logoutButton).toBeInTheDocument();

    // ✅ Click logout
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledWith({
      returnTo: window.location.origin,
    });
  });

    it("shows the Support button and links to the correct email", () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // The Support button uses <Button asChild><a href="mailto:..."></a></Button>
    const supportButton = screen.getByRole("link", { name: /support/i });

    expect(supportButton).toBeInTheDocument();
    expect(supportButton).toHaveAttribute(
      "href",
      "mailto:vbard041@uottawa.ca"
    );
  });
});
