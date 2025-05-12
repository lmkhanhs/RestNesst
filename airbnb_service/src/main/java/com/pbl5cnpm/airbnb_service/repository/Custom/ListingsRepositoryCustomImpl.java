package com.pbl5cnpm.airbnb_service.repository.Custom;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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

    @Override
    public List<ListingEntity> filter(Map<String, String> args, List<String> amenities) {
        StringBuilder sql = new StringBuilder("SELECT DISTINCT l.*");
        StringBuilder table = new StringBuilder(" FROM listings l ");
        StringBuilder condition = new StringBuilder(" WHERE l.deleted = FALSE AND l.access = TRUE ");
        if (amenities != null) {
            table.append(" INNER JOIN listing_amenites la ON l.id = la.listing_id ");
            table.append(" INNER JOIN amenites a ON la.amenites_id = a.id ");

            for (String string : amenities) {
                condition.append(" AND a.name = '" + string + "'");
            }
        }
        if (args.containsKey("lowestPrice")) {
            String lowestPrice = args.get("lowestPrice");
            condition.append(" AND l.price >= " + lowestPrice);
        }
        if (args.containsKey("highestPrice")) {
            String highestPrice = args.get("highestPrice");
            condition.append(" AND l.price <= " + highestPrice);
        }
        if (args.containsKey("country")) {
            String country = args.get("country");
            table.append(" INNER JOIN countries c ON l.country_id = c.id");
            condition.append(" AND c.name = '" + country + "'");
        }
        if (args.containsKey("category")) {
            String category = args.get("category");
            table.append(" INNER JOIN listing_categories lc ON l.id = lc.listing_id");
            table.append(" INNER JOIN categories cg ON lc.category_id = cg.id");
            condition.append(" AND cg.name = '" + category + "'");
        }
        if (args.containsKey("startDate")) {
            String startDay = args.get("startDate");
            condition.append(" AND l.start_date <= '" + startDay + "'");
        }
        if (args.containsKey("endDate")) {
            String endDate = args.get("endDate");
            condition.append(" AND l.end_date >= '" + endDate + "'");
        }
        if (args.containsKey("popular")) {
            String popular = args.get("popular");
            condition.append(" AND l.popular = " + popular);
        }

        sql.append(table).append(condition);
        Query query = entityManager.createNativeQuery(sql.toString(), ListingEntity.class);
        return query.getResultList();

    }

}
