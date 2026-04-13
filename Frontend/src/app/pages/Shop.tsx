import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Zap,
  Sparkles,
  Crown,
  Shield,
  Coins,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { buyShopItem, getActiveShopItems, getCoinBalance } from "@/api";
import type { ShopItem } from "@/api";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const normalizeShopItems = (items: ShopItem[]): ShopItem[] =>
  items.map((item) => ({
    ...item,
    isPurchased: item.type === "cosmetic" ? item.isPurchased : false,
  }));

export function Shop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "powerup" | "cosmetic" | "subscription"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsResponse, balanceResponse] = await Promise.all([
        getActiveShopItems(),
        getCoinBalance(),
      ]);

      if (itemsResponse.success) {
        setItems(normalizeShopItems(itemsResponse.data || []));
      }

      if (balanceResponse.success) {
        setBalance(balanceResponse.data?.balance || 0);
      }
    } catch (err) {
      console.error("Error loading shop:", err);
      setError("Failed to load shop items");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    const { id: itemId, price, type } = item;

    if (balance < price) {
      popup.error({
        title: "Insufficient coins",
        message: "You do not have enough coins for this item.",
      });
      return;
    }

    try {
      setPurchasing(itemId);
      const response = await buyShopItem(itemId);

      if (response.success && response.data) {
        // Update balance
        setBalance(response.data.remainingCoin);

        if (type === "cosmetic") {
          setItems((prev) =>
            prev.map((currentItem) =>
              currentItem.id === itemId
                ? { ...currentItem, isPurchased: true }
                : currentItem,
            ),
          );
        }

        popup.success({
          title: "Purchase successful",
          message: `Successfully purchased ${item.name}.`,
        });
      } else {
        popup.error({
          title: "Purchase failed",
          message:
            response.error?.message || "Could not complete the purchase.",
        });
      }
    } catch (err: any) {
      console.error("Error purchasing item:", err);
      popup.error({
        title: "Purchase failed",
        message:
          err?.code === "INSUFFICIENT_FUNDS"
            ? "You don't have enough coins."
            : "Purchase failed. Please try again.",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "powerup":
        return <Zap className="w-5 h-5" />;
      case "cosmetic":
        return <Sparkles className="w-5 h-5" />;
      case "subscription":
        return <Crown className="w-5 h-5" />;
      case "boost":
        return <Shield className="w-5 h-5" />;
      default:
        return <ShoppingCart className="w-5 h-5" />;
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.type === selectedCategory);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading shop...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={loadShopData}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-[#155ca5] tracking-tight mb-2">
              Item Shop
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Enhance your learning experience with powerful items!
            </p>
          </div>

          {/* Coin Balance */}
          <div className="bg-white px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
            <Coins className="w-8 h-8 text-[#f1c40f]" fill="#f1c40f" />
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">
                Your Balance
              </div>
              <div className="text-2xl font-black text-[#f1c40f]">
                {balance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedCategory === "all"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            All Items
          </button>
          <button
            onClick={() => setSelectedCategory("powerup")}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedCategory === "powerup"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Zap className="w-5 h-5" />
            Power-ups
          </button>
          <button
            onClick={() => setSelectedCategory("cosmetic")}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedCategory === "cosmetic"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Cosmetics
          </button>
          <button
            onClick={() => setSelectedCategory("subscription")}
            className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
              selectedCategory === "subscription"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Crown className="w-5 h-5" />
            Subscriptions
          </button>
        </div>
      </section>

      {/* Items Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const canAfford = balance >= item.price;
          const isPurchasing = purchasing === item.id;
          const isOwned = item.type === "cosmetic" && item.isPurchased;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden border-2 transition-all ${
                isOwned
                  ? "border-[#27ae60]"
                  : canAfford
                    ? "border-transparent hover:shadow-lg"
                    : "border-transparent opacity-75"
              }`}
            >
              {/* Item Header */}
              <div className="bg-gradient-to-br from-[#155ca5] to-[#005095] p-6 text-white relative">
                <div className="absolute top-4 right-4">
                  {isOwned ? (
                    <CheckCircle className="w-6 h-6 text-[#27ae60]" />
                  ) : (
                    getCategoryIcon(item.type)
                  )}
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mb-4 overflow-hidden border border-white/20">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    getCategoryIcon(item.type)
                  )}
                </div>
                <h3 className="font-bold text-xl mb-1">{item.name}</h3>
                <p className="text-sm opacity-90 capitalize">{item.type}</p>
              </div>

              {/* Item Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">{item.description}</p>

                {/* Features */}
                {item.effect && (
                  <div className="bg-[#155ca5]/5 p-3 rounded-md">
                    <p className="text-sm font-bold text-[#155ca5]">
                      ⚡ {item.effect}
                    </p>
                  </div>
                )}

                {/* Duration */}
                {item.duration && (
                  <p className="text-xs text-gray-500">
                    Duration: {item.duration}{" "}
                    {item.duration === 1 ? "day" : "days"}
                  </p>
                )}

                {/* Price & Purchase */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Coins className="w-6 h-6 text-[#f1c40f]" fill="#f1c40f" />
                    <span className="text-2xl font-black">
                      {item.price.toLocaleString()}
                    </span>
                  </div>

                  {isOwned ? (
                    <span className="px-4 py-2 bg-[#27ae60]/10 text-[#27ae60] rounded-md font-bold text-sm">
                      Owned ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || isPurchasing}
                      className={`px-4 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 ${
                        canAfford
                          ? "bg-[#155ca5] text-white hover:bg-[#005095]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          {canAfford ? "Buy Now" : "Not Enough Coins"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No items in this category</p>
        </div>
      )}

      {/* Earn More Coins Banner */}
      <section className="bg-gradient-to-r from-[#155ca5] to-[#005095] text-white rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">Need More Coins?</h3>
            <p className="text-lg opacity-90">
              Complete lessons, quests, and challenges to earn more coins!
            </p>
          </div>
          <button className="bg-white text-[#155ca5] px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors whitespace-nowrap">
            View Quests →
          </button>
        </div>
      </section>

      <NotificationPopup
        isOpen={popup.notification.isOpen}
        type={popup.notification.type}
        title={popup.notification.title}
        message={popup.notification.message}
        description={popup.notification.description}
        onClose={popup.close}
        onConfirm={popup.notification.onConfirm}
        confirmText={popup.notification.confirmText}
        cancelText={popup.notification.cancelText}
        showCancelButton={popup.notification.showCancelButton}
        autoClose={popup.notification.autoClose}
        autoCloseDuration={popup.notification.autoCloseDuration}
      />
    </main>
  );
}
