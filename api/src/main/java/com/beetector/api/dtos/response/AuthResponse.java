package com.beetector.api.dtos.response;

public record AuthResponse(String accessToken, String tokenType, long expiresIn) {
}
