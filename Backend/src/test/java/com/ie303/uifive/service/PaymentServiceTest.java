package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentOffer;
import com.ie303.uifive.entity.PaymentOfferType;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentStatus;
import com.ie303.uifive.entity.PaymentTransaction;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.PaymentOfferRepo;
import com.ie303.uifive.repo.PaymentTransactionRepo;
import com.ie303.uifive.repo.UserRepo;
import com.ie303.uifive.service.payment.gateway.PaymentGateway;
import com.ie303.uifive.service.payment.gateway.VnpayPaymentGateway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentOfferRepo offerRepo;

    @Mock
    private PaymentTransactionRepo transactionRepo;

    @Mock
    private UserService userService;

    @Mock
    private UserRepo userRepo;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private VnpayPaymentGateway vnpayPaymentGateway;

    @Test
    void processWebhook_ShouldThrow_WhenSignatureIsInvalid() {
        PaymentOffer offer = new PaymentOffer();
        offer.setType(PaymentOfferType.COIN);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setTransactionCode("PAY-ABC");
        transaction.setAmountMoney(10000);
        transaction.setProvider(PaymentProvider.MOMO);
        transaction.setStatus(PaymentStatus.PENDING);
        transaction.setOffer(offer);

        PaymentWebhookRequest request = new PaymentWebhookRequest(
                "PAY-ABC",
                PaymentProvider.MOMO,
                PaymentStatus.SUCCESS,
                10000,
                "momo-trx-1",
                "bad-signature"
        );

        when(transactionRepo.findByTransactionCode("PAY-ABC")).thenReturn(Optional.of(transaction));
        when(paymentGateway.provider()).thenReturn(PaymentProvider.MOMO);
        when(paymentGateway.verifySignature(request)).thenReturn(false);

        PaymentService paymentService = new PaymentService(
                offerRepo,
                transactionRepo,
                userService,
                userRepo,
                List.of(paymentGateway),
                vnpayPaymentGateway
        );

        AppException exception = assertThrows(AppException.class, () -> paymentService.processWebhook(request));

        assertEquals(ErrorCode.PAYMENT_SIGNATURE_INVALID, exception.getErrorCode());
    }
}
