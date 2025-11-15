import { describe, it, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Import the dashboard
import Dashboard from "../pages/Dashboard";

// ✅ Mock child components to prevent heavy rendering
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: any) => <div data-testid="app-shell">{children}</div>,
}));

vi.mock("@/components/pool/PoolMetrics", () => ({
  PoolMetrics: () => <div data-testid="pool-metrics" />,
}));

vi.mock("@/components/pool/CameraPanel", () => ({
  CameraPanel: () => <div data-testid="camera-panel" />,
}));

vi.mock("@/components/pool/RobotControls", () => ({
  RobotControls: () => <div data-testid="robot-controls" />,
}));

// Prevent deployInflatable from running real logic
vi.mock("@/components/pool/actions", () => ({
  deployInflatable: vi.fn(),
}));

describe("Dashboard Component", () => {
  it("renders all main UI elements when user is logged in", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Headings
    expect(screen.getByText("Pool Control Board")).toBeInTheDocument();
    expect(
      screen.getByText("Live feed, water quality, alerts, and robot control")
    ).toBeInTheDocument();

    // Status Indicators
    expect(screen.getByText("Online")).toBeInTheDocument();

    // Deploy button
    expect(screen.getByRole("button", { name: /Deploy Inflatable/i })).toBeInTheDocument();

    // Mocked components are present
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByTestId("pool-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("camera-panel")).toBeInTheDocument();
    expect(screen.getByTestId("robot-controls")).toBeInTheDocument();
  });
});
