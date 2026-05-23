package com.ie303.uifive.service;

import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserRepo userRepo;

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getName();

        if (username == null || username.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return user;
    }

    public void touchStudyStreak(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        updateStreak(user);
        userRepo.save(user);
    }

    public boolean hasVipAccess(User user) {
        return user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(LocalDateTime.now());
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found");
        }

        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                "",
                authorities
        );
    }

    private void updateStreak(User user) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

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
}
