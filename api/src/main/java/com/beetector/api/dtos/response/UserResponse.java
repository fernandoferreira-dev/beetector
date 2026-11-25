package com.beetector.api.dtos.response;

import com.beetector.api.models.Users;

import java.util.Date;


public record UserResponse(
        String userName,
        String userEmail,
        Date userCreatedAt
) {
    public static UserResponse fromEntity(Users users){
        return new UserResponse(
                users.getUserName(),
                users.getUserEmail(),
                users.getUserCreatedAt()
        );
    }
}
