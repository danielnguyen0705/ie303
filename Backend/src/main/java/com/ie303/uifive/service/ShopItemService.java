package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.ShopItemRequest;
import com.ie303.uifive.dto.res.ShopItemResponse;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.mapper.ShopItemMapper;
import com.ie303.uifive.repo.ShopItemRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopItemService {

    private final ShopItemRepo repo;
    private final ShopItemMapper mapper;

    public ShopItemResponse create(ShopItemRequest request) {
        ShopItem entity = mapper.toEntity(request);

        entity = repo.save(entity);

        ShopItemResponse response = mapper.toResponse(entity);
        return response;
    }

    public ShopItemResponse getById(Long id) {
        ShopItem entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ShopItem với id = " + id));

        ShopItemResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<ShopItemResponse> getAll() {
        List<ShopItem> entities = repo.findAll();

        List<ShopItemResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public ShopItemResponse update(Long id, ShopItemRequest request) {
        ShopItem entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ShopItem với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        entity = repo.save(entity);

        ShopItemResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy ShopItem với id = " + id);
        }

        repo.deleteById(id);
    }
}