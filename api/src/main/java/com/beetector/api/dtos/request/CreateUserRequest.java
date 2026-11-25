package com.beetector.api.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Date;

public record CreateUserRequest(
        @NotBlank String userName,
        @Email @NotBlank String userEmail,
        @Size(min = 8 ) String userPassword,
        Date userCreatedAt
) {}
