"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  categoryTree,
  type CategoryKey,
  type Product,
  type SubCategoryKey,
} from "./products";
import { useProducts } from "./products-context";
import { QuickView } from "../_components/QuickView";
import { BrowseOverlay } from "../_components/BrowseOverlay";

export type BrowseTarget =
  | { type: "category"; key: CategoryKey }
  | { type: "subcategory"; key: SubCategoryKey }
  | { type: "tag"; key: "new" | "sale" };

// URL params used for deep-linking / sharing.
const SHOP_PARAM = "shop"; // category key, subcategory key, or "new" / "sale"
const PRODUCT_PARAM = "p"; // product slug

/** Resolve a raw URL key into a typed browse target (sets don't overlap). */
function targetFromKey(key: string | null): BrowseTarget | null {
  if (!key) return null;
  if (categoryTree.some((c) => c.key === key)) {
    return { type: "category", key: key as CategoryKey };
  }
  if (categoryTree.some((c) => c.subcategories.some((s) => s.key === key))) {
    return { type: "subcategory", key: key as SubCategoryKey };
  }
  if (key === "new" || key === "sale") {
    return { type: "tag", key };
  }
  return null;
}

/** Patch the current querystring without reloading; integrates with the router. */
function patchUrl(patch: { shop?: string | null; p?: string | null }) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if ("shop" in patch) {
    if (patch.shop) params.set(SHOP_PARAM, patch.shop);
    else params.delete(SHOP_PARAM);
  }
  if ("p" in patch) {
    if (patch.p) params.set(PRODUCT_PARAM, patch.p);
    else params.delete(PRODUCT_PARAM);
  }
  const qs = params.toString();
  window.history.pushState(
    null,
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

type StorefrontUIValue = {
  quickViewProduct: Product | null;
  openQuickView: (p: Product) => void;
  closeQuickView: () => void;
  browse: BrowseTarget | null;
  openBrowse: (t: BrowseTarget) => void;
  closeBrowse: () => void;
};

const StorefrontUIContext = createContext<StorefrontUIValue | null>(null);

/**
 * Reads the URL (the single source of truth) and pushes it into provider state.
 * Wrapped in Suspense by the provider because useSearchParams requires it.
 * Runs on first load (deep links) and on back/forward (popstate via the router).
 */
function UrlSync({
  apply,
}: {
  apply: (browse: BrowseTarget | null, product: Product | null) => void;
}) {
  const params = useSearchParams();
  const { findProduct } = useProducts();
  const shop = params.get(SHOP_PARAM);
  const productSlug = params.get(PRODUCT_PARAM);

  useEffect(() => {
    const product = productSlug ? (findProduct(productSlug) ?? null) : null;
    apply(targetFromKey(shop), product);
  }, [shop, productSlug, apply, findProduct]);

  return null;
}

export function StorefrontUIProvider({ children }: { children: ReactNode }) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [browse, setBrowse] = useState<BrowseTarget | null>(null);

  // State is derived from the URL; UrlSync applies it on load and on back/forward.
  const apply = useCallback(
    (nextBrowse: BrowseTarget | null, nextProduct: Product | null) => {
      setBrowse(nextBrowse);
      setQuickViewProduct(nextProduct);
    },
    [],
  );

  const value = useMemo<StorefrontUIValue>(
    () => ({
      quickViewProduct,
      // Keep the current shop overlay when opening a product on top of it.
      openQuickView: (p) => patchUrl({ p: p.slug }),
      closeQuickView: () => patchUrl({ p: null }),
      browse,
      openBrowse: (t) => patchUrl({ shop: t.key, p: null }),
      closeBrowse: () => patchUrl({ shop: null, p: null }),
    }),
    [quickViewProduct, browse],
  );

  return (
    <StorefrontUIContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <UrlSync apply={apply} />
      </Suspense>
      <BrowseOverlay />
      <QuickView product={quickViewProduct} onClose={() => patchUrl({ p: null })} />
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
