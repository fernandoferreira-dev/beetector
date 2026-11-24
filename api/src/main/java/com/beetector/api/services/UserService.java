package com.beetector.api.services;

import com.beetector.api.dtos.response.UserResponse;
import com.beetector.api.exceptions.UserNotFoundException;
import com.beetector.api.models.Hives;
import com.beetector.api.models.Users;
import com.beetector.api.repositories.HiveRepository;
import com.beetector.api.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }
}