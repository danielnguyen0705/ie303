package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserUnitProgressRequest;
import com.ie303.uifive.dto.res.UserUnitProgressResponse;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserUnitProgress;
import com.ie303.uifive.mapper.UserUnitProgressMapper;
import com.ie303.uifive.repo.UnitRepo;
import com.ie303.uifive.repo.UserRepo;
import com.ie303.uifive.repo.UserUnitProgressRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserUnitProgressService {

    private final UserUnitProgressRepo repo;
    private final UserRepo userRepo;
    private final UnitRepo unitRepo;
    private final UserUnitProgressMapper mapper;

    public UserUnitProgressResponse updateProgress(UserUnitProgressRequest request) {
        User user = userRepo.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + request.userId()));

        Unit unit = unitRepo.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + request.unitId()));

        UserUnitProgress progress = repo.findByUserIdAndUnitId(request.userId(), request.unitId())
                .orElseGet(() -> {
                    UserUnitProgress entity = mapper.toEntity(request);
                    entity.setUser(user);
                    entity.setUnit(unit);
                    return entity;
                });

        mapper.updateEntityFromRequest(request, progress);
        progress.setUser(user);
        progress.setUnit(unit);

        if (request.progressPercent() >= 100) {
            progress.setCompleted(true);
        } else {
            progress.setCompleted(request.completed());
        }

        progress = repo.save(progress);

        UserUnitProgressResponse response = mapper.toResponse(progress);
        return response;
    }

    public UserUnitProgressResponse unlockUnit(Long userId, Long unitId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + userId));

        Unit unit = unitRepo.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Unit với id = " + unitId));

        UserUnitProgress progress = repo.findByUserIdAndUnitId(userId, unitId)
                .orElseGet(UserUnitProgress::new);

        progress.setUser(user);
        progress.setUnit(unit);

        progress = repo.save(progress);

        UserUnitProgressResponse response = mapper.toResponse(progress);
        return response;
    }

    public UserUnitProgressResponse getById(Long id) {
        UserUnitProgress entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UserUnitProgress với id = " + id));

        UserUnitProgressResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UserUnitProgressResponse> getAll() {
        List<UserUnitProgress> entities = repo.findAll();

        List<UserUnitProgressResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy UserUnitProgress với id = " + id);
        }

        repo.deleteById(id);
    }
}