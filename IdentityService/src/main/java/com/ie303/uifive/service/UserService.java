package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.ChangePasswordRequest;
import com.ie303.uifive.dto.req.UpdateUserProfileRequest;
import com.ie303.uifive.dto.req.UserRequest;
import com.ie303.uifive.dto.req.VerificationEmailRequest;
import com.ie303.uifive.dto.res.AILearningAnalysisResponse;
import com.ie303.uifive.dto.res.StudyingGradeResponse;
import com.ie303.uifive.dto.res.UserProfileResponse;
import com.ie303.uifive.dto.res.UserResponse;
import com.ie303.uifive.messaging.RabbitMessagingConfig;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import feign.FeignException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserDetailsService {

    @Value("${user.default-avatar-base-url:https://api.dicebear.com/7.x/avataaars/svg?seed=}")
    private String defaultAvatarBaseUrl;

    @Value("${user.default-background-url:https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1600&q=80}")
    private String defaultBackgroundUrl;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendPublicBaseUrl;

    private final PasswordEncoder passwordEncoder;
    private final UserRepo repo;
    private final RabbitTemplate rabbitTemplate;
    private final NotificationClient notificationClient;
    private final ProgressClient progressClient;

    public UserResponse create(UserRequest request) {
        if (repo.findByUsername(request.username()) != null) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (repo.findByEmail(request.email()) != null) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setAvatar(defaultAvatarBaseUrl);
        user.setBackground(defaultBackgroundUrl);
        user.setRole(Role.USER);
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setVerified(false);
        normalizeDefaultLearningFields(user);
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(5));

        String verifyLink = frontendPublicBaseUrl + "/verify-email?token=" + user.getVerificationToken();
        user = repo.save(user);
        sendVerificationEmail(user.getEmail(), verifyLink);
        return toUserResponse(user);
    }

    public User findByEmailOrNull(String email) {
        return repo.findByEmail(email);
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String principalName = resolvePrincipalName(authentication);
        return findOrCreatePrincipalUser(principalName);
    }

    public User createOAuth2User(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(email);
        user.setPassword("");
        user.setAvatar(defaultAvatarBaseUrl);
        user.setBackground(defaultBackgroundUrl);
        user.setRole(Role.USER);
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setVerified(true);
        normalizeDefaultLearningFields(user);
        return repo.save(user);
    }

    public User findOrCreateOAuth2User(String email, String name) {
        User user = findByPrincipalName(email);
        if (user == null) {
            return createOAuth2User(email, name);
        }

        boolean updated = false;
        if (user.getRole() == null) {
            user.setRole(Role.USER);
            updated = true;
        }

        if (normalizeDefaultLearningFields(user)) {
            updated = true;
        }

        if (updated) {
            user = repo.save(user);
        }

        return user;
    }

    public UserResponse getById(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toUserResponse(user);
    }

    public List<UserResponse> getAll() {
        return repo.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public UserResponse update(Long id, UserRequest request) {
        User user = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getUsername().equals(request.username()) && repo.findByUsername(request.username()) != null) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (!user.getEmail().equals(request.email()) && repo.findByEmail(request.email()) != null) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        user.setUsername(request.username());
        user.setEmail(request.email());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        return toUserResponse(repo.save(user));
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        repo.deleteById(id);
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

    public UserProfileResponse updateProfile(String username, UpdateUserProfileRequest request) {
        User user = repo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        if (request.username() != null
                && !request.username().isBlank()
                && !user.getUsername().equals(request.username())
                && repo.findByUsername(request.username()) != null) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (request.email() != null
                && !request.email().isBlank()
                && !user.getEmail().equals(request.email())
                && repo.findByEmail(request.email()) != null) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

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
        return buildProfileResponse(savedUser);
    }

    public UserProfileResponse getMyProfile(String username) {
        User user = findOrCreatePrincipalUser(username);
        return buildProfileResponse(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = repo.findByUsername(username);
        if (user == null) {
            user = repo.findByEmail(username);
        }
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        Role role = user.getRole() == null ? Role.USER : user.getRole();
        String authority = "ROLE_" + role.name();
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword() == null ? "" : user.getPassword(),
                List.of(new SimpleGrantedAuthority(authority))
        );
    }

    private User findByPrincipalName(String principalName) {
        User user = repo.findByUsername(principalName);
        if (user == null) {
            user = repo.findByEmail(principalName);
        }
        return user;
    }

    private User findOrCreatePrincipalUser(String principalName) {
        User user = findByPrincipalName(principalName);
        if (user == null) {
            user = createOAuth2User(principalName, principalName);
        }

        return user;
    }

    private String resolvePrincipalName(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        if (principal instanceof OAuth2User oAuth2User) {
            String email = oAuth2User.getAttribute("email");
            if (email != null && !email.isBlank()) {
                return email;
            }

            String name = oAuth2User.getAttribute("name");
            if (name != null && !name.isBlank()) {
                return name;
            }
        }

        if (principal instanceof Jwt jwt) {
            String subject = jwt.getSubject();
            if (subject != null && !subject.isBlank()) {
                return subject;
            }
        }

        return authentication.getName();
    }

    private boolean normalizeDefaultLearningFields(User user) {
        boolean updated = false;

        if (user.getExpBoostMultiplier() == null) {
            user.setExpBoostMultiplier(1.0);
            updated = true;
        }

        if (user.getStreakItemPendingCount() == null) {
            user.setStreakItemPendingCount(0);
            updated = true;
        }

        return updated;
    }

    private void sendVerificationEmail(String toEmail, String verifyLink) {
        VerificationEmailRequest request = new VerificationEmailRequest(toEmail, verifyLink);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMessagingConfig.EXCHANGE,
                    RabbitMessagingConfig.VERIFICATION_EMAIL_ROUTING_KEY,
                    request
            );
            log.info("Published verification email event to RabbitMQ for {}", toEmail);
        } catch (Exception rabbitException) {
            log.warn("Failed to publish verification email event for {} via RabbitMQ. Exception type={}, message={}, cause={}",
                    toEmail,
                    rabbitException.getClass().getName(),
                    rabbitException.getMessage(),
                    rabbitException.getCause() == null ? "null" : rabbitException.getCause().toString(),
                    rabbitException);
            try {
                notificationClient.sendVerificationEmail(request);
                log.info("Published verification email event via fallback HTTP for {}", toEmail);
            } catch (Exception fallbackException) {
                log.error("Failed to send verification email for {} via fallback HTTP: {}",
                        toEmail, fallbackException.getMessage(), fallbackException);
            }
        }
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCoin(),
                user.getExp(),
                user.getScore(),
                user.getStreak(),
                user.getLastStudyDate(),
                user.getVipExpiredAt(),
                user.getCreatedAt()
        );
    }

    private UserProfileResponse buildProfileResponse(User user) {
        List<StudyingGradeResponse> studyingGrades = fetchStudyingGrades(user.getUsername());
        AILearningAnalysisResponse analysis = fetchLatestAnalysis(user.getUsername());

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getAvatar(),
                user.getRole(),
                user.getCoin(),
                user.getExp(),
                user.getScore(),
                user.getStreak(),
                user.getLastStudyDate(),
                user.getVipExpiredAt(),
                user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(LocalDateTime.now()),
                user.getCreatedAt(),
                studyingGrades,
                analysis == null ? null : analysis.strongSkill(),
                analysis == null ? null : analysis.weakSkill(),
                analysis == null ? null : analysis.trendLabel()
        );
    }

    private List<StudyingGradeResponse> fetchStudyingGrades(String username) {
        try {
            List<StudyingGradeResponse> response = progressClient.getStudyingGrades(username);
            return response == null ? Collections.emptyList() : response;
        } catch (FeignException ex) {
            return Collections.emptyList();
        }
    }

    private AILearningAnalysisResponse fetchLatestAnalysis(String username) {
        try {
            return progressClient.getLatestLearningAnalysis(username);
        } catch (FeignException ex) {
            return null;
        }
    }
}
