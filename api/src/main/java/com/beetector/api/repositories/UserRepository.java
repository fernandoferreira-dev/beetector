package com.beetector.api.repositories;

import com.beetector.api.models.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;

public interface UserRepository extends JpaRepository<Users, Long> {

    Boolean existsByUserId(int userId);

    UserDetails findByUserEmail(String userEmail);
}
