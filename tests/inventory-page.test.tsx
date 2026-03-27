import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/components/loading-state", () => ({
  PageLoadingState: () => <div>inventory-loading</div>,
}));

vi.mock("@/components/error-state", () => ({
  ErrorState: ({ title, message }: { title: string; message: string }) => (
    <div>
      <div>{title}</div>
      <div>{message}</div>
    </div>
  ),
}));

vi.mock("@/components/empty-state", () => ({
  EmptyState: ({ title, description }: { title: string; description: ReactNode }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock("@/components/device-explorer", () => ({
  DeviceExplorer: () => <div>mock-device-explorer</div>,
}));

import InventoryPage from "@/app/inventory/page";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

describe("inventory page", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the explorer CTA in the hero", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/inventory")) return Promise.resolve(jsonResponse({ inventory: [] }));
      if (url.includes("/api/brands")) return Promise.resolve(jsonResponse({ brands: [] }));
      return Promise.resolve(jsonResponse({ models: [] }));
    });

    render(<InventoryPage />);

    expect(
      screen.getByRole("link", { name: /open device explorer/i })
    ).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /build a quote/i })).toHaveAttribute("href", "/quote");
  });

  it("shows the loading shell first", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<InventoryPage />);

    expect(screen.getByText("inventory-loading")).toBeInTheDocument();
  });

  it("shows the error shell when loading fails", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/inventory")) return Promise.reject(new Error("network down"));
      if (url.includes("/api/brands")) return Promise.resolve(jsonResponse({ brands: [] }));
      return Promise.resolve(jsonResponse({ models: [] }));
    });

    render(<InventoryPage />);

    expect(await screen.findByText("Inventory unavailable")).toBeInTheDocument();
    expect(await screen.findByText("network down")).toBeInTheDocument();
  });

  it("shows the empty state when no inventory matches", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/inventory")) return Promise.resolve(jsonResponse({ inventory: [] }));
      if (url.includes("/api/brands")) return Promise.resolve(jsonResponse({ brands: [] }));
      return Promise.resolve(jsonResponse({ models: [] }));
    });

    render(<InventoryPage />);

    await waitFor(() => expect(screen.getByText("No matching parts")).toBeInTheDocument());
    expect(screen.getByText("There are no inventory items to show yet.")).toBeInTheDocument();
  });
});
