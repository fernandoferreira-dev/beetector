package com.beetector.api.services;

import com.beetector.api.Models.Hives;
import com.beetector.api.exceptions.UserNotFoundException;
import com.beetector.api.repositories.HiveRepository;
import com.beetector.api.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HiveService {

    private final HiveRepository hiveRepository;
    private final UserRepository userRepository;

    public HiveService(HiveRepository hiveRepository, UserRepository userRepository) {
        this.hiveRepository = hiveRepository;
        this.userRepository = userRepository;
    }

    public List<Hives> getUserHives (Integer userId) {

        if (!userRepository.existsByUserId(userId)){
            throw  new UserNotFoundException(String.valueOf(userId));
        }

        return hiveRepository.findByUserId(userId);
    }

    public List<Hives> getUserFavoritedHives (Integer userId) {
        if (!userRepository.existsByUserId(userId)){
            throw  new UserNotFoundException(String.valueOf(userId));
        }

        return hiveRepository.findByUserIdAndFavoriteTrue(userId);
    }
}
