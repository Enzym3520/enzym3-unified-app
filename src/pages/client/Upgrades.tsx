import { capitalizeWords } from "@/lib/utils";
import { parseLocalDate } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Sparkles, CheckCircle2, Plus, Trash2, CreditCard, Loader2, ExternalLink, Info } from "lucide-react";
import { CartSheet } from "@/components/CartSheet";
import { useUpgrades } from "@/hooks/useUpgrades";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import upgradeRubyImg from "@/assets/upgrade-ruby.jpg";
import upgradeEmeraldImg from "@/assets/upgrade-emerald.jpg";
import upgradeSapphireImg from "@/assets/upgrade-sapphire.jpg";

const upgradePackages = [
  {
    name: "Ruby", price: 250, features: ["Uplights"],
    description: "Add ambient lighting to enhance your venue with customizable RGB uplights that transform any space.",
    image: upgradeRubyImg,
  },
  {
    name: "Emerald", price: 500, features: ["Uplights", "Choice of ONE: Projector Monogram OR Cold Sparks"],
    description: "Uplights plus your choice of a custom projected monogram on the dance floor or dramatic cold spark fountains.",
    image: upgradeEmeraldImg,
  },
  {
    name: "Sapphire", price: 1000, features: ["Uplights", "Projector Monogram", "Cold Sparks", "Cloud 9"],
    description: "The ultimate package — uplights, your custom monogram projected on the dance floor, cold spark fountains, and the iconic Cloud 9 low-lying fog effect. Everything you need for a show-stopping celebration.",
    image: upgradeSapphireImg,
  }
];

const uplightColors = [
  { name: "Warm White", hex: "#FDF4DC" }, { name: "Cool White", hex: "#F0F4FF" },
  { name: "Red", hex: "#E03030" }, { name: "Orange", hex: "#F07020" },
  { name: "Amber", hex: "#FFB020" }, { name: "Gold", hex: "#FFD700" },
  { name: "Yellow", hex: "#FFE840" }, { name: "Lime", hex: "#A0E030" },
  { name: "Green", hex: "#30C050" }, { name: "Teal", hex: "#20B2AA" },
  { name: "Cyan", hex: "#00D4E0" }, { name: "Light Blue", hex: "#60B0FF" },
  { name: "Blue", hex: "#3070E0" }, { name: "Indigo", hex: "#5050D0" },
  { name: "Purple", hex: "#8040C0" }, { name: "Violet", hex: "#9B30FF" },
  { name: "Magenta", hex: "#E030B0" }, { name: "Fuchsia", hex: "#FF40FF" },
  { name: "Pink", hex: "#FF70B0" }, { name: "Rose", hex: "#FF507A" },
  { name: "Blush", hex: "#FFB0C0" }, { name: "Coral", hex: "#FF6F61" },
  { name: "Peach", hex: "#FFCBA4" }, { name: "Lavender", hex: "#C8A0FF" },
  { name: "Mint", hex: "#80F0C0" }, { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Turquoise", hex: "#40E0D0" }, { name: "Salmon", hex: "#FA8072" },
];

// Fallback a-la-carte list used while DB loads or if DB is empty
const alaCarteFallback = [
  { id: "projector-monogram", name: "Projector Monogram", price: 300, description: "Custom monogram projected onto your dance floor" },
  { id: "cloud-9", name: "Cloud 9", price: 350, description: "Low-lying fog that creates a dreamy 'dancing on clouds' effect" },
  { id: "cold-sparks", name: "Cold Sparks", price: 400, description: "Dramatic indoor spark fountains for grand moments" },
  { id: "videography-reception", name: "Videography - Reception Only", price: 1000, description: "Professional video coverage of your reception" },
  { id: "videography-full", name: "Videography - Ceremony + Reception", price: 1500, description: "Full video coverage from ceremony through reception" },
];

const learnMoreLinks = [
  { label: "Cloud 9", url: "https://youtu.be/mnTmQZYsnHA?si=V8WJBNQbvPl0gbew" },
  { label: "Cold Sparks", url: "https://youtube.com/shorts/jG79iqAfw9A?si=opG-nv5KgyWr8s45" },
];

const Upgrades = () => {
  const {
    loading, wedding, eventType, upgradeOrders,
    checkoutOpen, setCheckoutOpen,
    emeraldDialogOpen, setEmeraldDialogOpen, emeraldChoice, setEmeraldChoice,
    notes, setNotes, payingWithCard,
    deleteDialogOpen, setDeleteDialogOpen, deleteReason, setDeleteReason, deleting,
    selectedColors, colorNotes, setColorNotes, monogramNumber, setMonogramNumber,
    handleColorToggle, openEmeraldDialog, handleEmeraldSelection,
    handlePayWithCard, handleDeleteRequest, openDeleteDialog,
    cart, addToCart, cartTotal, isInCart,
  } = useUpgrades();

  const [alaCarte, setAlaCarte] = useState(alaCarteFallback);

  useEffect(() => {
    supabase
      .from('upgrades')
      .select('id, name, description, price')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAlaCarte(data.map((u) => ({
            id: u.id,
            name: u.name,
            price: parseFloat(String(u.price)),
            description: u.description ?? '',
          })));
        }
      });
  }, []);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!wedding) return <div className="text-center py-12">No wedding found</div>;

  return (
    <div className="container mx-auto px-4 space-y-6" data-tour="upgrades-intro">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Upgrade Packages</h1>
        <p className="text-muted-foreground mt-1">Enhance your wedding experience with our premium upgrades</p>
      </div>

      <div className="space-y-6">
        {/* Package Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="package-options">
          {upgradePackages.map((pkg) => {
            const purchasedOrder = upgradeOrders.find(
              (o) =>
                (o.selected_package?.toLowerCase() === pkg.name.toLowerCase() ||
                  (Array.isArray(o.items) && o.items.some((i: any) => i.name?.toLowerCase() === pkg.name.toLowerCase()))) &&
                (o.payment_status === 'paid' || o.payment_status === 'pending')
            );
            const isPurchased = !!purchasedOrder;
            return (
            <Card key={pkg.name} className="card-luxury flex flex-col h-full overflow-hidden">
              <div className="relative">
                <AspectRatio ratio={16 / 9}>
                  <img src={pkg.image} alt={`${pkg.name} package preview`} className="object-cover w-full h-full" />
                </AspectRatio>
                <Badge className="absolute top-3 right-3 text-lg px-3 py-1 bg-background/90 text-foreground backdrop-blur-sm">${pkg.price}</Badge>
                {isPurchased && (
                  <Badge className="absolute top-3 left-3 gap-1 bg-green-600 text-white border-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {purchasedOrder.payment_status === 'paid' ? 'Purchased' : 'Pending'}
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <CardTitle className="font-display text-2xl">{pkg.name}</CardTitle>
                </div>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <ul className="space-y-2 mb-6 flex-grow">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (pkg.name === 'Emerald') openEmeraldDialog();
                    else addToCart({ id: `${pkg.name.toLowerCase()}-package`, type: 'package', name: pkg.name, price: pkg.price });
                  }}
                  disabled={isPurchased || isInCart(`${pkg.name.toLowerCase()}-package`) || isInCart('emerald-package')}
                  data-tour={pkg.name === 'Ruby' ? 'cart-system' : undefined}
                >
                  {isPurchased
                    ? <><CheckCircle2 className="mr-2 h-4 w-4" />{purchasedOrder.payment_status === 'paid' ? 'Purchased' : 'Pending'}</>
                    : (isInCart(`${pkg.name.toLowerCase()}-package`) || (pkg.name === 'Emerald' && isInCart('emerald-package')))
                    ? <><CheckCircle2 className="mr-2 h-4 w-4" />In Cart</>
                    : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Uplight Color Options */}
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle>Uplight Color Options</CardTitle>
            <CardDescription>Browse the wide range of colors available for your uplighting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Tap to select up to 2 colors for your event:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {uplightColors.map((color) => {
                const isSelected = selectedColors.includes(color.name);
                return (
                  <button key={color.name} type="button" className="flex flex-col items-center gap-1.5 w-16 group" onClick={() => handleColorToggle(color.name)}>
                    <div className={`w-10 h-10 rounded-full border shadow-sm transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary scale-110' : 'border-border group-hover:scale-105'}`} style={{ backgroundColor: color.hex }} />
                    <span className={`text-[11px] text-center leading-tight ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{color.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedColors.map(name => (
                  <Badge key={name} variant="secondary" className="gap-1">
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: uplightColors.find(c => c.name === name)?.hex }} />
                    {name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="color-notes">How would you like your colors used?</Label>
              <Textarea id="color-notes" placeholder="e.g., alternating colors around the dance floor, one color for cocktail hour and another for reception" value={colorNotes} onChange={(e) => setColorNotes(e.target.value)} className="min-h-[80px]" />
            </div>
            <div className="flex items-start gap-2 rounded-md bg-muted p-3 mt-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">We can color-mix to match virtually any shade for your event. Note: very dark colors (black, dark brown, navy) aren't achievable with LED lighting since LEDs work by emitting light, so brighter and more saturated tones look best.</p>
            </div>
          </CardContent>
        </Card>

        {/* A La Carte */}
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle>A La Carte Options</CardTitle>
            <CardDescription>Individual upgrades available for custom packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {alaCarte.map((item) => {
                const inCart = isInCart(item.id);
                return (
                  <Card key={item.id} className={`card-luxury cursor-pointer ${inCart ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => addToCart({ id: item.id, type: 'alacarte', name: item.name, price: item.price })}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-base">${item.price}</Badge>
                          {inCart ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Learn More */}
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle>Learn More</CardTitle>
            <CardDescription>See our upgrades in action — browse colors, watch demos, and design your monogram</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-3">
              {learnMoreLinks.map((link) => (
                <Button key={link.label} variant="outline" className="h-auto py-3 gap-2" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{link.label}</span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monogram Designer */}
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle>Design Your Monogram</CardTitle>
            <CardDescription>Create a custom projected monogram for your event using the designer below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full rounded-lg overflow-hidden border" style={{ height: '600px' }}>
              <iframe src="https://mydigitalgobo.com/home-clone/" title="Monogram Designer" className="w-full h-full" style={{ border: 'none' }} loading="lazy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monogram-number">Monogram Design Number</Label>
              <Input id="monogram-number" placeholder="e.g., 1234" value={monogramNumber} onChange={(e) => setMonogramNumber(e.target.value)} />
              <p className="text-xs text-muted-foreground">Browse designs above, then enter the design number shown on the monogram you'd like to use.</p>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        {upgradeOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Upgrade Requests</CardTitle>
              <CardDescription>
                Track your upgrade package requests. Need to modify a paid order? Please contact us at{' '}
                <a href="mailto:help@enzym3entertainment.vip" className="text-primary hover:underline">help@enzym3entertainment.vip</a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upgradeOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Order Request</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'pending' ? 'secondary' : order.payment_status === 'cancelled' ? 'destructive' : 'outline'}>{order.payment_status}</Badge>
                        {(order.payment_status === 'draft' || order.payment_status === 'pending') && (
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(order)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.name}{item.emeraldChoice && ` (${item.emeraldChoice})`}</span>
                            <span className="font-medium">${item.price}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-semibold"><span>Total:</span><span>${order.total_amount || 0}</span></div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p>{order.selected_package} Package</p>
                        {order.emerald_choice && <p className="text-muted-foreground">Choice: {order.emerald_choice}</p>}
                      </div>
                    )}
                    {order.notes && <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>}
                    <p className="text-xs text-muted-foreground">Submitted {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Emerald Choice Dialog */}
      <Dialog open={emeraldDialogOpen} onOpenChange={setEmeraldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Your Emerald Addition</DialogTitle>
            <DialogDescription>Select one option to include with your Emerald package</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={emeraldChoice} onValueChange={setEmeraldChoice}>
              <SelectTrigger><SelectValue placeholder="Select one option" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Projector Monogram">Projector Monogram</SelectItem>
                <SelectItem value="Cold Sparks">Cold Sparks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmeraldDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEmeraldSelection}>Add to Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Request Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Upgrade Request?</DialogTitle>
            <DialogDescription>Please tell us why you'd like to remove this upgrade request. This helps us improve our services.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Reason for deletion *</Label>
              <Textarea id="delete-reason" placeholder="e.g., Changed my mind about these upgrades, Found a better option elsewhere, Budget constraints..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={4} className="resize-none" />
              <p className="text-xs text-muted-foreground">This will mark your request as cancelled</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteReason(''); }} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRequest} disabled={!deleteReason.trim() || deleting}>{deleting ? 'Deleting...' : 'Delete Request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <CartSheet wedding={wedding} eventType={eventType} onCheckout={() => setCheckoutOpen(true)} />

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Request</DialogTitle>
            <DialogDescription>Review your order and submit your upgrade request</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Couple:</span><span className="font-medium">{capitalizeWords(wedding.couple_name)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Wedding Date:</span><span className="font-medium">{parseLocalDate(wedding.event_date).toLocaleDateString()}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.emeraldChoice && <p className="text-sm text-muted-foreground">{item.emeraldChoice}</p>}
                      </div>
                      <span className="font-semibold">${item.price}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">${cartTotal}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea placeholder="Any special requests or questions about your upgrades?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Back to Cart</Button>
            <Button onClick={handlePayWithCard} disabled={payingWithCard} className="gap-2" data-tour="submit-request">
              {payingWithCard ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><CreditCard className="h-4 w-4" />Pay with Card</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upgrades;
