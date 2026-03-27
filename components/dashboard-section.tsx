"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Clock3,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

const recentOrders = [
  {
    id: "ORD-1042",
    status: "Packed",
    total: 842.16,
    date: "Today",
    items: 6,
  },
  {
    id: "ORD-1037",
    status: "In transit",
    total: 319.54,
    date: "Yesterday",
    items: 4,
  },
  {
    id: "ORD-1028",
    status: "Delivered",
    total: 1184.22,
    date: "Last week",
    items: 9,
  },
];

const savedLists = [
  { name: "iPhone fast-movers", parts: 12, note: "Shared with 3 teammates" },
  { name: "Samsung repair bench", parts: 8, note: "Updated 2 days ago" },
  { name: "Priority restock", parts: 5, note: "Auto reorder enabled" },
];

const quickActions = [
  { label: "Browse catalog", href: "/catalog" },
  { label: "Build a quote", href: "/quote" },
  { label: "Start checkout", href: "/checkout" },
  { label: "Open support", href: "/support" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function DashboardSection() {
  const { user, isLoggedIn, login, logout, isLoading } = useAuth();
  const { items, getTotalItems, getTotalPrice } = useCart();
  const [status, setStatus] = useState<string | null>(null);

  const cartItems = getTotalItems();
  const cartValue = getTotalPrice();

  const handleDemoAccess = async () => {
    setStatus(null);
    await login("ops@celltech.com", "Demo123!");
    setStatus("Demo account loaded.");
  };

  const initials = (user?.name || "CellTech")
    .split(" ")
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <PageHero
          eyebrow="Account dashboard"
          title={
            <>
              YOUR ORDERING <span className="text-ct-accent">WORKBENCH</span>
            </>
          }
          description="Track open orders, keep team buy lists organized, and move from quote to checkout without losing context."
          actions={
            <>
              <Link href="/catalog" className="btn-secondary">
                Browse catalog
              </Link>
              <Link href="/checkout" className="btn-primary">
                Checkout cart
              </Link>
            </>
          }
        />

        {status && (
          <div className="mb-8 rounded-2xl border border-ct-accent/20 bg-ct-accent/10 px-4 py-3 text-sm text-ct-accent">
            {status}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <div className="dashboard-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-micro text-ct-text-secondary mb-2">Profile</p>
                  <h2 className="text-xl font-semibold text-ct-text">
                    {isLoggedIn ? user?.name ?? "Signed in user" : "Demo operations access"}
                  </h2>
                  <p className="text-sm text-ct-text-secondary mt-2">
                    {isLoggedIn
                      ? user?.company || "Wholesale account"
                      : "Use the demo sign-in to preview the dashboard state."}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-ct-accent/10 border border-ct-accent/20 flex items-center justify-center text-ct-accent font-semibold">
                  {initials}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-ct-bg-secondary/50 p-4">
                  <p className="text-xs text-ct-text-secondary uppercase tracking-widest">
                    Open cart
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ct-text">{cartItems}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-ct-bg-secondary/50 p-4">
                  <p className="text-xs text-ct-text-secondary uppercase tracking-widest">
                    Cart value
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ct-text">
                    {formatCurrency(cartValue)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setStatus("Signed out of demo account.");
                    }}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDemoAccess}
                    className="btn-primary inline-flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isLoading ? "Loading..." : "Load demo account"}
                  </button>
                )}
                <Link href="/support" className="btn-secondary inline-flex items-center gap-2">
                  Support <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="dashboard-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-ct-accent" />
                <h3 className="font-semibold text-ct-text">Saved lists</h3>
              </div>
              <div className="space-y-3">
                {savedLists.map((list) => (
                  <div
                    key={list.name}
                    className="rounded-xl border border-white/10 bg-ct-bg-secondary/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-ct-text">{list.name}</p>
                        <p className="text-xs text-ct-text-secondary mt-1">{list.note}</p>
                      </div>
                      <span className="text-xs font-mono text-ct-accent">{list.parts} parts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="stat-card">
                <div className="flex items-center gap-2 text-ct-text-secondary text-xs uppercase tracking-widest">
                  <ShoppingCart className="w-4 h-4 text-ct-accent" />
                  Cart items
                </div>
                <p className="mt-3 text-3xl font-semibold text-ct-text">{cartItems}</p>
                <p className="mt-2 text-sm text-ct-text-secondary">
                  {items.length ? "Ready to convert to an order." : "Add parts to start a workflow."}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-ct-text-secondary text-xs uppercase tracking-widest">
                  <BarChart3 className="w-4 h-4 text-ct-accent" />
                  Spend
                </div>
                <p className="mt-3 text-3xl font-semibold text-ct-text">{formatCurrency(cartValue)}</p>
                <p className="mt-2 text-sm text-ct-text-secondary">Live subtotal from the current cart.</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 text-ct-text-secondary text-xs uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-ct-accent" />
                  Service level
                </div>
                <p className="mt-3 text-3xl font-semibold text-ct-text">24h</p>
                <p className="mt-2 text-sm text-ct-text-secondary">
                  Quote and support responses stay inside one business day.
                </p>
              </div>
            </div>

            <div className="dashboard-card p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-micro text-ct-text-secondary mb-2">Recent orders</p>
                  <h3 className="text-xl font-semibold text-ct-text">Shipment history</h3>
                </div>
                <Link href="/checkout" className="link-arrow">
                  Start an order <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/10 bg-ct-bg-secondary/40 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-ct-text">{order.id}</p>
                          <span className="badge">{order.status}</span>
                        </div>
                        <p className="text-xs text-ct-text-secondary mt-2">
                          {order.items} items · {order.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-ct-accent">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-xs text-ct-text-secondary">Wholesale subtotal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="dashboard-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-ct-accent" />
                  <h3 className="font-semibold text-ct-text">Team actions</h3>
                </div>
                <div className="space-y-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-ct-bg-secondary/40 px-4 py-3 hover:border-ct-accent/30 transition-colors"
                    >
                      <span className="text-sm text-ct-text">{action.label}</span>
                      <ArrowRight className="w-4 h-4 text-ct-accent" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="dashboard-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-ct-accent" />
                  <h3 className="font-semibold text-ct-text">Account notes</h3>
                </div>
                <div className="space-y-4 text-sm text-ct-text-secondary">
                  <div className="flex items-center gap-3">
                    <Clock3 className="w-4 h-4 text-ct-accent" />
                    <span>Quotes are reviewed the same business day.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-ct-accent" />
                    <span>Saved lists stay in sync with the current cart state.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-ct-accent" />
                    <span>Checkout is pre-filled from the cart and address form.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
