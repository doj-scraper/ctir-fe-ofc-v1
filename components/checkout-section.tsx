"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { AddressForm } from "@/components/forms/AddressForm";
import { FormInput } from "@/components/forms/FormInput";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHero } from "@/components/page-hero";
import { PageLoadingState } from "@/components/loading-state";
import { SectionHeader } from "@/components/section-header";
import { SummaryPanel } from "@/components/summary-panel";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import type { AddressFormData } from "@/lib/validation";

type ShippingMethod = "standard" | "priority" | "freight";
type PaymentMethod = "card" | "net-30" | "wire";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CheckoutSection() {
  const { user, isLoggedIn } = useAuth();
  const {
    guestSessionId,
    initializeGuest,
    items,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("net-30");
  const [address, setAddress] = useState<Partial<AddressFormData>>({ country: "US" });
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeGuest();
  }, [initializeGuest]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const shipping = useMemo(() => {
    if (shippingMethod === "priority") return 35;
    if (shippingMethod === "freight") return subtotal > 500 ? 0 : 85;
    return subtotal > 500 ? 0 : 18;
  }, [shippingMethod, subtotal]);

  const tax = useMemo(() => subtotal * 0.0725, [subtotal]);
  const total = subtotal + shipping + tax;

  const addressComplete =
    !!address.street &&
    !!address.city &&
    !!address.state &&
    !!address.zipCode &&
    !!address.country;

  const readyToSubmit =
    items.length > 0 &&
    contactName.trim().length > 0 &&
    company.trim().length > 0 &&
    email.trim().length > 0 &&
    addressComplete;

  const identityText = isLoggedIn
    ? user?.name ?? "Signed in buyer"
    : guestSessionId
      ? `Guest session ${guestSessionId}`
      : "Guest session initializing";

  const handleSubmit = () => {
    if (!readyToSubmit) {
      setSubmissionError(
        "Fill the required contact and shipping fields before placing the order."
      );
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    window.setTimeout(() => {
      const orderRef = `SO-${String(Date.now()).slice(-6)}`;
      clearCart();
      setIsSubmitting(false);
      window.location.assign(`/checkout/success?order=${orderRef}`);
    }, 900);
  };

  const heroActions = (
    <>
      <Link href="/inventory" className="btn-secondary">
        Back to explorer
      </Link>
      <Link href="/quote" className="btn-primary">
        Quote instead
      </Link>
    </>
  );

  if (isSubmitting) {
    return (
      <section className="pt-24 pb-20">
        <PageHero
          eyebrow="Checkout"
          title={
            <>
              LOCK IN THE <span className="text-ct-accent">ORDER</span>
            </>
          }
          description="Submitting the wholesale order and preparing the confirmation flow."
          actions={heroActions}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <PageLoadingState />
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 pb-20">
      <PageHero
        eyebrow="Checkout"
        title={
          <>
            LOCK IN THE <span className="text-ct-accent">ORDER</span>
          </>
        }
        description="Review quantities, capture shipping details, and confirm a clean order without leaving the storefront flow."
        actions={heroActions}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {submissionError && (
          <div className="mb-8">
            <ErrorState
              title="Checkout validation failed"
              message={submissionError}
              onRetry={() => setSubmissionError(null)}
              retryLabel="Fix details"
              secondaryAction={
                <Link href="/support" className="btn-secondary">
                  Contact support
                </Link>
              }
            />
          </div>
        )}

        {items.length === 0 && (
          <div className="mb-8">
            <EmptyState
              title="Your cart is empty."
              description="Add compatible parts from the inventory explorer before you can place a wholesale order."
              icon={<ShoppingCart className="size-8" />}
              actions={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/inventory" className="btn-primary">
                    Return to Explorer
                  </Link>
                  <Link href="/quote" className="btn-secondary">
                    Build a Quote
                  </Link>
                </div>
              }
            />
            <p className="sr-only">
              Your cart is empty. Return to the inventory explorer to stage parts or switch to
              quote mode.
            </p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="dashboard-card p-6">
              <SectionHeader
                eyebrow="Cart review"
                title={`${itemCount} unit${itemCount === 1 ? "" : "s"} in the order`}
                description="MOQ is enforced locally and quantities can be adjusted before submission."
              />
              <p className="sr-only">{`${itemCount} unit${itemCount === 1 ? "" : "s"} staged`}</p>

              <div className="mt-6 space-y-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item.sku}
                      className="rounded-2xl border border-white/10 bg-ct-bg-secondary/40 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ct-text">{item.name}</p>
                            <p className="mt-1 font-mono text-xs text-ct-text-secondary">
                              {item.sku}
                            </p>
                            <p className="mt-2 text-xs text-ct-text-secondary">
                              MOQ {item.moq} · Wholesale part
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.sku, Math.max(item.quantity - 1, item.moq))
                            }
                            disabled={item.quantity <= item.moq}
                            className="h-9 w-9 rounded-md border border-white/10 text-ct-text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Decrease ${item.name}`}
                          >
                            −
                          </button>
                          <span className="w-16 text-center font-mono text-sm text-ct-text">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                            className="h-9 w-9 rounded-md border border-white/10 text-ct-text-secondary"
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.sku)}
                            className="h-9 w-9 rounded-md border border-white/10 text-ct-text-secondary"
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <span className="text-sm text-ct-text-secondary">
                          Stocked at bulk pricing
                        </span>
                        <span className="text-lg font-semibold text-ct-accent">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-ct-bg-secondary/30 p-6 text-center text-sm text-ct-text-secondary">
                    No line items yet. Add parts from the inventory explorer to stage the order.
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card p-6">
              <SectionHeader
                eyebrow="Shipping details"
                title="Contact and delivery"
                description="Guest buyers can submit the form below. Signed-in accounts can use the same flow without losing cart context."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FormInput
                  id="contactName"
                  label="Contact name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Your name"
                  required
                />
                <FormInput
                  id="company"
                  label="Company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Company name"
                  required
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormInput
                  id="email"
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  required
                />
                <FormInput
                  id="poNumber"
                  label="PO number"
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="mt-4">
                <AddressForm
                  values={address}
                  onAddressChange={(patch) => setAddress((current) => ({ ...current, ...patch }))}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <SummaryPanel
              title="Checkout identity"
              description="Technical session state and order method live side by side for quick review."
              items={[
                {
                  label: "Identity",
                  value: identityText,
                  tone: "accent",
                },
                {
                  label: "Mode",
                  value: isLoggedIn ? "Signed in" : "Guest checkout",
                  helper: isLoggedIn
                    ? "Order history will attach to the active account."
                    : "Guest session persists locally until the order is submitted.",
                },
              ]}
              footerLabel="Session ID"
              footerValue={guestSessionId ?? "initializing"}
              footerNote="Displayed in IBM Plex Mono to match the lab-tech UI language."
            />

            <div className="dashboard-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-ct-accent" />
                <h2 className="font-semibold text-ct-text">Order method</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-ct-text-secondary mb-2">
                    Shipping speed
                  </label>
                  <select
                    value={shippingMethod}
                    onChange={(event) => setShippingMethod(event.target.value as ShippingMethod)}
                    className="input-dark"
                  >
                    <option value="standard">Standard</option>
                    <option value="priority">Priority</option>
                    <option value="freight">Freight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-ct-text-secondary mb-2">
                    Payment terms
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="input-dark"
                  >
                    <option value="net-30">Net 30</option>
                    <option value="card">Card</option>
                    <option value="wire">Wire transfer</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-white/10 bg-ct-bg-secondary/40 p-4 text-sm text-ct-text-secondary">
                  {paymentMethod === "net-30"
                    ? "Approved accounts can move on terms without card capture."
                    : paymentMethod === "wire"
                      ? "Wire instructions will be attached to the order confirmation."
                      : "Card payment stays in the secure checkout path."}
                </div>
              </div>
            </div>

            <div className="dashboard-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-ct-accent" />
                <h2 className="font-semibold text-ct-text">Totals</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ct-text-secondary">Subtotal</span>
                  <span className="text-ct-text">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ct-text-secondary">Shipping</span>
                  <span className="text-ct-text">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ct-text-secondary">Tax estimate</span>
                  <span className="text-ct-text">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-ct-text-secondary">Grand total</span>
                  <span className="text-2xl font-semibold text-ct-accent">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!readyToSubmit}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place order
                </button>
                <Link href="/support" className="btn-secondary inline-flex items-center gap-2">
                  Help <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-ct-text-secondary">
                <BadgeCheck className="w-4 h-4 text-ct-accent" />
                {readyToSubmit
                  ? "Everything is ready for submission."
                  : "Fill the required fields to enable order placement."}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-ct-bg-secondary/40 p-4 text-sm text-ct-text-secondary">
              <div className="flex items-center gap-2 text-ct-text mb-2">
                <ShieldCheck className="w-4 h-4 text-ct-accent" />
                Review checkpoint
              </div>
              Payment terms, shipping speed, and cart totals are all local-first in this build.
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
