package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserItemRequest;
import com.ie303.uifive.dto.res.UserItemResponse;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import com.ie303.uifive.mapper.UserItemMapper;
import com.ie303.uifive.repo.ShopItemRepo;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserItemService {

    private final UserItemRepo repo;
    private final UserRepo userRepo;
    private final ShopItemRepo itemRepo;
    private final UserItemMapper mapper;

    public UserItemResponse create(UserItemRequest request) {
        User user = userRepo.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + request.userId()));

        ShopItem item = itemRepo.findById(request.itemId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ShopItem với id = " + request.itemId()));

        int totalPrice = item.getPriceCoin() * request.quantity();
        if (user.getCoin() < totalPrice) {
            throw new RuntimeException("Không đủ coin");
        }

        user.setCoin(user.getCoin() - totalPrice);

        UserItem entity = mapper.toEntity(request);
        entity.setUser(user);
        entity.setItem(item);

        entity = repo.save(entity);

        UserItemResponse response = mapper.toResponse(entity);
        return response;
    }

    public UserItemResponse getById(Long id) {
        UserItem entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UserItem với id = " + id));

        UserItemResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UserItemResponse> getAll() {
        List<UserItem> entities = repo.findAll();

        List<UserItemResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy UserItem với id = " + id);
        }

        repo.deleteById(id);
    }
}