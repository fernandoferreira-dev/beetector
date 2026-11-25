package com.beetector.api.repositories;

import com.beetector.api.models.Users;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<Users, Long> {

    Boolean existsByUserId(int userId);
}
