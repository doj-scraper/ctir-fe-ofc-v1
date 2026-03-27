import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Download, Package, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SummaryPanel } from "@/components/summary-panel";

export const metadata: Metadata = {
  title: "Order confirmed | CellTech Distributor",
  description: "Wholesale order confirmation with order reference and next actions.",
};

interface CheckoutSuccessPageProps {
  searchParams?: Promise<{
    order?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const orderId = resolvedSearchParams?.order ?? "SO-000000";

  return (
    <section className="pt-24 pb-20">
      <PageHero
        eyebrow="Checkout"
        title={
          <>
            ORDER <span className="text-ct-accent">CONFIRMED</span>
          </>
        }
        description="The wholesale order has been captured locally and cleared from the active cart."
        actions={
          <>
            <Link href="/inventory" className="btn-secondary">
              Return to inventory
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Open dashboard
            </Link>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="dashboard-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-ct-accent/20 bg-ct-accent/10 text-ct-accent">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-micro text-ct-accent">Confirmation</p>
                <h2 className="mt-1 text-2xl font-semibold text-ct-text">Your order is in queue</h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-ct-bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-widest text-ct-text-secondary">Order ID</p>
              <p className="mt-2 font-mono text-lg text-ct-accent">{orderId}</p>
              <p className="mt-2 text-sm text-ct-text-secondary">
                Keep this reference for invoice requests or follow-up questions.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/support" className="btn-secondary inline-flex items-center gap-2">
                Need help? <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/quote" className="btn-primary inline-flex items-center gap-2">
                Build another quote <Package className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <SummaryPanel
            title="Next actions"
            description="Use the confirmation to keep the order moving."
            items={[
              {
                label: "Invoice",
                value: "Available on request",
                helper: "Support can generate a PDF invoice once the order is reviewed.",
                tone: "accent",
              },
              {
                label: "Shipping",
                value: "Tracked by fulfillment",
                helper: "Shipping updates will follow the selected freight method.",
              },
              {
                label: "Support",
                value: "Open if anything changes",
                helper: "Use the support hub for corrections or urgent adjustments.",
              },
            ]}
            footerLabel="Completion status"
            footerValue="Queued"
            footerNote="The cart has been cleared and a fresh session remains available for the next order."
            action={
              <Link href="/inventory" className="btn-secondary inline-flex w-full items-center justify-center gap-2">
                Continue browsing <Download className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    </section>
  );
}
