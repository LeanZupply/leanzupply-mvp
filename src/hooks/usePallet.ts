import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { calculateOrderTotal } from "@/lib/priceCalculations";

interface PalletItem {
  id: string;
  product_id: string;
  quantity: number;
  notes?: string;
  product: {
    id: string;
    name: string;
    price_unit: number;
    preview_url?: string;
    category: string;
    manufacturer_id: string;
    discount_3u?: number | null;
    discount_5u?: number | null;
    discount_8u?: number | null;
    discount_10u?: number | null;
  };
}

export const usePallet = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<PalletItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("pallet_items")
        .select(`
          id,
          product_id,
          quantity,
          notes,
          product:products(
            id,
            name,
            price_unit,
            preview_url,
            category,
            manufacturer_id,
            discount_3u,
            discount_5u,
            discount_8u,
            discount_10u
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching pallet:", error);
    }
  };

  const addToPallet = async (productId: string, quantity: number = 1, notes?: string) => {
    if (!user) {
      toast.error("Debes iniciar sesión para añadir al pallet");
      return false;
    }

    setLoading(true);
    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("pallet_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("status", "active")
        .single();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from("pallet_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from("pallet_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            notes,
            status: "active",
          });

        if (error) throw error;
      }

      // Track action
      await supabase.from("order_tracking").insert({
        user_id: user.id,
        product_id: productId,
        step: "added_to_pallet",
        metadata: { quantity, notes },
      });

      toast.success("Producto añadido al pallet");
      await fetchPallet();
      return true;
    } catch (error: any) {
      console.error("Error adding to pallet:", error);
      toast.error(error.message || "Error al añadir al pallet");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      const { error } = await supabase
        .from("pallet_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;
      await fetchPallet();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Error al actualizar cantidad");
    }
  };

  const removeFromPallet = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("pallet_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Producto eliminado del pallet");
      await fetchPallet();
    } catch (error) {
      console.error("Error removing from pallet:", error);
      toast.error("Error al eliminar del pallet");
    }
  };

  const clearPallet = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("pallet_items")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error("Error clearing pallet:", error);
    }
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => {
      const itemTotal = calculateOrderTotal(item.product.price_unit, item.quantity, {
        discount_3u: item.product.discount_3u,
        discount_5u: item.product.discount_5u,
        discount_8u: item.product.discount_8u,
        discount_10u: item.product.discount_10u,
      });
      return sum + itemTotal;
    }, 0);
  };

  useEffect(() => {
    fetchPallet();
  }, [user]);

  return {
    items,
    loading,
    addToPallet,
    updateQuantity,
    removeFromPallet,
    clearPallet,
    getTotalPrice,
    refreshPallet: fetchPallet,
  };
};
