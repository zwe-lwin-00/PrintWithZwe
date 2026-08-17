import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthProvider";
import { fetchAdminProducts } from "@/api/catalogClient";
import type { Product } from "@/types/product";

export type ProductsLoadState = "loading" | "ready" | "empty" | "error";

export function useAdminProducts() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [state, setState] = useState<ProductsLoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setItems([]);
      setState("empty");
      return;
    }

    setState("loading");
    setError(null);

    try {
      const nextItems = await fetchAdminProducts(token);
      setItems(nextItems);
      setState(nextItems.length > 0 ? "ready" : "empty");
    } catch (err) {
      setItems([]);
      setState("error");
      setError(err instanceof Error ? err.message : "Products load failed");
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, state, error, reload };
}
