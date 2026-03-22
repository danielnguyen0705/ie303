package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.mapper.UserMapper;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepo repo;
    private final UserMapper mapper;

    public UserResponse create(UserRequest request) {
        if (repo.findByUsername(request.username()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }

        if (repo.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = mapper.toEntity(request);

        if (request.role() == null) {
            user.setRole(Role.USER);
        }

        user.setCoin(0);
        user.setScore(0);
        user.setStreak(0);

        user = repo.save(user);

        UserResponse response = mapper.toResponse(user);
        return response;
    }

    public UserResponse getById(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + id));

        UserResponse response = mapper.toResponse(user);
        return response;
    }

    public List<UserResponse> getAll() {
        List<User> users = repo.findAll();

        List<UserResponse> responses = users.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public UserResponse update(Long id, UserRequest request) {
        User user = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + id));

        if (!user.getUsername().equals(request.username())
                && repo.findByUsername(request.username()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }

        if (!user.getEmail().equals(request.email())
                && repo.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        mapper.updateEntityFromRequest(request, user);

        if (request.password() == null) {
            // giữ nguyên password cũ nếu request không gửi password
        }

        if (request.password() == null) {
            // không làm gì, tránh bị ghi đè nếu mapper set null
        } else {
            user.setPassword(request.password());
        }

        if (request.role() == null) {
            // giữ nguyên role cũ
        } else {
            user.setRole(request.role());
        }

        user = repo.save(user);

        UserResponse response = mapper.toResponse(user);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy User với id = " + id);
        }

        repo.deleteById(id);
    }

    public void updateStudyProgress(Long userId) {
        User user = repo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + userId));

        LocalDate today = LocalDate.now();

        if (user.getLastStudyDate() == null) {
            user.setStreak(1);
        } else if (user.getLastStudyDate().plusDays(1).equals(today)) {
            user.setStreak(user.getStreak() + 1);
        } else if (!user.getLastStudyDate().equals(today)) {
            user.setStreak(1);
        }

        user.setLastStudyDate(today);
        user.setCoin(user.getCoin() + 10);

        repo.save(user);
    }

    public void spendCoin(Long userId, int amount) {
        User user = repo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + userId));

        if (user.getCoin() < amount) {
            throw new RuntimeException("Không đủ coin");
        }

        user.setCoin(user.getCoin() - amount);

        repo.save(user);
    }
}