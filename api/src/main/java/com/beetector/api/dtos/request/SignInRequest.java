package com.beetector.api.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignInRequest(
        @Email @NotBlank String userEmail,
        @NotBlank @Size(min = 8) String userPassword
) {}
