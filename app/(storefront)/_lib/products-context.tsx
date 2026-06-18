"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CategoryKey, Product, SubCategoryKey } from "./products";

// The storefront renders products supplied by the server (loaded from the DB,
// falling back to the static catalogue when the DB is empty). Client components
// read them from here instead of importing the hardcoded list, so admin edits
// — images, prices, new products, deletes — show up live.
type ProductsValue = {
  products: Product[];
  findProduct: (idOrSlug: string) => Product | undefined;
  productsIn: (category?: CategoryKey, subcategory?: SubCategoryKey) => Product[];
};

const ProductsContext = createContext<ProductsValue | null>(null);

export function ProductsProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  const value = useMemo<ProductsValue>(
    () => ({
      products,
      findProduct: (idOrSlug) =>
        products.find((p) => p.id === idOrSlug || p.slug === idOrSlug),
      productsIn: (category, subcategory) =>
        products.filter(
          (p) =>
            (!category || p.category === category) &&
            (!subcategory || p.subcategory === subcategory),
        ),
    }),
    [products],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts(): ProductsValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within ProductsProvider");
  }
  return ctx;
}
