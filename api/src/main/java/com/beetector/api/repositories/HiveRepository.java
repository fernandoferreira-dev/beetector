package com.beetector.api.repositories;

import com.beetector.api.Models.Hives;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HiveRepository extends JpaRepository<Hives, Long> {

    List<Hives> findByUserId(int userId);

    List<Hives> findByUserIdAndFavoriteTrue(int userId);

}
