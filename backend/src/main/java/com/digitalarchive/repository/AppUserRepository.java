package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    long countByDeletedAtIsNull();

    /**
     * Synchronizes identity fields supplied by Keycloak while preserving
     * application-owned fields such as department, active status, and deletion.
     * PostgreSQL's upsert makes concurrent first requests from the same user safe.
     */
    @Modifying
    @Query(value = """
            INSERT INTO users (user_sub, username, full_name, email, is_active)
            VALUES (:userSub, :username, :fullName, :email, TRUE)
            ON CONFLICT (user_sub) DO UPDATE
            SET username = EXCLUDED.username,
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email
            WHERE users.username IS DISTINCT FROM EXCLUDED.username
               OR users.full_name IS DISTINCT FROM EXCLUDED.full_name
               OR users.email IS DISTINCT FROM EXCLUDED.email
            """, nativeQuery = true)
    void synchronizeIdentity(
            @Param("userSub") UUID userSub,
            @Param("username") String username,
            @Param("fullName") String fullName,
            @Param("email") String email);
}
