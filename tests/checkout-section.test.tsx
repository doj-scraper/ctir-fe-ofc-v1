import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutSection } from "@/components/checkout-section";
import { useCartStore } from "@/store/cartStore";

describe("checkout section", () => {
  beforeEach(() => {
    useCartStore.setState({
      guestSessionId: useCartStore.getState().guestSessionId,
      items: [],
    });
  });

  it("shows the empty cart shell when nothing has been added", () => {
    render(<CheckoutSection />);

    expect(screen.getAllByText(/Your cart is empty/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Back to explorer" })).toHaveAttribute(
      "href",
      "/inventory"
    );
  });

  it("renders subtotal and cart totals from store state", () => {
    useCartStore.getState().addItem({
      sku: "SKU-1",
      name: "Display",
      price: 12.5,
      quantity: 5,
      moq: 5,
      image: "/x.jpg",
    });

    render(<CheckoutSection />);

    expect(screen.getAllByText(/\$62\.50/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$85\.03/)).toBeInTheDocument();
    expect(screen.getByText(/5 units in the order/i)).toBeInTheDocument();
  });
});
