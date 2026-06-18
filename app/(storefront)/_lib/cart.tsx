"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { type Product } from "./products";
import { useProducts } from "./products-context";

export type CartLine = {
  productId: string;
  size: string;
  color: string;
  qty: number;
};

type State = { lines: CartLine[] };
type Action =
  | { type: "add"; line: CartLine }
  | { type: "remove"; productId: string; size: string; color: string }
  | { type: "setQty"; productId: string; size: string; color: string; qty: number }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "sr-cart-v1";

function sameLine(a: CartLine, b: Pick<CartLine, "productId" | "size" | "color">) {
  return a.productId === b.productId && a.size === b.size && a.color === b.color;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };
    case "clear":
      return { lines: [] };
    case "add": {
      const idx = state.lines.findIndex((l) => sameLine(l, action.line));
      if (idx === -1) return { lines: [...state.lines, action.line] };
      const next = [...state.lines];
      next[idx] = { ...next[idx], qty: next[idx].qty + action.line.qty };
      return { lines: next };
    }
    case "remove":
      return { lines: state.lines.filter((l) => !sameLine(l, action)) };
    case "setQty": {
      if (action.qty <= 0) {
        return { lines: state.lines.filter((l) => !sameLine(l, action)) };
      }
      return {
        lines: state.lines.map((l) =>
          sameLine(l, action) ? { ...l, qty: action.qty } : l,
        ),
      };
    }
  }
}

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  add: (line: CartLine) => void;
  remove: (productId: string, size: string, color: string) => void;
  setQty: (productId: string, size: string, color: string, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  lineWithProduct: () => { line: CartLine; product: Product }[];
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { findProduct } = useProducts();
  const [{ lines }, dispatch] = useReducer(reducer, { lines: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const withProducts = lines
      .map((line) => {
        const product = findProduct(line.productId);
        return product ? { line, product } : null;
      })
      .filter((x): x is { line: CartLine; product: Product } => x !== null);

    const subtotal = withProducts.reduce(
      (sum, { line, product }) => sum + product.price * line.qty,
      0,
    );
    const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

    return {
      lines,
      itemCount,
      subtotal,
      add: (line) => dispatch({ type: "add", line }),
      remove: (productId, size, color) =>
        dispatch({ type: "remove", productId, size, color }),
      setQty: (productId, size, color, qty) =>
        dispatch({ type: "setQty", productId, size, color, qty }),
      clear: () => dispatch({ type: "clear" }),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      lineWithProduct: () => withProducts,
    };
  }, [lines, isOpen, findProduct]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
