package com.beetector.api.repositories;

import com.beetector.api.dtos.response.HiveResponse;
import com.beetector.api.models.Hives;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HiveRepository extends JpaRepository<Hives, Long> {

    List<HiveResponse> findByUserId(int userId);

    List<HiveResponse> findByUserIdAndFavoriteTrue(int userId);

}
