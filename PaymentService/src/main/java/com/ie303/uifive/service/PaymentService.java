package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.PaymentCheckoutRequest;
import com.ie303.uifive.dto.req.PaymentOfferRequest;
import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.dto.res.PaymentCheckoutResponse;
import com.ie303.uifive.dto.res.PaymentOfferResponse;
import com.ie303.uifive.dto.res.PaymentTransactionResponse;
import com.ie303.uifive.entity.PaymentOffer;
import com.ie303.uifive.entity.PaymentOfferType;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentStatus;
import com.ie303.uifive.entity.PaymentTransaction;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.PaymentOfferRepo;
import com.ie303.uifive.repo.PaymentTransactionRepo;
import com.ie303.uifive.repo.UserRepo;
import com.ie303.uifive.service.payment.gateway.PaymentGateway;
import com.ie303.uifive.service.payment.gateway.VnpayPaymentGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentOfferRepo offerRepo;
    private final PaymentTransactionRepo transactionRepo;
    private final UserService userService;
    private final UserRepo userRepo;
    private final List<PaymentGateway> paymentGateways;
    private final VnpayPaymentGateway vnpayPaymentGateway;

    @Value("${payment.mock-confirm-enabled:false}")
    private boolean mockConfirmEnabled;

    public PaymentOfferResponse createOffer(PaymentOfferRequest request) {
        PaymentOffer offer = new PaymentOffer();
        applyOfferRequest(offer, request);
        offer = offerRepo.save(offer);
        return toOfferResponse(offer);
    }

    public PaymentOfferResponse updateOffer(Long id, PaymentOfferRequest request) {
        PaymentOffer offer = offerRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_OFFER_NOT_FOUND));

        applyOfferRequest(offer, request);
        offer = offerRepo.save(offer);
        return toOfferResponse(offer);
    }

    public void deleteOffer(Long id) {
        PaymentOffer offer = offerRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_OFFER_NOT_FOUND));
        offer.setActive(false);
        offerRepo.save(offer);
    }

    public PaymentOfferResponse getOffer(Long id) {
        return offerRepo.findById(id)
                .map(this::toOfferResponse)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_OFFER_NOT_FOUND));
    }

    public List<PaymentOfferResponse> getAllOffers() {
        return offerRepo.findAll().stream().map(this::toOfferResponse).toList();
    }

    public List<PaymentOfferResponse> getActiveOffers() {
        return offerRepo.findByActiveTrue().stream().map(this::toOfferResponse).toList();
    }

    public PaymentCheckoutResponse checkout(Long offerId, PaymentCheckoutRequest request) {
        User user = userService.getCurrentUser();
        PaymentOffer offer = offerRepo.findById(offerId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_OFFER_NOT_FOUND));

        PaymentProvider provider = request.provider();
        PaymentGateway gateway = resolveGateway(provider);
        ensureMockProviderEnabled(provider);

        if (!offer.isActive()) {
            throw new AppException(ErrorCode.PAYMENT_OFFER_NOT_AVAILABLE);
        }

        validateOfferForCheckout(offer);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setTransactionCode(generateTransactionCode());
        transaction.setUser(user);
        transaction.setOffer(offer);
        transaction.setType(offer.getType());
        transaction.setProvider(provider);
        transaction.setStatus(PaymentStatus.PENDING);
        transaction.setAmountMoney(offer.getPrice());
        transaction.setAmountCoin(offer.getCoinAmount() == null ? 0 : offer.getCoinAmount());
        transaction.setDurationDays(offer.getDurationDays());
        transaction.setBalanceBefore(user.getCoin());
        transaction.setBalanceAfter(user.getCoin());
        transaction.setVipExpiredBefore(user.getVipExpiredAt());
        transaction.setVipExpiredAfter(user.getVipExpiredAt());
        transaction.setDescription(offer.getDescription());

        transaction = transactionRepo.save(transaction);

        String paymentUrl = gateway.createPaymentUrl(transaction, request == null ? null : request.returnUrl());

        return new PaymentCheckoutResponse(
                transaction.getId(),
                transaction.getTransactionCode(),
                transaction.getType(),
                transaction.getProvider(),
                transaction.getAmountMoney(),
                transaction.getAmountCoin(),
                transaction.getDurationDays(),
                transaction.getStatus(),
                paymentUrl,
                "Tao giao dich thanh toan thanh cong, hay goi API webhook/callback de xac nhan"
        );
    }

    public PaymentTransactionResponse confirmPayment(String transactionCode, String providerTransactionId) {
        ensureMockConfirmEndpointEnabled();

        User currentUser = userService.getCurrentUser();
        PaymentTransaction transaction = transactionRepo.findByTransactionCode(transactionCode)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_TRANSACTION_NOT_FOUND));

        if (transaction.getProvider() != PaymentProvider.MOCK) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "mock-confirm is only available for MOCK transactions");
        }

        boolean owner = transaction.getUser() != null && transaction.getUser().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !owner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            return toTransactionResponse(transaction);
        }

        if (transaction.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_TRANSACTION_INVALID_STATUS);
        }

        transaction = markTransactionSuccess(transaction, providerTransactionId, PaymentProvider.MOCK);
        return toTransactionResponse(transaction);
    }

    public List<PaymentTransactionResponse> getMyTransactions() {
        User user = userService.getCurrentUser();
        return transactionRepo.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    public PaymentTransactionResponse getMyTransactionDetail(Long transactionId) {
        User user = userService.getCurrentUser();

        PaymentTransaction transaction = transactionRepo.findByIdAndUser(transactionId, user)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_TRANSACTION_NOT_FOUND));

        return toTransactionResponse(transaction);
    }

    public List<PaymentTransactionResponse> getAllTransactionsAdmin() {
        return transactionRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    public PaymentTransactionResponse cancelMyPendingTransaction(Long transactionId) {
        User user = userService.getCurrentUser();

        PaymentTransaction transaction = transactionRepo.findByIdAndUser(transactionId, user)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_TRANSACTION_NOT_FOUND));

        if (transaction.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_TRANSACTION_INVALID_STATUS);
        }

        transaction.setStatus(PaymentStatus.CANCELLED);
        transaction = transactionRepo.save(transaction);

        return toTransactionResponse(transaction);
    }

    public PaymentTransactionResponse processWebhook(PaymentWebhookRequest request) {
        PaymentTransaction transaction = transactionRepo.findByTransactionCode(request.transactionCode())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_TRANSACTION_NOT_FOUND));

        if (!Objects.equals(transaction.getAmountMoney(), request.amountMoney())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Webhook amount does not match transaction amount");
        }

        if (transaction.getProvider() != request.provider()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Webhook provider does not match transaction provider");
        }

        ensureMockProviderEnabled(request.provider());

        PaymentGateway gateway = resolveGateway(request.provider());
        if (!gateway.verifySignature(request)) {
            throw new AppException(ErrorCode.PAYMENT_SIGNATURE_INVALID);
        }

        if (request.status() == PaymentStatus.SUCCESS) {
            if (request.providerTransactionId() == null || request.providerTransactionId().isBlank()) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "providerTransactionId is required when status is SUCCESS");
            }
            transaction = markTransactionSuccess(transaction, request.providerTransactionId(), request.provider());
        } else if (request.status() == PaymentStatus.FAILED || request.status() == PaymentStatus.CANCELLED) {
            if (transaction.getStatus() == PaymentStatus.PENDING) {
                transaction.setStatus(request.status());
                transaction.setProvider(request.provider());
                transaction.setProviderTransactionId(request.providerTransactionId());
                transaction = transactionRepo.save(transaction);
            }
        } else {
            throw new AppException(ErrorCode.PAYMENT_TRANSACTION_INVALID_STATUS, "Webhook status is invalid for processing");
        }

        return toTransactionResponse(transaction);
    }

    public String processVnpayIpn(Map<String, String> params) {
        try {
            if (!vnpayPaymentGateway.verifyIpnSignature(params)) {
                return buildVnpayIpnResponse("97", "Invalid Signature");
            }

            String transactionCode = params.get("vnp_TxnRef");
            if (transactionCode == null || transactionCode.isBlank()) {
                return buildVnpayIpnResponse("99", "Invalid Request");
            }

            PaymentTransaction transaction = transactionRepo.findByTransactionCode(transactionCode).orElse(null);
            if (transaction == null || transaction.getProvider() != PaymentProvider.VNPAY) {
                return buildVnpayIpnResponse("01", "Order not found");
            }

            Integer amountMoney = parseVnpAmount(params.get("vnp_Amount"));
            if (amountMoney == null) {
                return buildVnpayIpnResponse("99", "Invalid amount");
            }

            if (!Objects.equals(transaction.getAmountMoney(), amountMoney)) {
                return buildVnpayIpnResponse("04", "Invalid Amount");
            }

            if (transaction.getStatus() == PaymentStatus.SUCCESS) {
                return buildVnpayIpnResponse("02", "Order already confirmed");
            }

            String providerTransactionId = params.get("vnp_TransactionNo");
            String responseCode = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            boolean success = "00".equals(responseCode)
                    && (transactionStatus == null || transactionStatus.isBlank() || "00".equals(transactionStatus));

            if (success) {
                markTransactionSuccess(transaction, providerTransactionId, PaymentProvider.VNPAY);
                return buildVnpayIpnResponse("00", "Confirm Success");
            }

            if (transaction.getStatus() == PaymentStatus.PENDING) {
                transaction.setStatus(PaymentStatus.FAILED);
                transaction.setProvider(PaymentProvider.VNPAY);
                transaction.setProviderTransactionId(providerTransactionId);
                transactionRepo.save(transaction);
            }

            return buildVnpayIpnResponse("00", "Confirm Success");
        } catch (Exception exception) {
            return buildVnpayIpnResponse("99", "Unknown error");
        }
    }

    private void applyOfferRequest(PaymentOffer offer, PaymentOfferRequest request) {
        offer.setName(request.name());
        offer.setDescription(request.description());
        offer.setType(request.type());
        offer.setPrice(request.price());
        offer.setCoinAmount(request.coinAmount());
        offer.setDurationDays(request.durationDays());
        offer.setActive(request.active() == null || request.active());
    }

    private void validateOfferForCheckout(PaymentOffer offer) {
        if (offer.getType() == PaymentOfferType.VIP && (offer.getDurationDays() == null || offer.getDurationDays() <= 0)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "VIP offer must have durationDays > 0");
        }

        if (offer.getType() == PaymentOfferType.COIN && (offer.getCoinAmount() == null || offer.getCoinAmount() <= 0)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Coin offer must have coinAmount > 0");
        }
    }

    private PaymentOfferResponse toOfferResponse(PaymentOffer offer) {
        return new PaymentOfferResponse(
                offer.getId(),
                offer.getName(),
                offer.getDescription(),
                offer.getType(),
                offer.getPrice(),
                offer.getCoinAmount(),
                offer.getDurationDays(),
                offer.isActive(),
                offer.getCreatedAt()
        );
    }

    private PaymentTransactionResponse toTransactionResponse(PaymentTransaction transaction) {
        return new PaymentTransactionResponse(
                transaction.getId(),
                transaction.getTransactionCode(),
                transaction.getType(),
                transaction.getProvider(),
                transaction.getStatus(),
                transaction.getAmountMoney(),
                transaction.getAmountCoin(),
                transaction.getDurationDays(),
                transaction.getBalanceBefore(),
                transaction.getBalanceAfter(),
                transaction.getVipExpiredBefore(),
                transaction.getVipExpiredAfter(),
                transaction.getDescription(),
                transaction.getProviderTransactionId(),
                transaction.getCreatedAt(),
                transaction.getPaidAt(),
                transaction.getOffer() == null ? null : transaction.getOffer().getId(),
                transaction.getOffer() == null ? null : transaction.getOffer().getName()
        );
    }

    private PaymentTransaction markTransactionSuccess(PaymentTransaction transaction,
                                                      String providerTransactionId,
                                                      PaymentProvider provider) {
        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            return transaction;
        }

        if (transaction.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_TRANSACTION_INVALID_STATUS);
        }

        User user = transaction.getUser();
        PaymentOffer offer = transaction.getOffer();

        int coinBefore = user.getCoin();
        int coinAfter = coinBefore;
        LocalDateTime vipBefore = user.getVipExpiredAt();
        LocalDateTime vipAfter = vipBefore;

        if (offer.getType() == PaymentOfferType.COIN) {
            coinAfter = coinBefore + offer.getCoinAmount();
            user.setCoin(coinAfter);
        } else if (offer.getType() == PaymentOfferType.VIP) {
            LocalDateTime now = LocalDateTime.now();
            if (vipBefore == null || vipBefore.isBefore(now)) {
                vipAfter = now.plusDays(offer.getDurationDays());
            } else {
                vipAfter = vipBefore.plusDays(offer.getDurationDays());
            }
            user.setVipExpiredAt(vipAfter);
        }

        transaction.setBalanceBefore(coinBefore);
        transaction.setBalanceAfter(coinAfter);
        transaction.setVipExpiredBefore(vipBefore);
        transaction.setVipExpiredAfter(vipAfter);
        transaction.setProviderTransactionId(providerTransactionId);
        transaction.setProvider(provider);
        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setPaidAt(LocalDateTime.now());

        userRepo.save(user);
        return transactionRepo.save(transaction);
    }

    private String generateTransactionCode() {
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private Integer parseVnpAmount(String amountInMinorUnit) {
        if (amountInMinorUnit == null || amountInMinorUnit.isBlank()) {
            return null;
        }

        try {
            long minor = Long.parseLong(amountInMinorUnit);
            if (minor < 0 || minor % 100 != 0) {
                return null;
            }

            long major = minor / 100;
            if (major > Integer.MAX_VALUE) {
                return null;
            }

            return (int) major;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String buildVnpayIpnResponse(String responseCode, String message) {
        String safeCode = responseCode == null ? "99" : responseCode;
        String safeMessage = (message == null || message.isBlank())
                ? "Unknown error"
                : message.replace(" ", "+");
        return "RspCode=" + safeCode + "&Message=" + safeMessage;
    }

    private void ensureMockConfirmEndpointEnabled() {
        if (!mockConfirmEnabled) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "mock-confirm endpoint is disabled");
        }
    }

    private void ensureMockProviderEnabled(PaymentProvider provider) {
        if (provider == PaymentProvider.MOCK && !mockConfirmEnabled) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "MOCK payment provider is disabled");
        }
    }

    private PaymentGateway resolveGateway(PaymentProvider provider) {
        return paymentGateways.stream()
                .filter(gateway -> gateway.provider() == provider)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_PROVIDER_NOT_SUPPORTED));
    }
}
