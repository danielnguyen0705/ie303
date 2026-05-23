package com.ie303.uifive.repo;

import com.ie303.uifive.entity.PaymentOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentOfferRepo extends JpaRepository<PaymentOffer, Long> {
    List<PaymentOffer> findByActiveTrue();
}
