import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "@/lib/products";
import type { Product } from "@/types/product";

export type ProductsLoadState = "loading" | "ready" | "empty" | "error";

export function useProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [state, setState] = useState<ProductsLoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      const nextItems = await fetchProducts();
      setItems(nextItems);
      setState(nextItems.length > 0 ? "ready" : "empty");
    } catch (err) {
      setItems([]);
      setState("error");
      setError(err instanceof Error ? err.message : "Products load failed");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, state, error, reload };
}
