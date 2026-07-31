package com.digitalarchive.service;

import com.digitalarchive.dto.AppUserResponse;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppUserService {

    private final AppUserRepository appUserRepository;
    private final ApiResponseMapper responseMapper;

    public Optional<AppUserResponse> getActive(UUID userSub) {
        return appUserRepository.findById(userSub)
                .filter(user -> user.getDeletedAt() == null)
                .map(responseMapper::toUserResponse);
    }
}
