package com.beetector.api.repositories;

import com.beetector.api.Models.Hives;
import com.beetector.api.Models.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<Users, Long> {

    Boolean existsByUserId(int userId);

}
