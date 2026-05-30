package com.ie303.uifive.repo;

import com.ie303.uifive.entity.PaymentTransaction;
import com.ie303.uifive.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepo extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTransactionCode(String transactionCode);

    Optional<PaymentTransaction> findByIdAndUser(Long id, User user);

    @Query("""
        select t
        from PaymentTransaction t
        left join fetch t.offer
        where t.user = :user
        order by t.createdAt desc
    """)
    List<PaymentTransaction> findByUserOrderByCreatedAtDesc(User user);

    @Query("""
        select t
        from PaymentTransaction t
        left join fetch t.offer
        order by t.createdAt desc
    """)
    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
}
