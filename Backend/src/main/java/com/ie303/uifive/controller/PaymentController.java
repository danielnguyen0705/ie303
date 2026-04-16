package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.PaymentCheckoutRequest;
import com.ie303.uifive.dto.req.PaymentOfferRequest;
import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.PaymentCheckoutResponse;
import com.ie303.uifive.dto.res.PaymentOfferResponse;
import com.ie303.uifive.dto.res.PaymentTransactionResponse;
import com.ie303.uifive.service.PaymentService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @RolesAllowed("ADMIN")
    @PostMapping("/offers")
    public ApiResponse<PaymentOfferResponse> createOffer(@RequestBody @Valid PaymentOfferRequest request) {
        return ApiResponse.<PaymentOfferResponse>builder()
                .code(1000)
                .result(paymentService.createOffer(request))
                .build();
    }

    @RolesAllowed("ADMIN")
    @PutMapping("/offers/{id}")
    public ApiResponse<PaymentOfferResponse> updateOffer(@PathVariable Long id,
                                                          @RequestBody @Valid PaymentOfferRequest request) {
        return ApiResponse.<PaymentOfferResponse>builder()
                .code(1000)
                .result(paymentService.updateOffer(id, request))
                .build();
    }

    @RolesAllowed("ADMIN")
    @GetMapping("/offers/{id}")
    public ApiResponse<PaymentOfferResponse> getOffer(@PathVariable Long id) {
        return ApiResponse.<PaymentOfferResponse>builder()
                .code(1000)
                .result(paymentService.getOffer(id))
                .build();
    }

    @RolesAllowed("ADMIN")
    @GetMapping("/offers")
    public ApiResponse<List<PaymentOfferResponse>> getAllOffers() {
        return ApiResponse.<List<PaymentOfferResponse>>builder()
                .code(1000)
                .result(paymentService.getAllOffers())
                .build();
    }

    @RolesAllowed("ADMIN")
    @DeleteMapping("/offers/{id}")
    public ApiResponse<String> deleteOffer(@PathVariable Long id) {
        paymentService.deleteOffer(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted payment offer")
                .result("Deleted payment offer")
                .build();
    }

    @GetMapping("/offers/active")
    public ApiResponse<List<PaymentOfferResponse>> getActiveOffers() {
        return ApiResponse.<List<PaymentOfferResponse>>builder()
                .code(1000)
                .result(paymentService.getActiveOffers())
                .build();
    }

    @PostMapping("/checkout/{offerId}")
    public ApiResponse<PaymentCheckoutResponse> checkout(@PathVariable Long offerId,
                                                         @RequestBody(required = false) PaymentCheckoutRequest request) {
        return ApiResponse.<PaymentCheckoutResponse>builder()
                .code(1000)
                .result(paymentService.checkout(offerId, request))
                .build();
    }

    @PostMapping("/mock-confirm/{transactionCode}")
    public ApiResponse<PaymentTransactionResponse> mockConfirm(@PathVariable String transactionCode,
                                                               @RequestParam(required = false) String providerTransactionId) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .result(paymentService.confirmPayment(transactionCode, providerTransactionId))
                .build();
    }

    @PostMapping("/webhook")
    public ApiResponse<PaymentTransactionResponse> webhook(@RequestBody @Valid PaymentWebhookRequest request) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .result(paymentService.processWebhook(request))
                .build();
    }

    @GetMapping("/my-transactions")
    public ApiResponse<List<PaymentTransactionResponse>> getMyTransactions() {
        return ApiResponse.<List<PaymentTransactionResponse>>builder()
                .code(1000)
                .result(paymentService.getMyTransactions())
                .build();
    }

    @GetMapping("/my-transactions/{transactionId}")
    public ApiResponse<PaymentTransactionResponse> getMyTransactionDetail(@PathVariable Long transactionId) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .result(paymentService.getMyTransactionDetail(transactionId))
                .build();
    }

    @PostMapping("/my-transactions/{transactionId}/cancel")
    public ApiResponse<PaymentTransactionResponse> cancelMyPendingTransaction(@PathVariable Long transactionId) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .result(paymentService.cancelMyPendingTransaction(transactionId))
                .build();
    }

    @RolesAllowed("ADMIN")
    @GetMapping("/transactions")
    public ApiResponse<List<PaymentTransactionResponse>> getAllTransactionsAdmin() {
        return ApiResponse.<List<PaymentTransactionResponse>>builder()
                .code(1000)
                .result(paymentService.getAllTransactionsAdmin())
                .build();
    }
}
