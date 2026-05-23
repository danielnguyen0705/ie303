package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.BuyItemResponse;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.dto.res.UserItemResponse;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.SkipUsageLog;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.ShopItemRepo;
import com.ie303.uifive.repo.SkipUsageLogRepo;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Transactional
@Slf4j
@Service
public class ShopItemService {

    private final ShopItemRepo repo;
    private final UserItemRepo userItemRepo;
    private final UserRepo userRepo;
    private final UserService userService;
    private final NotificationClient notificationClient;
    private final SkipUsageLogRepo skipUsageLogRepo;
    private final CloudinaryService cloudinaryService;

    public ShopItemResponse create(ShopItemRequest request) {
        validateShopItemRequest(request);

        ShopItem entity = new ShopItem();
        entity.setName(request.name().trim());
        entity.setDescription(request.description());
        entity.setPrice(request.price());
        entity.setType(request.type());
        entity.setDurationDays(request.durationDays());
        entity.setExpMultiplier(request.expMultiplier());
        entity.setImageUrl(resolveImageUrl(request, null));
        entity.setActive(request.active() == null || request.active());
        normalizeByType(entity);

        entity = repo.save(entity);
        try {
            notificationClient.announceNewShopItem(entity.getId());
        } catch (Exception ex) {
            log.warn("Failed to notify notification-service for shop item {}: {}", entity.getId(), ex.getMessage());
        }

        return toResponse(entity);
    }

    public ShopItemResponse getById(Long id) {
        return toResponse(findItem(id));
    }

    public List<ShopItemResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public List<ShopItemResponse> getAllActive() {
        return repo.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public ShopItemResponse update(Long id, ShopItemRequest request) {
        validateShopItemRequest(request);

        ShopItem entity = findItem(id);
        entity.setName(request.name().trim());
        entity.setDescription(request.description());
        entity.setPrice(request.price());
        entity.setType(request.type());
        entity.setDurationDays(request.durationDays());
        entity.setExpMultiplier(request.expMultiplier());
        entity.setImageUrl(resolveImageUrl(request, entity.getImageUrl()));
        if (request.active() != null) {
            entity.setActive(request.active());
        }
        normalizeByType(entity);

        entity = repo.save(entity);
        return toResponse(entity);
    }

    public void delete(Long id) {
        ShopItem entity = findItem(id);
        entity.setActive(false);
        repo.save(entity);
    }

    public List<UserItemResponse> getMyItems() {
        User user = userService.getCurrentUser();
        return userItemRepo.findByUser(user).stream().map(this::toResponse).toList();
    }

    public BuyItemResponse buyItem(Long itemId) {
        User user = userService.getCurrentUser();
        ShopItem item = findItem(itemId);

        if (!item.isActive()) {
            throw new AppException(ErrorCode.ITEM_NOT_AVAILABLE);
        }

        if (user.getCoin() < item.getPrice()) {
            throw new AppException(ErrorCode.INSUFFICIENT_COIN);
        }

        user.setCoin(user.getCoin() - item.getPrice());

        switch (item.getType()) {
            case VIP -> handleVipPurchase(user, item);
            case EXP -> handleExpBoostPurchase(user, item);
            case SKIP -> handleSkipPurchase(user, item);
            case AVATAR, BACKGROUND -> handlePermanentItemPurchase(user, item);
            default -> throw new AppException(ErrorCode.INVALID_ITEM_TYPE);
        }

        userRepo.save(user);
        return new BuyItemResponse("Mua vật phẩm thành công", user.getCoin());
    }

    public String useSkip(Long userItemId) {
        User user = userService.getCurrentUser();

        UserItem userItem = userItemRepo.findByIdAndUser(userItemId, user)
                .orElseThrow(() -> new AppException(ErrorCode.USER_ITEM_NOT_FOUND));

        if (userItem.getItem().getType() != ItemType.SKIP) {
            throw new AppException(ErrorCode.INVALID_ITEM_TYPE, "Item is not a SKIP item");
        }

        if (userItem.getQuantity() <= 0) {
            throw new AppException(ErrorCode.ITEM_NOT_AVAILABLE, "No SKIP item left to use");
        }

        userItem.setQuantity(userItem.getQuantity() - 1);
        user.setStreakItemPendingCount(user.getStreakItemPendingCount() + 1);

        userItemRepo.save(userItem);
        userRepo.save(user);

        SkipUsageLog usageLog = new SkipUsageLog();
        usageLog.setUser(user);
        usageLog.setUserItem(userItem);
        skipUsageLogRepo.save(usageLog);

        return "Dùng SKIP thành công. Vật phẩm này sẽ bảo vệ 1 ngày streak bị bỏ lỡ";
    }

    public String equipAvatar(Long shopItemId) {
        return equipItem(shopItemId, ItemType.AVATAR);
    }

    public String equipBackground(Long shopItemId) {
        return equipItem(shopItemId, ItemType.BACKGROUND);
    }

    private ShopItem findItem(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_ITEM_NOT_FOUND));
    }

    private void validateShopItemRequest(ShopItemRequest request) {
        if (request.type() == null) {
            throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "Item type must not be null");
        }

        if (request.price() < 0) {
            throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "Item price must be greater than or equal to 0");
        }

        if (request.type() == ItemType.VIP) {
            if (request.durationDays() == null || request.durationDays() <= 0) {
                throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "VIP item must have durationDays greater than 0");
            }
        }

        if (request.type() == ItemType.EXP) {
            if (request.durationDays() == null || request.durationDays() <= 0) {
                throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "EXP item must have durationDays greater than 0");
            }

            if (request.expMultiplier() == null || request.expMultiplier() <= 1.0) {
                throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "EXP item must have expMultiplier > 1.0");
            }
        }
    }

    private String resolveImageUrl(ShopItemRequest request, String currentImageUrl) {
        MultipartFile imageFile = request.imageFile();
        if (imageFile != null && !imageFile.isEmpty()) {
            return cloudinaryService.uploadFile(imageFile, "learning-app/shop-items");
        }

        if (request.imageUrl() != null && !request.imageUrl().isBlank()) {
            return request.imageUrl().trim();
        }

        return currentImageUrl;
    }

    private void normalizeByType(ShopItem entity) {
        if (entity.getType() != ItemType.VIP && entity.getType() != ItemType.EXP) {
            entity.setDurationDays(null);
        }

        if (entity.getType() != ItemType.EXP) {
            entity.setExpMultiplier(null);
        }
    }

    private void handleVipPurchase(User user, ShopItem item) {
        if (item.getDurationDays() == null || item.getDurationDays() <= 0) {
            throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "VIP item durationDays is invalid");
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getVipExpiredAt() == null || user.getVipExpiredAt().isBefore(now)) {
            user.setVipExpiredAt(now.plusDays(item.getDurationDays()));
        } else {
            user.setVipExpiredAt(user.getVipExpiredAt().plusDays(item.getDurationDays()));
        }
    }

    private void handleExpBoostPurchase(User user, ShopItem item) {
        if (item.getDurationDays() == null || item.getDurationDays() <= 0) {
            throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "EXP item durationDays is invalid");
        }

        if (item.getExpMultiplier() == null || item.getExpMultiplier() <= 1.0) {
            throw new AppException(ErrorCode.INVALID_SHOP_ITEM_REQUEST, "EXP item multiplier is invalid");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentExpiry = user.getExpBoostExpiredAt();

        if (currentExpiry == null || currentExpiry.isBefore(now)) {
            user.setExpBoostMultiplier(item.getExpMultiplier());
            user.setExpBoostExpiredAt(now.plusDays(item.getDurationDays()));
            return;
        }

        user.setExpBoostMultiplier(Math.max(user.getExpBoostMultiplier(), item.getExpMultiplier()));
        user.setExpBoostExpiredAt(currentExpiry.plusDays(item.getDurationDays()));
    }

    private void handleSkipPurchase(User user, ShopItem item) {
        UserItem userItem = userItemRepo.findByUserAndItem(user, item)
                .orElseGet(() -> {
                    UserItem newItem = new UserItem();
                    newItem.setUser(user);
                    newItem.setItem(item);
                    newItem.setQuantity(0);
                    newItem.setEquipped(false);
                    return newItem;
                });

        userItem.setQuantity(userItem.getQuantity() + 1);
        userItemRepo.save(userItem);
    }

    private void handlePermanentItemPurchase(User user, ShopItem item) {
        boolean alreadyOwned = userItemRepo.findByUserAndItem(user, item).isPresent();
        if (alreadyOwned) {
            throw new AppException(ErrorCode.ITEM_ALREADY_OWNED);
        }

        UserItem userItem = new UserItem();
        userItem.setUser(user);
        userItem.setItem(item);
        userItem.setQuantity(1);
        userItem.setEquipped(false);
        userItemRepo.save(userItem);
    }

    private String equipItem(Long shopItemId, ItemType type) {
        User user = userService.getCurrentUser();
        ShopItem item = findItem(shopItemId);

        if (item.getType() != type) {
            throw new AppException(ErrorCode.INVALID_ITEM_TYPE);
        }

        UserItem ownedItem = userItemRepo.findByUserAndItem(user, item)
                .orElseThrow(() -> new AppException(ErrorCode.ITEM_NOT_OWNED));

        List<UserItem> sameTypeItems = userItemRepo.findByUserAndItem_Type(user, type);
        for (UserItem ui : sameTypeItems) {
            ui.setEquipped(false);
        }
        ownedItem.setEquipped(true);

        if (type == ItemType.AVATAR) {
            user.setAvatar(item.getImageUrl());
        } else if (type == ItemType.BACKGROUND) {
            user.setBackground(item.getImageUrl());
        }

        userItemRepo.saveAll(sameTypeItems);
        userRepo.save(user);
        return "Trang bị vật phẩm thành công";
    }

    private ShopItemResponse toResponse(ShopItem entity) {
        return new ShopItemResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getImageUrl(),
                entity.getType(),
                entity.getDurationDays(),
                entity.getExpMultiplier(),
                entity.isActive()
        );
    }

    private UserItemResponse toResponse(UserItem entity) {
        return new UserItemResponse(
                entity.getId(),
                entity.getItem().getId(),
                entity.getItem().getName(),
                entity.getItem().getImageUrl(),
                entity.getItem().getType(),
                entity.getQuantity(),
                entity.isEquipped(),
                entity.getPurchasedAt()
        );
    }
}
