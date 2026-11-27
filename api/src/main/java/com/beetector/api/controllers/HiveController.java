package com.beetector.api.controllers;

import com.beetector.api.dtos.response.HiveResponse;
import com.beetector.api.config.ApiController;
import com.beetector.api.services.HiveService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/hives")
public class HiveController implements ApiController {

    private final HiveService hiveService;
    public HiveController(HiveService hiveService) {
        this.hiveService = hiveService;
    }

    @GetMapping
    public List<HiveResponse> getUserHives(@PathVariable("userId") int userId) {
        return hiveService.getUserHives(userId);
    }

    @GetMapping("/favourites")
    public List<HiveResponse> getUserFavorited(@PathVariable("userId") int userId) {
        return hiveService.getUserFavoritedHives(userId);
    }
}
