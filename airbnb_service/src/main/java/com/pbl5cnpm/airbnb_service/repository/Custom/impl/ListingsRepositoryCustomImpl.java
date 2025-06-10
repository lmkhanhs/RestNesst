package com.pbl5cnpm.airbnb_service.repository.Custom.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.repository.Custom.ListingsRepositoryCustom;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

@Repository
public class ListingsRepositoryCustomImpl implements ListingsRepositoryCustom {
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ListingEntity> findAllAndStatus(String status, boolean deleted, boolean access, LocalDate now,
            boolean sort) {
        StringBuilder sql = new StringBuilder(
                "SELECT * FROM listings WHERE status = :status AND deleted = :deleted AND access = :access");
        sql.append(" AND start_date <= :now AND end_date >= :now");
        if (sort) {
            sql.append(" ORDER BY position ASC");
        }
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
                        AND l.status = 'ACTIVE'
                    ORDER BY l.position DESC;
                """;

        Query query = entityManager.createNativeQuery(sql, ListingEntity.class);
        query.setParameter("key", key);
        return query.getResultList();
    }

    @Override
    public List<ListingEntity> filter(Map<String, String> args, List<String> amenityIds) {
        StringBuilder sql = new StringBuilder("SELECT l.*");
        StringBuilder table = new StringBuilder(" FROM listings l ");
        StringBuilder where = new StringBuilder(
                " WHERE l.deleted = FALSE AND l.access = TRUE AND l.status = 'ACTIVE' ");

        boolean hasAmenityFilter = (amenityIds != null && !amenityIds.isEmpty());

        if (hasAmenityFilter) {
            table.append(" INNER JOIN listing_amenites la ON l.id = la.listing_id ");
            table.append(" INNER JOIN amenites a ON la.amenites_id = a.id ");
            where.append(" AND a.id IN (");
            for (int i = 0; i < amenityIds.size(); i++) {
                where.append(amenityIds.get(i));
                if (i < amenityIds.size() - 1) {
                    where.append(", ");
                }
            }
            where.append(")");
        }

        if (args.containsKey("lowestPrice")) {
            where.append(" AND l.price >= ").append(args.get("lowestPrice"));
        }
        if (args.containsKey("highestPrice")) {
            where.append(" AND l.price <= ").append(args.get("highestPrice"));
        }
        if (args.containsKey("country")) {
            table.append(" INNER JOIN countries c ON l.country_id = c.id ");
            where.append(" AND c.name = '").append(args.get("country")).append("'");
        }
        if (args.containsKey("category_id")) {
            table.append(" INNER JOIN listing_categories lc ON l.id = lc.listing_id ");
            table.append(" INNER JOIN categories cg ON lc.category_id = cg.id ");
            where.append(" AND cg.id = '").append(args.get("category_id")).append("'");
        }
        if (args.containsKey("startDate")) {
            where.append(" AND l.start_date <= '").append(args.get("startDate")).append("'");
        }
        if (args.containsKey("endDate")) {
            where.append(" AND l.end_date >= '").append(args.get("endDate")).append("'");
        }
        if (args.containsKey("popular")) {
            where.append(" AND l.popular = ").append(args.get("popular"));
        }
        sql.append(table).append(where);
        if (hasAmenityFilter) {
            sql.append(" GROUP BY l.id");
            sql.append(" HAVING COUNT(DISTINCT a.id) = ").append(amenityIds.size());

        }
        sql.append(" ORDER BY l.position DESC");
        Query query = entityManager.createNativeQuery(sql.toString(), ListingEntity.class);
        return query.getResultList();
    }

    @Override
    public void updateAvgStart() {
        StringBuilder sql = new StringBuilder();
        sql.append("""
                    UPDATE listings l
                    SET avg_start = (
                        SELECT COALESCE(AVG(r.rating), 0)
                        FROM reviews r
                        WHERE r.listing_id = l.id
                    )
                    WHERE l.id IN (
                        SELECT DISTINCT r.listing_id FROM reviews r
                    )
                """);
        Query query = entityManager.createNativeQuery(sql.toString());
        query.executeUpdate();
    }

    @Override
    public void updatePopular() {
        String sql = """
                        UPDATE listings l
                        SET l.popular = true
                        WHERE l.id IN (
                                SELECT r.id
                                FROM reviews r
                                GROUP BY r.id
                                HAVING COUNT(r.id) > 5
                            )
                """;
        Query query = entityManager.createNativeQuery(sql.toString());
        query.executeUpdate();
    }
}
