package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.ChangePasswordRequest;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

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

        user.setRole(Role.USER);

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setExpBoostMultiplier(1.0);
        user.setExpBoostExpiredAt(null);

        user.setVerified(false);
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(5));

        user = repo.save(user);

        UserResponse response = mapper.toResponse(user);

        String verifyLink = "http://localhost:8080/api/auth/verify-email?token="
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
        LocalDate today = LocalDate.now();

        if (user.getLastStudyDate() == null) {
            user.setStreak(1);
        } else if (user.getLastStudyDate().plusDays(1).equals(today)) {
            user.setStreak(user.getStreak() + 1);
        } else if (!user.getLastStudyDate().equals(today)) {
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
        user.setRole(Role.USER);
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setExpBoostMultiplier(1.0);
        user.setExpBoostExpiredAt(null);
        user.setVerified(true);
        user.setVerificationToken(null);
        user.setVerificationExpiry(null);
        return repo.save(user);
    }

    public User findOrCreateOAuth2User(String email, String name) {
        User user = findByEmailOrNull(email);
        return user != null ? user : createOAuth2User(email, name);
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
    public UserProfileResponse getMyProfile(String username) {
        User user = repo.findByUsername(username);

        List<Grade> grades = userLessonProgressRepo.findDistinctGradesByUser(user);

        List<StudyingGradeResponse> studyingGrades = grades.stream()
                .map(grade -> {
                    int totalLessons = userLessonProgressRepo.countTotalLessonsByGradeId(grade.getId());
                    int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndGrade(user, grade.getId());

                    double progressPercent = totalLessons == 0
                            ? 0
                            : (completedLessons * 100.0 / totalLessons);

                    return new StudyingGradeResponse(grade.getId(), grade.getName(), progressPercent);
                })
                .toList();

        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getCoin(), user.getExp(), user.getScore(), user.getStreak(), user.getLastStudyDate(), user.getVipExpiredAt(), user.getCreatedAt(), studyingGrades);
    }
}
