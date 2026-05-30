import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getClientLabel, getPortalDisplayName } from "@/lib/eventUtils";
import { parseLocalDate } from "@/lib/formatters";

interface CartSheetProps {
  wedding?: {
    couple_name: string;
    event_date: string;
    event_type?: string;
    primary_contact_name?: string | null;
  };
  eventType?: string;
  onCheckout: () => void;
}

export const CartSheet = ({ wedding, eventType, onCheckout }: CartSheetProps) => {
  const { cart, removeFromCart, cartTotal, cartOpen, setCartOpen } = useCart();
  const clientLabel = getClientLabel(eventType);

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col z-[201] landscape:max-h-screen">
        <SheetHeader className="landscape:py-3">
          <SheetTitle className="landscape:text-lg">Your Cart</SheetTitle>
          <SheetDescription className="landscape:text-sm">
            Review your selected upgrades
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6 landscape:mt-3 space-y-6 landscape:space-y-3 landscape:max-h-[60vh]">
          {/* Wedding Info */}
          {wedding && (
            <Card>
              <CardContent className="pt-6 landscape:pt-4 landscape:pb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{clientLabel}:</span>
                    <span className="font-medium">{getPortalDisplayName(wedding.event_type, wedding.couple_name, wedding.primary_contact_name)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {parseLocalDate(wedding.event_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cart Items */}
          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.type}
                        </p>
                        {item.emeraldChoice && (
                          <p className="text-sm text-primary mt-1">
                            Choice: {item.emeraldChoice}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">${item.price}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Subtotal */}
          {cart.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Subtotal:</span>
                  <span className="text-2xl font-bold">${cartTotal}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Checkout Button */}
        {cart.length > 0 && (
          <div className="pt-4 landscape:pt-3 border-t">
            <Button 
              size="lg" 
              className="w-full landscape:h-10"
              onClick={() => {
                setCartOpen(false);
                onCheckout();
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
