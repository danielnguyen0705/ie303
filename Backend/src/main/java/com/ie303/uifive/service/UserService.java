package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.ChangePasswordRequest;
import com.ie303.uifive.dto.req.UpdateUserProfileRequest;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.res.StudyingGradeResponse;
import com.ie303.uifive.dto.res.UserProfileResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.UserMapper;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    @Value("${user.default-avatar-base-url:https://api.dicebear.com/7.x/avataaars/svg?seed=}")
    private String defaultAvatarBaseUrl;

    @Value("${user.default-background-url:https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1600&q=80}")
    private String defaultBackgroundUrl;

    @Value("${notification.time-zone:Asia/Ho_Chi_Minh}")
    private String studyTimeZone;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendPublicBaseUrl;

    private final PasswordEncoder passwordEncoder;
    private final UserRepo repo;
    private final UserMapper mapper;
    private final EmailService emailService;
    private final UserLessonProgressRepo userLessonProgressRepo;

    public UserResponse create(UserRequest request) {
        if (repo.findByUsername(request.username()) != null) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (repo.findByEmail(request.email()) != null) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        User user = mapper.toEntity(request);

        applyDefaultCosmetics(user, request.username());
        user.setRole(Role.USER);

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setExpBoostMultiplier(1.0);
        user.setExpBoostExpiredAt(null);
        user.setStreakItemPendingCount(0);

        user.setVerified(false);
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(5));

        user = repo.save(user);

        UserResponse response = mapper.toResponse(user);

        String verifyLink = frontendPublicBaseUrl + "/verify-email?token="
                + user.getVerificationToken();

        emailService.sendVerificationEmail(user.getEmail(), verifyLink);
        return response;
    }

    public UserResponse getById(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        UserResponse response = mapper.toResponse(user);
        return response;
    }

    public User getByUsername(String username) {
        User user = repo.findByUsername(username);

        if(user == null){
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return user;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String username = authentication.getName();

        User user = repo.findByUsername(username);

        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return user;
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
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getUsername().equals(request.username())
                && repo.findByUsername(request.username()) != null) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (!user.getEmail().equals(request.email())
                && repo.findByEmail(request.email()) != null) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        mapper.updateEntityFromRequest(request, user);

        if (request.password() == null) {
            // giữ nguyên password cũ nếu request không gửi password
        }

        if (request.password() == null) {
            // không làm gì, tránh bị ghi đè nếu mapper set null
        } else {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        user = repo.save(user);

        UserResponse response = mapper.toResponse(user);
        return response;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        repo.deleteById(id);
    }

    public void updateStudyProgress(Long userId) {
        User user = repo.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        updateStreak(user);
        user.setCoin(user.getCoin() + 10);

        repo.save(user);
    }

    public void touchStudyStreak(Long userId) {
        User user = repo.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        updateStreak(user);
        repo.save(user);
    }

    private void updateStreak(User user) {
        LocalDate today = LocalDate.now(ZoneId.of(studyTimeZone));

        if (user.getLastStudyDate() == null) {
            user.setStreak(1);
            user.setLastStudyDate(today);
            return;
        }

        long dayGap = ChronoUnit.DAYS.between(user.getLastStudyDate(), today);
        if (dayGap <= 0) {
            return;
        }

        if (dayGap == 1) {
            user.setStreak(user.getStreak() + 1);
        } else {
            user.setStreak(1);
        }

        user.setLastStudyDate(today);
    }

    public void spendCoin(Long userId, int amount) {
        User user = repo.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getCoin() < amount) {
            throw new AppException(ErrorCode.INSUFFICIENT_COIN);
        }

        user.setCoin(user.getCoin() - amount);

        repo.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = this.repo.findByUsername(username);
        if (user == null) {
            user = this.repo.findByEmail(username);
        }
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        String authority = "ROLE_" + user.getRole().name();

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(authority))
        );
    }

    public User findByEmailOrNull(String email) {
        return repo.findByEmail(email);
    }

    public User findByEmail(String email) {
        User user = findByEmailOrNull(email);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    public User createOAuth2User(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(email);
        user.setPassword("");
        applyDefaultCosmetics(user, name != null && !name.isBlank() ? name : email);
        user.setRole(Role.USER);
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setExpBoostMultiplier(1.0);
        user.setExpBoostExpiredAt(null);
        user.setStreakItemPendingCount(0);
        user.setVerified(true);
        user.setVerificationToken(null);
        user.setVerificationExpiry(null);
        return repo.save(user);
    }

    public User findOrCreateOAuth2User(String email, String name) {
        User user = findByEmailOrNull(email);
        return user != null ? user : createOAuth2User(email, name);
    }

    private void applyDefaultCosmetics(User user, String seedSource) {
        String seed = (seedSource == null || seedSource.isBlank()) ? "user" : seedSource.trim();

        if (user.getAvatar() == null || user.getAvatar().isBlank()) {
            user.setAvatar(defaultAvatarBaseUrl + seed);
        }

        if (user.getBackground() == null || user.getBackground().isBlank()) {
            user.setBackground(defaultBackgroundUrl);
        }
    }

    public void changePassword(String username, ChangePasswordRequest request) {

        User user = repo.findByUsername(username);

        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_OLD_PASSWORD);
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.SAME_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));

        repo.save(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String username, UpdateUserProfileRequest request) {
        User user = repo.findByUsername(username);

        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        // Check username uniqueness (if changed)
        if (request.username() != null && !user.getUsername().equals(request.username())
                && repo.findByUsername(request.username()) != null) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // Check email uniqueness (if changed)
        if (request.email() != null && !user.getEmail().equals(request.email())
                && repo.findByEmail(request.email()) != null) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Update fields if provided
        if (request.username() != null && !request.username().isBlank()) {
            user.setUsername(request.username());
        }

        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email());
        }

        if (request.avatar() != null) {
            user.setAvatar(request.avatar());
        }

        if (request.background() != null) {
            user.setBackground(request.background());
        }

        User savedUser = repo.save(user);

        List<Grade> grades = userLessonProgressRepo.findDistinctGradesByUser(savedUser);

        List<StudyingGradeResponse> studyingGrades = grades.stream()
                .map(grade -> {
                    int totalLessons = userLessonProgressRepo.countTotalLessonsByGradeId(grade.getId());
                    int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndGrade(savedUser, grade.getId());

                    double progressPercent = totalLessons == 0
                            ? 0
                            : (completedLessons * 100.0 / totalLessons);

                    return new StudyingGradeResponse(grade.getId(), grade.getName(), progressPercent);
                })
                .toList();

            boolean isVip = savedUser.getVipExpiredAt() != null && savedUser.getVipExpiredAt().isAfter(LocalDateTime.now());

            return new UserProfileResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail(), savedUser.getAvatar(), savedUser.getRole(), savedUser.getCoin(), savedUser.getExp(), savedUser.getScore(), savedUser.getStreak(), savedUser.getLastStudyDate(), savedUser.getVipExpiredAt(), isVip, savedUser.getCreatedAt(), studyingGrades, savedUser.getStrongSkill(), savedUser.getWeakSkill(), savedUser.getTrendLabel());
    }

    public UserProfileResponse getMyProfile(String username) {
        User user = repo.findByUsername(username);
        user = reconcileStreakState(user);
        User finalUser = user;

        List<Grade> grades = userLessonProgressRepo.findDistinctGradesByUser(finalUser);

        List<StudyingGradeResponse> studyingGrades = grades.stream()
                .map(grade -> {
                    int totalLessons = userLessonProgressRepo.countTotalLessonsByGradeId(grade.getId());
                    int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndGrade(finalUser, grade.getId());

                    double progressPercent = totalLessons == 0
                            ? 0
                            : (completedLessons * 100.0 / totalLessons);

                    return new StudyingGradeResponse(grade.getId(), grade.getName(), progressPercent);
                })
                .toList();

            boolean isVip = finalUser.getVipExpiredAt() != null && finalUser.getVipExpiredAt().isAfter(LocalDateTime.now());

            return new UserProfileResponse(finalUser.getId(), finalUser.getUsername(), finalUser.getEmail(), finalUser.getAvatar(), finalUser.getRole(), finalUser.getCoin(), finalUser.getExp(), finalUser.getScore(), finalUser.getStreak(), finalUser.getLastStudyDate(), finalUser.getVipExpiredAt(), isVip, finalUser.getCreatedAt(), studyingGrades, finalUser.getStrongSkill(), finalUser.getWeakSkill(), finalUser.getTrendLabel());
    }

    private User reconcileStreakState(User user) {
        if (user == null || user.getLastStudyDate() == null) {
            return user;
        }

        LocalDate today = LocalDate.now(ZoneId.of(studyTimeZone));
        LocalDate lastCheckedDate = user.getStreakCheckedAt();

        if (lastCheckedDate != null && !lastCheckedDate.isBefore(today)) {
            return user;
        }

        if (!user.getLastStudyDate().isBefore(today)) {
            user.setStreakCheckedAt(today);
            return repo.save(user);
        }

        if (user.getStreak() > 0) {
            if (user.getStreakItemPendingCount() > 0) {
                user.setStreakItemPendingCount(user.getStreakItemPendingCount() - 1);
            } else {
                user.setStreak(0);
            }
        }

        user.setStreakCheckedAt(today);
        return repo.save(user);
    }
}
