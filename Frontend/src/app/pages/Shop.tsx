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
import { Link } from "react-router";
import { buyShopItem, getActiveShopItems, getCoinBalance } from "@/api";
import type { ShopItem, ShopItemType } from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import getPagination from "@/utils/pagination";
import scrollToTop from "@/utils/scrollToTop";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const isCosmeticShopType = (shopType: ShopItemType) =>
  shopType === "AVATAR" || shopType === "BACKGROUND";

const normalizeShopItems = (items: ShopItem[]): ShopItem[] =>
  items.map((item) => ({
    ...item,
    isPurchased: isCosmeticShopType(item.shopType ?? "SKIP")
      ? item.isPurchased
      : false,
  }));

type ShopFilterCategory = "ALL" | ShopItemType;

export function Shop() {
  const { copy } = useLanguage();
  const { refreshCurrentUser } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] =
    useState<ShopFilterCategory>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
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
      setError(
        copy("Failed to load shop items", "Không thể tải vật phẩm cửa hàng"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = async (item: ShopItem) => {
    const { id: itemId, price } = item;
    const shopType = getItemShopType(item);

    try {
      setPurchasing(itemId);
      const response = await buyShopItem(itemId);

      if (response.success && response.data) {
        // Update balance
        setBalance(response.data.remainingCoin);
        void refreshCurrentUser(false);

        if (isCosmeticShopType(shopType)) {
          setItems((prev) =>
            prev.map((currentItem) =>
              currentItem.id === itemId
                ? { ...currentItem, isPurchased: true }
                : currentItem,
            ),
          );
        }

        popup.success({
          title: copy("Purchase successful", "Mua thành công"),
          message: copy(
            `Successfully purchased ${item.name}.`,
            `Đã mua ${item.name} thành công.`,
          ),
        });
      } else {
        popup.error({
          title: copy("Purchase failed", "Mua thất bại"),
          message:
            response.error?.message ||
            copy(
              "Could not complete the purchase.",
              "Không thể hoàn tất giao dịch.",
            ),
        });
      }
    } catch (err: any) {
      console.error("Error purchasing item:", err);
      popup.error({
        title: copy("Purchase failed", "Mua thất bại"),
        message:
          err?.code === "INSUFFICIENT_FUNDS"
            ? copy("You don't have enough coins.", "Bạn không có đủ xu.")
            : copy(
                "Purchase failed. Please try again.",
                "Mua thất bại. Vui lòng thử lại.",
              ),
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchase = (item: ShopItem) => {
    const { price } = item;

    if (balance < price) {
      popup.error({
        title: copy("Insufficient coins", "Không đủ xu"),
        message: copy(
          "You do not have enough coins for this item.",
          "Bạn không có đủ xu cho vật phẩm này.",
        ),
      });
      return;
    }

    // Show confirmation dialog
    popup.confirm({
      title: copy("Confirm Purchase", "Xác nhận mua"),
      message: copy(
        `Do you want to buy ${item.name}?`,
        `Bạn có muốn mua ${item.name}?`,
      ),
      description: copy(
        `This will cost ${item.price} coins.`,
        `Điều này sẽ tốn ${item.price} xu.`,
      ),
      confirmText: copy("Buy", "Mua"),
      cancelText: copy("Cancel", "Hủy"),
      onConfirm: () => handleConfirmPurchase(item),
    });
  };

  const getCategoryIcon = (category: ShopItemType) => {
    switch (category) {
      case "SKIP":
        return <Zap className="w-5 h-5" />;
      case "AVATAR":
        return <Sparkles className="w-5 h-5" />;
      case "VIP":
        return <Crown className="w-5 h-5" />;
      case "EXP":
        return <Shield className="w-5 h-5" />;
      case "BACKGROUND":
        return <ShoppingCart className="w-5 h-5" />;
      default:
        return <ShoppingCart className="w-5 h-5" />;
    }
  };

  const getItemShopType = (item: ShopItem): ShopItemType => {
    if (item.shopType) return item.shopType;

    const searchText =
      `${item.name} ${item.description} ${item.effect ?? ""}`.toLowerCase();

    if (searchText.includes("background")) return "BACKGROUND";
    if (searchText.includes("avatar")) return "AVATAR";
    if (searchText.includes("vip") || searchText.includes("subscription"))
      return "VIP";
    if (searchText.includes("exp") || searchText.includes("boost"))
      return "EXP";
    return "AVATAR";
  };

  const isAvatarItem = (item: ShopItem) => {
    return getItemShopType(item) === "AVATAR";
  };

  const isBackgroundItem = (item: ShopItem) => {
    return getItemShopType(item) === "BACKGROUND";
  };

  const isItemOwned = (item: ShopItem) => {
    const shopType = getItemShopType(item);
    return isCosmeticShopType(shopType) && item.isPurchased;
  };

  const filteredItems =
    selectedCategory === "ALL"
      ? items
      : items.filter((item) => getItemShopType(item) === selectedCategory);

  const sortedFilteredItems = [...filteredItems].sort((left, right) => {
    const leftOwned = isItemOwned(left);
    const rightOwned = isItemOwned(right);

    if (leftOwned === rightOwned) {
      return 0;
    }

    return leftOwned ? 1 : -1;
  });

  const itemsPerPage = 12;
  const totalPages = Math.ceil(sortedFilteredItems.length / itemsPerPage);
  const pagination = getPagination(currentPage, totalPages);
  const visibleItems =
    totalPages > 0
      ? sortedFilteredItems.slice(
          (pagination.current - 1) * itemsPerPage,
          pagination.current * itemsPerPage,
        )
      : [];

  const handleCategoryChange = (category: ShopFilterCategory) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    scrollToTop();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">
            {copy("Loading shop...", "Đang tải cửa hàng...")}
          </p>
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
            {copy("Retry", "Thử lại")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#155ca5] tracking-tight mb-2">
              {copy("Item Shop", "Cửa hàng vật phẩm")}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium">
              {copy(
                "Enhance your learning experience with powerful items!",
                "Nâng cấp trải nghiệm học tập với các vật phẩm hữu ích!",
              )}
            </p>
          </div>

          {/* Coin Balance */}
          <div className="w-full sm:w-auto bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-sm flex items-center gap-3">
            <Coins
              className="w-7 h-7 sm:w-8 sm:h-8 text-[#f1c40f]"
              fill="#f1c40f"
            />
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">
                {copy("Your Balance", "Số dư của bạn")}
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#f1c40f]">
                {balance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 sm:p-3 rounded-lg shadow-sm overflow-x-auto">
          <button
            onClick={() => handleCategoryChange("ALL")}
            className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
              selectedCategory === "ALL"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {copy("ALL", "TẤT CẢ")}
          </button>
          <button
            onClick={() => handleCategoryChange("SKIP")}
            className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
              selectedCategory === "SKIP"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Zap className="w-5 h-5" />
            {copy("SKIP", "BỎ QUA")}
          </button>
          <button
            onClick={() => handleCategoryChange("VIP")}
            className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
              selectedCategory === "VIP"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Crown className="w-5 h-5" />
            VIP
          </button>
          <button
            onClick={() => handleCategoryChange("AVATAR")}
            className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
              selectedCategory === "AVATAR"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {copy("AVATAR", "AVATAR")}
          </button>
          <button
            onClick={() => handleCategoryChange("BACKGROUND")}
            className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
              selectedCategory === "BACKGROUND"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {copy("BACKGROUND", "ẢNH NỀN")}
          </button>
          <button
            onClick={() => handleCategoryChange("EXP")}
            className={`shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
              selectedCategory === "EXP"
                ? "bg-[#155ca5] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Shield className="w-5 h-5" />
            EXP
          </button>
        </div>
      </section>

      {/* Items Grid */}
      <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        {visibleItems.map((item) => {
          const canAfford = balance >= item.price;
          const isPurchasing = purchasing === item.id;
          const itemShopType = getItemShopType(item);
          const isOwned = isCosmeticShopType(itemShopType) && item.isPurchased;
          const isBackground = isBackgroundItem(item);

          return (
            <div
              key={item.id}
              className={`min-w-0 bg-white rounded-lg shadow-sm overflow-hidden border-2 transition-all ${
                isOwned
                  ? "border-[#27ae60]"
                  : canAfford
                    ? "border-gray-200 hover:border-[#155ca5]/40 hover:shadow-lg"
                    : "border-gray-200 opacity-75"
              }`}
            >
              {/* Item Header */}
              {isBackground ? (
                <div className="relative p-0 text-white">
                  <div
                    className="h-28 sm:h-40 lg:h-48 w-full bg-center bg-cover"
                    style={{
                      backgroundImage: item.imageUrl
                        ? `linear-gradient(rgba(16, 35, 63, 0.25), rgba(16, 35, 63, 0.5)), url(${item.imageUrl})`
                        : "linear-gradient(135deg, #155ca5, #005095)",
                    }}
                  />
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                    {isOwned ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#27ae60]" />
                    ) : (
                      getCategoryIcon(itemShopType)
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                    <h3 className="font-bold text-sm sm:text-lg lg:text-xl mb-0.5 sm:mb-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-white/85 truncate">
                      {itemShopType}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#155ca5] to-[#005095] p-3 sm:p-4 lg:p-6 text-white relative text-center">
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                    {isOwned ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#27ae60]" />
                    ) : (
                      getCategoryIcon(itemShopType)
                    )}
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 overflow-hidden border-2 border-white/45 mx-auto">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      getCategoryIcon(itemShopType)
                    )}
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg lg:text-xl mb-0.5 sm:mb-1 truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 truncate">
                    {itemShopType}
                  </p>
                </div>
              )}

              {/* Item Body */}
              <div className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 leading-snug max-h-10 sm:max-h-none overflow-hidden">
                  {item.description}
                </p>

                {/* Features */}
                {item.effect && (
                  <div className="bg-[#155ca5]/5 p-2 sm:p-3 rounded-md">
                    <p className="text-[11px] sm:text-sm font-bold text-[#155ca5]">
                      ⚡ {item.effect}
                    </p>
                  </div>
                )}

                {/* Duration */}
                {item.duration && (
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    {copy("Duration:", "Thời hạn:")} {item.duration}{" "}
                    {item.duration === 1
                      ? copy("day", "ngày")
                      : copy("days", "ngày")}
                  </p>
                )}

                {/* Price & Purchase */}
                <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Coins
                      className="w-4 h-4 sm:w-6 sm:h-6 text-[#f1c40f]"
                      fill="#f1c40f"
                    />
                    <span className="text-base sm:text-2xl font-black truncate">
                      {item.price.toLocaleString()}
                    </span>
                  </div>

                  {isOwned ? (
                    <span className="w-full text-center px-3 py-2 bg-[#27ae60]/10 text-[#27ae60] rounded-md font-bold text-xs sm:text-sm">
                      {copy("Owned", "Đã sở hữu")} ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || isPurchasing}
                      className={`w-full justify-center px-3 py-2 rounded-md font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 sm:gap-2 ${
                        canAfford
                          ? "bg-[#155ca5] text-white hover:bg-[#005095]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {copy("Purchasing...", "Đang mua...")}
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          {canAfford
                            ? copy("Buy Now", "Mua ngay")
                            : copy("Not Enough Coins", "Không đủ xu")}
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

      {sortedFilteredItems.length === 0 && (
        <div className="text-center py-10 sm:py-12 bg-white rounded-lg">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">
            {copy(
              "No items in this category",
              "Không có vật phẩm trong danh mục này",
            )}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => handlePageChange(pagination.prevPage ?? 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 rounded-md font-bold transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copy("Prev", "Trước")}
            </button>

            {pagination.pages.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-11 h-11 rounded-md font-bold transition-colors ${
                  page === pagination.current
                    ? "bg-[#155ca5] text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                handlePageChange(pagination.nextPage ?? totalPages)
              }
              disabled={!pagination.hasNext}
              className="px-4 py-2 rounded-md font-bold transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copy("Next", "Sau")}
            </button>
          </div>
        </section>
      )}

      {/* Earn More Coins Banner */}
      <section className="bg-gradient-to-r from-[#155ca5] to-[#005095] text-white rounded-lg p-5 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black mb-2">
              {copy("Need More Coins?", "Cần thêm xu?")}
            </h3>
            <p className="text-base sm:text-lg opacity-90">
              {copy(
                "Complete lessons, quests, and challenges to earn more coins!",
                "Hoàn thành bài học, nhiệm vụ và thử thách để kiếm thêm xu!",
              )}
            </p>
          </div>
          <Link
            to="/topup"
            className="w-full sm:w-auto text-center bg-white text-[#155ca5] px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {copy("Top Up Coins", "Nạp xu")} →
          </Link>
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
