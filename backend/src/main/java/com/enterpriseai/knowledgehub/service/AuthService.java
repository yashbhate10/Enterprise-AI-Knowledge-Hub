package com.enterpriseai.knowledgehub.service;

import com.enterpriseai.knowledgehub.dto.AuthResponse;
import com.enterpriseai.knowledgehub.dto.LoginRequest;
import com.enterpriseai.knowledgehub.dto.RegisterRequest;
import com.enterpriseai.knowledgehub.entity.Role;
import com.enterpriseai.knowledgehub.entity.User;
import com.enterpriseai.knowledgehub.repository.RoleRepository;
import com.enterpriseai.knowledgehub.repository.UserRepository;
import com.enterpriseai.knowledgehub.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    private static final String DEFAULT_ROLE = "EMPLOYEE"; // matches your seeded roles

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new IllegalStateException(
                        "Default role '" + DEFAULT_ROLE + "' not found. Check your seed data."));

        Set<Role> roles = new HashSet<>();
        roles.add(defaultRole);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .roles(roles)
                .build();

        User saved = userRepository.save(user);

        UserDetails userDetails = toUserDetails(saved);
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(saved, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User authenticated but not found in database"));

        UserDetails userDetails = toUserDetails(user);
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(user.getRoles().stream()
                        .map(r -> "ROLE_" + r.getName())
                        .toArray(String[]::new))
                .build();
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        return AuthResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(roleNames)
                .token(token)
                .tokenType("Bearer")
                .build();
    }
}
