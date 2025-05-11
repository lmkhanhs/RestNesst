package com.pbl5cnpm.airbnb_service.repository.Custom;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.ListingEntity;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

@Repository
public class ListingsRepositoryCustomImpl implements ListingsRepositoryCustom {
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ListingEntity> findAllAndStatus(String status, boolean deleted, boolean access, LocalDate now) {
        StringBuilder sql = new StringBuilder(
                "SELECT * FROM listings WHERE status = :status AND deleted = :deleted AND access = :access");
        sql.append(" AND start_date <= :now AND end_date >= :now");

        Query query = entityManager.createNativeQuery(sql.toString(), ListingEntity.class);
        query.setParameter("status", status);
        query.setParameter("deleted", deleted);
        query.setParameter("access", access);
        query.setParameter("now", now);
        return query.getResultList();
    }

    @Override
    public List<ListingEntity> searchByKey(String key) {
        String sql = """
                    SELECT DISTINCT l.*
                    FROM listings l
                    LEFT JOIN listing_categories lc ON l.id = lc.listing_id
                    LEFT JOIN categories c ON lc.category_id = c.id
                    LEFT JOIN listing_amenites la ON l.id = la.listing_id
                    LEFT JOIN amenites a ON la.amenites_id = a.id
                    WHERE
                        (LOWER(l.title) LIKE LOWER(CONCAT('%', :key, '%'))
                        OR LOWER(l.address) LIKE LOWER(CONCAT('%', :key, '%'))
                        OR LOWER(c.name) LIKE LOWER(CONCAT('%', :key, '%'))
                        OR LOWER(a.name) LIKE LOWER(CONCAT('%', :key, '%')))
                        AND l.deleted = FALSE
                        AND l.access = TRUE
                """;

        Query query = entityManager.createNativeQuery(sql, ListingEntity.class);
        query.setParameter("key", key);
        return query.getResultList();
    }

}
