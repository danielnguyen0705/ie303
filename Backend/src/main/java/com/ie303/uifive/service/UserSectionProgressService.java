package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserSectionProgressRequest;
import com.ie303.uifive.dto.res.UserSectionProgressResponse;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserSectionProgress;
import com.ie303.uifive.mapper.UserSectionProgressMapper;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.UserRepo;
import com.ie303.uifive.repo.UserSectionProgressRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserSectionProgressService {

    private final UserSectionProgressRepo repo;
    private final UserRepo userRepo;
    private final SectionRepo sectionRepo;
    private final UserSectionProgressMapper mapper;

    public UserSectionProgressResponse updateProgress(UserSectionProgressRequest request) {
        User user = userRepo.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với id = " + request.userId()));

        Section section = sectionRepo.findById(request.sectionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Section với id = " + request.sectionId()));

        UserSectionProgress progress = repo.findByUserIdAndSectionId(request.userId(), request.sectionId())
                .orElseGet(() -> {
                    UserSectionProgress entity = mapper.toEntity(request);
                    entity.setUser(user);
                    entity.setSection(section);
                    return entity;
                });

        mapper.updateEntityFromRequest(request, progress);
        progress.setUser(user);
        progress.setSection(section);

        if (request.progressPercent() >= 80) {
            progress.setCompleted(true);
        } else {
            progress.setCompleted(request.completed());
        }

        progress = repo.save(progress);

        UserSectionProgressResponse response = mapper.toResponse(progress);
        return response;
    }

    public UserSectionProgressResponse getById(Long id) {
        UserSectionProgress entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UserSectionProgress với id = " + id));

        UserSectionProgressResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UserSectionProgressResponse> getAll() {
        List<UserSectionProgress> entities = repo.findAll();

        List<UserSectionProgressResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy UserSectionProgress với id = " + id);
        }

        repo.deleteById(id);
    }
}