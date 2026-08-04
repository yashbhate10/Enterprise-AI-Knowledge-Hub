package com.enterpriseai.knowledgehub.controller;

import com.enterpriseai.knowledgehub.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final RoleRepository roleRepository;

    @GetMapping("/health")
    public Map<String, Object> health() {
        long roleCount = roleRepository.count();

        return Map.of(
                "status", "UP",
                "database", "connected",
                "rolesFound", roleCount
        );
    }
}