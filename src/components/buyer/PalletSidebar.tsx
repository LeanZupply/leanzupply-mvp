import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Package } from "lucide-react";
import { usePallet } from "@/hooks/usePallet";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculateOrderTotal } from "@/lib/priceCalculations";

export const PalletSidebar = () => {
  const { items, updateQuantity, removeFromPallet, getTotalPrice } = usePallet();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!profile?.is_verified) {
      toast.error("Tu cuenta debe ser verificada para realizar pedidos");
      return;
    }

    if (items.length === 0) {
      toast.error("El pallet está vacío");
      return;
    }

    try {
      // Create orders for each item in pallet
      const orderPromises = items.map(async (item) => {
        const totalPrice = calculateOrderTotal(item.product.price_unit, item.quantity, {
          discount_3u: item.product.discount_3u,
          discount_5u: item.product.discount_5u,
          discount_8u: item.product.discount_8u,
          discount_10u: item.product.discount_10u,
        });

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: profile.id,
            manufacturer_id: item.product.manufacturer_id,
            product_id: item.product_id,
            quantity: item.quantity,
            total_price: totalPrice,
            buyer_notes: item.notes,
            status: "pending",
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Track order creation
        await supabase.from("order_tracking").insert({
          user_id: profile.id,
          product_id: item.product_id,
          order_id: order.id,
          step: "requested",
        });

        // Mark pallet item as processed
        await supabase
          .from("pallet_items")
          .update({ status: "ordered" })
          .eq("id", item.id);
      });

      await Promise.all(orderPromises);

      toast.success(
        "Pedido enviado",
        { description: "En breve te contactaremos para confirmar tu pedido" }
      );

      // Navigate to orders page
      navigate("/buyer/orders");
    } catch (error: any) {
      console.error("Error creating orders:", error);
      toast.error("Error al procesar el pedido");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pallet de Compra
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">Tu pallet está vacío</p>
              <p className="text-sm text-muted-foreground">
                Añade productos para comenzar tu pedido
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex gap-4">
                        {item.product.preview_url && (
                          <img
                            src={item.product.preview_url}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium line-clamp-2">{item.product.name}</h4>
                          <Badge variant="secondary">{item.product.category}</Badge>
                          <p className="text-sm font-semibold">
                            €{item.product.price_unit.toLocaleString()} x {item.quantity}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground">{item.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromPallet(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">
                          €{calculateOrderTotal(item.product.price_unit, item.quantity, {
                            discount_3u: item.product.discount_3u,
                            discount_5u: item.product.discount_5u,
                            discount_8u: item.product.discount_8u,
                            discount_10u: item.product.discount_10u,
                          }).toLocaleString()}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>€{getTotalPrice().toLocaleString()}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!profile?.is_verified}
                >
                  {profile?.is_verified ? "Realizar Pedido" : "Cuenta no verificada"}
                </Button>

                {!profile?.is_verified && (
                  <p className="text-xs text-center text-muted-foreground">
                    Tu cuenta debe ser verificada para realizar pedidos
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
