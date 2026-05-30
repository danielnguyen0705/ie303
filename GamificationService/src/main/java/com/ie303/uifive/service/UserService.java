package com.ie303.uifive.service;

import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserRepo userRepo;

    @Transactional
    public User getCurrentUser() {
        User currentUser = getCurrentUserOrNull();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return currentUser;
    }

    public User getCurrentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String principalName = authentication == null ? null : resolvePrincipalName(authentication);

        if (authentication == null || principalName == null || principalName.isBlank()) {
            return null;
        }

        if ("anonymousUser".equalsIgnoreCase(principalName)
                || authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ANONYMOUS"::equals)) {
            return null;
        }

        return findOrCreatePrincipalUser(principalName);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = findOrCreatePrincipalUser(username);
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                "",
                authorities
        );
    }

    private User findOrCreatePrincipalUser(String principalName) {
        User user = findByPrincipalName(principalName);
        if (user != null) {
            return user;
        }

        return createOAuthUser(principalName);
    }

    private User findByPrincipalName(String principalName) {
        User user = userRepo.findByUsername(principalName);
        if (user == null) {
            user = userRepo.findByEmail(principalName);
        }
        return user;
    }

    private String resolvePrincipalName(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        return authentication.getName();    
    }

    private User createOAuthUser(String principalName) {
        User user = new User();
        user.setUsername(principalName);
        user.setEmail(principalName);
        user.setPassword("");
        user.setRole(Role.USER);
        user.setCoin(0);
        user.setExp(0);
        user.setScore(0);
        user.setStreak(0);
        user.setStreakItemPendingCount(0);
        user.setVerified(true);
        user.setExpBoostMultiplier(1.0);
        return userRepo.save(user);
    }
}
