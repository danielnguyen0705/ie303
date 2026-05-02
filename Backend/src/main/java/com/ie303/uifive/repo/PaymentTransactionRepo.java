package com.ie303.uifive.repo;

import com.ie303.uifive.entity.PaymentTransaction;
import com.ie303.uifive.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepo extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTransactionCode(String transactionCode);

    Optional<PaymentTransaction> findByIdAndUser(Long id, User user);

    List<PaymentTransaction> findByUserOrderByCreatedAtDesc(User user);

    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
}
