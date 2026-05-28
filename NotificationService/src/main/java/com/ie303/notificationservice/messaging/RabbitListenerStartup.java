package com.ie303.notificationservice.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.RabbitListenerEndpointRegistry;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RabbitListenerStartup {

    private final RabbitListenerEndpointRegistry registry;
    private final ConnectionFactory connectionFactory;

    private volatile boolean started;

    @EventListener(ApplicationReadyEvent.class)
    public void startOnApplicationReady() {
        startListenersIfPossible();
    }

    @Scheduled(fixedDelayString = "${notification.rabbit.listener-retry-ms:30000}")
    public void retryStartWhenBrokerReturns() {
        if (started) {
            return;
        }

        startListenersIfPossible();
    }

    private void startListenersIfPossible() {
        if (started) {
            return;
        }

        try {
            connectionFactory.createConnection().close();
            registry.start();
            started = true;
            log.info("RabbitMQ listeners started successfully");
        } catch (Exception ex) {
            log.warn("RabbitMQ is not available yet; delaying listener startup: {}", ex.getMessage());
        }
    }
}