"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryKey, Product, SubCategoryKey } from "./products";
import { QuickView } from "../_components/QuickView";
import { BrowseOverlay } from "../_components/BrowseOverlay";

export type BrowseTarget =
  | { type: "category"; key: CategoryKey }
  | { type: "subcategory"; key: SubCategoryKey }
  | { type: "tag"; key: "new" | "sale" };

type StorefrontUIValue = {
  quickViewProduct: Product | null;
  openQuickView: (p: Product) => void;
  closeQuickView: () => void;
  browse: BrowseTarget | null;
  openBrowse: (t: BrowseTarget) => void;
  closeBrowse: () => void;
};

const StorefrontUIContext = createContext<StorefrontUIValue | null>(null);

export function StorefrontUIProvider({ children }: { children: ReactNode }) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [browse, setBrowse] = useState<BrowseTarget | null>(null);

  const value = useMemo<StorefrontUIValue>(
    () => ({
      quickViewProduct,
      openQuickView: setQuickViewProduct,
      closeQuickView: () => setQuickViewProduct(null),
      browse,
      openBrowse: setBrowse,
      closeBrowse: () => setBrowse(null),
    }),
    [quickViewProduct, browse],
  );

  return (
    <StorefrontUIContext.Provider value={value}>
      {children}
      <BrowseOverlay />
      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </StorefrontUIContext.Provider>
  );
}

export function useStorefrontUI(): StorefrontUIValue {
  const ctx = useContext(StorefrontUIContext);
  if (!ctx) {
    throw new Error("useStorefrontUI must be used within StorefrontUIProvider");
  }
  return ctx;
}
