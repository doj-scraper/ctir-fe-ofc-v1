import type { Metadata } from "next";
import { DeviceExplorer } from '@/components/device-explorer';

export const metadata: Metadata = {
  title: "Parts Catalog | CellTech Distributor",
  description: "Browse our extensive catalog of premium mobile phone parts - screens, batteries, cameras, and more.",
};

export default function CatalogPage() {
  return (
    <div className="pt-16">
      <DeviceExplorer />
    </div>
  );
}
