package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.mapper.ShopItemMapper;
import com.ie303.uifive.mapper.UserItemMapper;
import com.ie303.uifive.repo.SkipUsageLogRepo;
import com.ie303.uifive.repo.ShopItemRepo;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopItemServiceTest {

    @Mock
    private ShopItemRepo repo;

    @Mock
    private UserItemRepo userItemRepo;

    @Mock
    private UserRepo userRepo;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SkipUsageLogRepo skipUsageLogRepo;

    @Mock
    private ShopItemMapper mapper;

    @Mock
    private UserItemMapper userItemMapper;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private ShopItemService shopItemService;

    @Test
    void create_ShouldAnnounceActiveShopItem() {
        ShopItemRequest request = new ShopItemRequest(
                "VIP 7 days",
                "Gia han VIP 7 ngay",
                150,
                "https://example.com/vip.png",
                null,
                ItemType.VIP,
                7,
                null,
                true
        );

        ShopItem entity = new ShopItem();
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setPrice(request.price());
        entity.setType(request.type());
        entity.setDurationDays(request.durationDays());
        ShopItemResponse response = new ShopItemResponse(
                1L,
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                request.imageUrl(),
                entity.getType(),
                entity.getDurationDays(),
                null,
                true
        );

        when(mapper.toEntity(request)).thenReturn(entity);
        when(repo.save(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(response);

        shopItemService.create(request);

        verify(notificationService).announceNewShopItem(entity);
    }

    @Test
    void useSkip_ShouldDecreaseQuantityAndCreateUsageLog() {
        User user = new User();
        user.setId(11L);
        user.setStreakItemPendingCount(0);

        ShopItem skipItem = new ShopItem();
        skipItem.setId(22L);
        skipItem.setType(ItemType.SKIP);

        com.ie303.uifive.entity.UserItem userItem = new com.ie303.uifive.entity.UserItem();
        userItem.setId(33L);
        userItem.setUser(user);
        userItem.setItem(skipItem);
        userItem.setQuantity(2);

        when(userService.getCurrentUser()).thenReturn(user);
        when(userItemRepo.findByIdAndUser(33L, user)).thenReturn(java.util.Optional.of(userItem));

        shopItemService.useSkip(33L);

        org.junit.jupiter.api.Assertions.assertEquals(1, userItem.getQuantity());
        org.junit.jupiter.api.Assertions.assertEquals(1, user.getStreakItemPendingCount());
        verify(userItemRepo).save(userItem);
        verify(userRepo).save(user);
        verify(skipUsageLogRepo).save(any());
    }
}
